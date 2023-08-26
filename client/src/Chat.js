import React, { useEffect, useState, useContext, useRef } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "./UserContext";
import { uniqBy } from "lodash";
import axios from "axios";

const Chat = () => {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [offlinePeople, setOfflinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessageText, setNewMessageText] = useState("");
  const [messages, setMessages] = useState([]); // [{senderId, text}
  const { ctxUsername, ctxId } = useContext(UserContext);
  const divUnderMessages = useRef();

  // trying to reconnect if somehow user is disconnected from ws server
  useEffect(() => {
    connectToWs();
  }, []);

  function connectToWs() {
    const ws = new WebSocket("ws://localhost:4000");
    setWs(ws);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("close", () => {
      setTimeout(() => {
        console.log("Disconnected! Trying to reconnect");
        connectToWs();
      }, 1000);
    }); // try to reconnect
  }

  function showOnlinPeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({ username, userId }) => {
      people[userId] = username;
    });

    setOnlinePeople(people);
  }

  function handleMessage(event) {
    const messageData = JSON.parse(event.data);
    if ("online" in messageData) {
      showOnlinPeople(messageData.online);
    } else if ("text" in messageData) {
      setMessages((prev) => {
        return [...prev, { ...messageData }];
      });
    }
  }

  function sendMessage(e) {
    e.preventDefault();
    ws.send(
      JSON.stringify({
        recipient: selectedUserId,
        text: newMessageText,
      })
    );
    setNewMessageText("");
    setMessages((prev) => {
      return [
        ...prev,
        {
          _id: Date.now(),
          isOur: true,
          text: newMessageText,
          sender: ctxId,
          recipient: selectedUserId,
        },
      ];
    });
  }

  // to get the scrollbar at the bottom of the chat page
  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) {
      div.scrollIntoView({ behaviour: "scroll", block: "end" });
    }
  }, [messages]);

  useEffect(() => {
    axios.get("/people").then((res) => {
      const offlinePeopleWithoutMeArr = res.data
        .filter((p) => p._id !== ctxId)
        .filter((p) => !Object.keys(onlinePeople).includes(p._id));

      const offlinePeople = {};
      offlinePeopleWithoutMeArr.forEach((p) => {
        offlinePeople[p._id] = p;
      });
      setOfflinePeople(offlinePeople);
    });
  }, offlinePeople);

  useEffect(() => {
    if (selectedUserId) {
      axios.get("/messages/" + selectedUserId).then((res) => {
        setMessages(res.data);
      });
    }
  }, selectedUserId);

  // created duplicated object to exclude our user from onlinePeople
  const onlinePeopleExclOurUser = { ...onlinePeople };
  delete onlinePeopleExclOurUser[ctxId];

  // unique message
  const messsageWithoutDups = uniqBy(messages, "_id");

  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3">
        <Logo />
        {Object.keys(onlinePeopleExclOurUser).map((userId) => {
          return (
            <div
              key={userId}
              onClick={() => setSelectedUserId(userId)}
              className={
                "border-b border-gray-100 flex items-center gap-2 cursor-pointer " +
                (userId === selectedUserId ? " bg-blue-50" : "")
              }
            >
              {userId === selectedUserId && (
                <div className="w-1 bg-blue-500 h-12 rounded-r-md"></div>
              )}
              <div className="flex gap-2 items-center py-2 pl-4">
                <Avatar
                  online={true}
                  username={onlinePeople[userId]}
                  userId={userId}
                />
                <span className="text-gray-800">{onlinePeople[userId]}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col bg-blue-50 w-2/3 p-2">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex h-full items-center justify-center">
              <div className="text-gray-400">
                &larr; Select a person from the sidebar
              </div>
            </div>
          )}

          {!!selectedUserId && (
            <div className="relative h-full mb-4">
              <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                {messsageWithoutDups.map((message) => {
                  return (
                    <div
                      key={message._id}
                      className={
                        message.sender === ctxId ? "text-right" : "text-left"
                      }
                    >
                      <div
                        className={
                          "text-left p-2 my-2 rounded-md text-sm inline-block " +
                          (message.sender === ctxId
                            ? "bg-blue-500 text-white"
                            : "bg-white text-gray-500")
                        }
                      >
                        {message.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={divUnderMessages}></div>
              </div>
            </div>
          )}
        </div>

        {!!selectedUserId && (
          <form className="flex gap-2" onSubmit={sendMessage}>
            <input
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              type="text"
              placeholder="Type your message here..."
              className="bg-white p-2 border flex-grow rounded-sm"
            />
            <button
              type="submit"
              className="bg-blue-500 p-2 text-white rounded-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Chat;
