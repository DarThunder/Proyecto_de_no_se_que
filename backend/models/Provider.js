import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

/**
 * @typedef {Object} ProviderDocument
 * @property {Object} _id - ID proveedor (ObjectId)
 * @property {string} name - Nombre
 * @property {string} contactName - Contacto
 * @property {string} email - Email
 * @property {string} phone - Teléfono
 * @property {string} address - Dirección
 * @property {boolean} active - Activo
 */

const providerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    contactName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default model("Provider", providerSchema);
