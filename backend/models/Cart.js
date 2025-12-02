import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

/**
 * @typedef {Object} CartItem
 * @property {Object} variant - Referencia a la Variante del Producto (ObjectId)
 * @property {number} quantity - Cantidad seleccionada
 * @property {Object} _id - ID único del ítem (ObjectId)
 */

/**
 * @typedef {Object} CartDocument
 * @property {Object} _id - ID del carrito (ObjectId)
 * @property {Object} user - Dueño del carrito (ObjectId)
 * @property {CartItem[]} items - Lista de productos en el carrito
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

const cartItemSchema = new Schema(
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
      default: 1,
    },
  },
  { _id: true }
);

const cartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

export default model("Cart", cartSchema);
