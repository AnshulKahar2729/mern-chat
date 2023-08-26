const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const messageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    text: {
      type: String,
    },
  },
  { timestamps: true }
);

const MessageModel = model("Message", messageSchema);
module.exports = MessageModel;
