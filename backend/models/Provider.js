// backend/models/Provider.js
import mongoose from "mongoose";

const providerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // Evita proveedores duplicados
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
      default: true, // Para "borrado lógico" si lo prefieres, o solo informativo
    },
  },
  {
    timestamps: true, // Crea automáticamente createdAt y updatedAt
  }
);

export default mongoose.model("Provider", providerSchema);