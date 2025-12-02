import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

/**
 * @typedef {Object} CashMovementDocument
 * @property {Object} _id - ID del movimiento (ObjectId)
 * @property {Object} user - Usuario que registró el movimiento (ObjectId)
 * @property {'IN'|'OUT'} type - Tipo de movimiento
 * @property {number} amount - Monto
 * @property {string} description - Descripción
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

const cashMovementSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default model("CashMovement", cashMovementSchema);
