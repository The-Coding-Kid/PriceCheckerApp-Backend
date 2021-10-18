import { type } from "os";

//@ts-ignore
const mongoose = require("mongoose");
//@ts-ignore
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

const Category = mongoose.model("Category", CategorySchema);
module.exports = Category;
