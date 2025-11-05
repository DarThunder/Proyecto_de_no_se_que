import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const productVariantSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    size: {
      type: String,
      enum: ["XS", "S", "M", "L", "XL"],
      required: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

productVariantSchema.index({ product: 1, size: 1 }, { unique: true });

export default model("ProductVariant", productVariantSchema);
