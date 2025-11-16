import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    image_url: {
      type: String,
      trim: true,
      default: "sources/img/category_default.png",
    }
  },
  { timestamps: true }
);

categorySchema.index({ name: "text", description: "text" });

export default model("Category", categorySchema);