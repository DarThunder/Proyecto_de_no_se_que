import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const cuponSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    descuento: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    codigo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    fecha_expiracion: {
      type: Date,
    },
    usos_maximos: {
      type: Number,
      default: null,
    },
    usos_actuales: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default model("Cupon", cuponSchema);