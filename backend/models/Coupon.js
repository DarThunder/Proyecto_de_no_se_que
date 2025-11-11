import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const couponSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    expiration_date: {
      type: Date,
    },
    maximum_uses: {
      type: Number,
      default: null,
    },
    actual_uses: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default model("Coupon", couponSchema);
