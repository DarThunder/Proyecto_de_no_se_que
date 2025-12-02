import mongoose, { model } from "mongoose";
const { Schema } = mongoose;
import ProductVariant from "./ProductVariant.js";

/**
 * @typedef {Object} SaleItem
 * @property {Object} variant - Variante vendida (ObjectId)
 * @property {number} quantity - Cantidad
 * @property {number} unit_price - Precio al momento de la venta
 * @property {number} discount_rate - Descuento aplicado al ítem
 */

/**
 * @typedef {Object} ShippingAddress
 * @property {string} full_name - Nombre del receptor
 * @property {string} address - Calle y número
 * @property {string} city - Ciudad
 * @property {string} state - Estado/Provincia
 * @property {string} zip_code - Código postal
 * @property {string} country - País (default MX)
 */

/**
 * @typedef {Object} SaleDocument
 * @property {Object} _id - ID de la venta (ObjectId)
 * @property {Object} user - Cliente que compró (ObjectId)
 * @property {Object} [cashier] - Cajero (ObjectId, opcional)
 * @property {SaleItem[]} items - Detalles de la venta
 * @property {number} total - Monto total pagado
 * @property {'CASH'|'CARD'|'ONLINE'} payment_method - Método de pago
 * @property {'POS'|'WEB'|'RETURN'} transaction_type - Origen de la venta
 * @property {ShippingAddress} [shipping_address] - Dirección (solo para WEB)
 * @property {'Processing'|'Shipped'|'Delivered'|'Cancelled'} shipping_status - Estado del envío
 * @property {string} [tracking_number] - Número de guía
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

const saleItemSchema = new Schema(
  {
    variant: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit_price: {
      type: Number,
      required: true,
    },
    discount_rate: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema(
  {
    full_name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip_code: { type: String, required: true },
    country: { type: String, required: true, default: "MX" },
  },
  { _id: false }
);

const saleSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cashier: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    items: [saleItemSchema],
    total: {
      type: Number,
      required: true,
    },
    payment_method: {
      type: String,
      enum: ["CASH", "CARD", "ONLINE"],
      required: true,
    },
    transaction_type: {
      type: String,
      enum: ["POS", "WEB", "RETURN"],
      required: true,
    },

    shipping_address: {
      type: shippingAddressSchema,
      required: function () {
        return this.transaction_type === "WEB";
      },
    },
    shipping_status: {
      type: String,
      enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Processing",
    },
    tracking_number: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default model("Sale", saleSchema);
