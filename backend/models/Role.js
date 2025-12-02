import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

/**
 * @typedef {Object} RoleDocument
 * @property {string} name - Nombre único del rol (ej: 'admin', 'user')
 * @property {number} permission_ring - Nivel de jerarquía (0 es más alto)
 * @property {string[]} allowed_modules - Lista de módulos a los que tiene acceso
 * @property {string} description - Descripción opcional del rol
 * @property {Date} createdAt - Fecha de creación (automática)
 * @property {Date} updatedAt - Fecha de última actualización (automática)
 */

const roleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    permission_ring: {
      type: Number,
      required: true,
      min: 0,
    },
    allowed_modules: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

export default model("Role", roleSchema);
