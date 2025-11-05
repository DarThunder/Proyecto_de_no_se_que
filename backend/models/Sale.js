import mongoose, { model } from "mongoose";
const { Schema } = mongoose;
import ProductVariant from "./ProductVariant.js";

const salesItemSchema = new Schema(
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
      min: 0,
    },
    discount_rate: {
      type: Number,
      default: 0.0,
      min: 0.0,
      max: 1.0,
    },
    final_line_total: {
      type: Number,
      min: 0,
    },
  },
  { _id: false }
);

const saleSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    cashier: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sale_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    transaction_type: {
      type: String,
      required: true,
      enum: ["POS", "WEB"],
    },
    payment_method: {
      type: String,
      required: true,
      enum: ["CASH", "CARD", "TRANSFER", "WALLET", "OTHER"],
    },
    total: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    items: [salesItemSchema],
  },
  { timestamps: true }
);

saleSchema.pre("save", function (next) {
  this.total = this.items.reduce((acc, item) => {
    item.final_line_total =
      item.unit_price * item.quantity * (1 - item.discount_rate);
    return acc + item.final_line_total;
  }, 0);

  next();
});

saleSchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next();
  }

  try {
    const stockUpdates = this.items.map((item) => {
      return ProductVariant.findByIdAndUpdate(
        item.variant,
        {
          $inc: { stock: -item.quantity },
          $push: { __stock_check: { $gte: item.quantity } },
        },
        { new: true }
      ).exec();
    });

    const updatedVariants = await Promise.all(stockUpdates);

    for (let i = 0; i < updatedVariants.length; i++) {
      if (updatedVariants[i] === null) {
        const failedItem = this.items[i];
        const variant = await ProductVariant.findById(
          failedItem.variant
        ).select("sku stock");

        const errorMsg = `Stock insuficiente para SKU ${variant.sku}. Solicitado: ${failedItem.quantity}, Disponible: ${variant.stock}`;

        return next(new Error(errorMsg));
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

export default model("Sale", saleSchema);
