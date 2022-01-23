//@ts-ignore
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

export interface IUser {
  email: string;
  username: string;
  password: string;
}

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  // _id: {
  // 	type: String,
  // 	required: false,
  // },
});

//@ts-ignore
const User = mongoose.model<IUser>("User", userSchema);
module.exports = User;
