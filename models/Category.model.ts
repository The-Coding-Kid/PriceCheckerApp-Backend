import mongoose from "mongoose";

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
export default Category;
