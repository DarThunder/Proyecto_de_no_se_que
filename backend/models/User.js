import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

/**
 * @typedef {Object} UserDocument
 * @property {Object} _id - ID único del usuario (ObjectId)
 * @property {string} username - Nombre de usuario para login
 * @property {string} password_hash - Contraseña encriptada
 * @property {string} [email] - Correo electrónico (opcional, sparse index)
 * @property {Object} role - ID del Rol asignado (ObjectId)
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de última actualización
 */

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      sparse: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default model("User", userSchema);
