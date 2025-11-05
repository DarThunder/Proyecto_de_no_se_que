import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    base_price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" });

export default model("Product", productSchema);
