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

    image_url: {
      type: String,
      trim: true,
      default: "sources/img/logo_negro.png",
    },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: ["hombre", "mujer", "unisex"],
    },
    productType: { type: String, required: true, lowercase: true },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" });

export default model("Product", productSchema);
