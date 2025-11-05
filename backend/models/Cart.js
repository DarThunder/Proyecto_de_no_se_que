import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

// Define el esquema para un ítem dentro del carrito
const cartItemSchema = new Schema(
  {
    variant: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant", // Referencia a tu modelo de variantes de producto
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  { _id: false } // No es necesario un _id para los subdocumentos de items
);

// Define el esquema principal del carrito
const cartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User", // Referencia a tu modelo User
      required: true,
      unique: true, // Cada usuario tiene solo un carrito
      index: true,
    },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

export default model("Cart", cartSchema);