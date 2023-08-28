const express = require("express");
const { mongoose } = require("mongoose");
const User = require("./models/User");
const Message = require("./models/Message");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const ws = require("ws");

const app = express();

require("dotenv").config();
const PORT = process.env.PORT || 8080;
const DB_URL = process.env.MONGO_URL;
const jwtSecret = process.env.JWT_SECRET;
const CLIENTURL = process.env.CLIENT_URL;
const salt = bcrypt.genSaltSync(10);

mongoose
  .connect(DB_URL)
  .then(() => {
    console.log("Connected to DB...");
  })
  .catch((err) => console.log(err));

// middlewares
app.use(express.json());
app.use(cors({ credentials: true, origin: CLIENTURL }));
app.use(cookieParser());

// *function for getting a token from the cookie and further verifiying it using jwt
/* const { token } = req.cookies;
if (token) {
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    res.json(userData);
  });
} else {
  res.status(401).json("No token found");
} */

async function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) => {
    const { token } = req.cookies;
    if (token) {
      jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    } else {
      reject("No token found");
    }
  });
}

app.get("/test", (req, res) => {
  res.json("Hello World!");
});

app.get("/messages/:userId", async (req, res) => {
  const { userId } = req.params;
  const userData = await getUserDataFromRequest(req);
  const ourUserId = userData.userId;
  const messages = await Message.find({
    sender: { $in: [ourUserId, userId] },
    recipient: { $in: [ourUserId, userId] },
  }).sort({ createdAt: 1 });

  res.json(messages);
});

app.get("/people", async (req, res) => {
  const userDoc = await User.find({}, {'_id':true, 'username':true});
  res.json(userDoc);
});

app.get("/profile", async (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    res.status(401).json("No token found");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const userDoc = await User.findOne({ username });

  if (userDoc) {
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      jwt.sign(
        { userId: userDoc._id, username },
        jwtSecret,
        {},
        (err, token) => {
          res.cookie("token", token, { sameSite: "none", secure: true }).json({
            id: userDoc._id,
          });
        }
      );
    }
  } else {
    res.status(401).json("No Such Username");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("token").json("Logged Out");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = bcrypt.hashSync(password, salt);
    const userDoc = await User.create({ username, password: hashedPassword });
    jwt.sign({ userId: userDoc._id, username }, jwtSecret, {}, (err, token) => {
      if (err) throw err;
      res
        .cookie("token", token, { sameSite: "none", secure: true })
        .status(201)
        .json({
          id: userDoc._id,
        });
    });
  } catch (err) {
    if (err) throw err;
    res.status(500).json(err);
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const wss = new ws.WebSocketServer({ server });

// on each connection get the user id from the cookie
wss.on("connection", (connection, req) => {
  console.log("New connection");
  const cookies = req.headers.cookie;
  if (cookies) {
    // console.log(cookies);
    const tokenCookieString = cookies
      .split(";")
      .find((str) => str.includes("token="));
    if (tokenCookieString) {
      const token = tokenCookieString.split("=")[1];
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        const { userId, username } = userData;
        connection.userId = userId;
        connection.username = username;
      });
    }
  }

  // when we receive a message from the client
  connection.on("message", async (message) => {
    const messageData = JSON.parse(message.toString());
    const { recipient, text } = messageData;
    if (recipient && text) {
      // save the message to the DB
      const messageDoc = await Message.create({
        sender: connection.userId,
        recipient,
        text,
      });

      [...wss.clients]
        .filter((c) => c.userId === recipient)
        .forEach((c) =>
          c.send(
            JSON.stringify({
              sender: connection.userId,
              recipient,
              text,
              _id: messageDoc._id,
            })
          )
        );
    }
  });

  // telling everyone that we have a new user
  [...wss.clients].forEach((client) => {
    client.send(
      JSON.stringify({
        online: [...wss.clients].map((c) => ({
          username: c.username,
          userId: c.userId,
        })),
      })
    );
  });
});
