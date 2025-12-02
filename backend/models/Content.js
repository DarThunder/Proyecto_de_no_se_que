import { Schema, model } from "mongoose";

/**
 * @typedef {Object} ContentDocument
 * @property {Object} _id - ID del contenido (ObjectId)
 * @property {string} name - Identificador (slug)
 * @property {string} htmlContent - HTML guardado
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

const contentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    htmlContent: {
      type: String,
      required: true,
      default: "Aún no se ha definido el contenido.",
    },
  },
  {
    timestamps: true,
  }
);

const Content = model("Content", contentSchema);

export default Content;
