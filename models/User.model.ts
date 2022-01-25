import mongoose from "mongoose";
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

const User = mongoose.model<IUser>("User", userSchema);
export default User;
