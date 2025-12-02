import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

/**
 * @typedef {Object} CouponDocument
 * @property {Object} _id - ID del cupón (ObjectId)
 * @property {string} name - Nombre
 * @property {number} discount - Descuento
 * @property {string} code - Código
 * @property {boolean} active - Estado
 * @property {Date} [expiration_date] - Expiración
 * @property {number} [maximum_uses] - Uso máx
 * @property {number} actual_uses - Uso actual
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

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
