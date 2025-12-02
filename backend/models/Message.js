import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * @typedef {Object} MessageDocument
 * @property {Object} _id - ID del mensaje (ObjectId)
 * @property {'reorder'} type - Tipo
 * @property {string} productName - Producto
 * @property {string} variantId - Variante ID
 * @property {string} supplier - Proveedor ID
 * @property {string} supplierName - Proveedor Nombre
 * @property {number} quantity - Cantidad
 * @property {string} urgency - Urgencia
 * @property {string} orderId - ID Orden
 * @property {string} requestedBy - Solicitante
 * @property {string} notes - Notas
 * @property {string} status - Estado
 * @property {boolean} read - Leído
 * @property {string} rejectionReason - Razón rechazo
 * @property {Date} approvedAt - Fecha aprobación
 * @property {Date} rejectedAt - Fecha rechazo
 */

const messageSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["reorder"],
    },
    productName: {
      type: String,
      required: true,
    },
    variantId: {
      type: String,
      required: true,
    },
    supplier: {
      type: String,
      required: true,
    },
    supplierName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    urgency: {
      type: String,
      required: true,
      enum: ["normal", "urgent", "critical"],
    },
    orderId: {
      type: String,
      default: "N/A",
    },
    requestedBy: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    read: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ type: 1, createdAt: -1 });
messageSchema.index({ status: 1 });
messageSchema.index({ read: 1 });

export default mongoose.model("Message", messageSchema);
