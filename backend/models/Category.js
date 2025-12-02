import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

/**
 * @typedef {Object} CategoryDocument
 * @property {Object} _id - ID de la categoría (ObjectId)
 * @property {string} name - Nombre
 * @property {string} [description] - Descripción
 * @property {boolean} isActive - Estado
 * @property {string} image_url - Imagen
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    image_url: {
      type: String,
      trim: true,
      default: "sources/img/category_default.png",
    },
  },
  { timestamps: true }
);

categorySchema.index({ name: "text", description: "text" });

export default model("Category", categorySchema);
