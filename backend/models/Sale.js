import mongoose, { model } from "mongoose";
const { Schema } = mongoose;
import ProductVariant from "./ProductVariant.js";

const saleItemSchema = new Schema(
  {
    variant: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit_price: {
      type: Number,
      required: true,
    },
    discount_rate: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema(
  {
    full_name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip_code: { type: String, required: true },
    country: { type: String, required: true, default: "MX" },
  },
  { _id: false }
);

const saleSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cashier: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    items: [saleItemSchema],
    total: {
      type: Number,
      required: true,
    },
    payment_method: {
      type: String,
      enum: ["CASH", "CARD", "ONLINE"],
      required: true,
    },
    transaction_type: {
      type: String,
      enum: ["POS", "WEB", "RETURN"],
      required: true,
    },

    shipping_address: {
      type: shippingAddressSchema,
      required: function () {
        return this.transaction_type === "WEB";
      },
    },
    shipping_status: {
      type: String,
      enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Processing",
    },
    tracking_number: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default model("Sale", saleSchema);
