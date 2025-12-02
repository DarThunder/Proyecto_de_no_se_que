import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

/**
 * @typedef {Object} ProductDocument
 * @property {Object} _id - ID del producto (ObjectId)
 * @property {string} name - Nombre del producto
 * @property {number} base_price - Precio base
 * @property {string} [description] - Descripción del producto
 * @property {string} [image_url] - URL de la imagen principal
 * @property {'hombre'|'mujer'|'unisex'} category - Categoría de género
 * @property {string} productType - Tipo de prenda (ej: 'camisa', 'pantalon')
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

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
