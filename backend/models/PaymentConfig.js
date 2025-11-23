import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const paymentConfigSchema = new Schema(
  {
    providerName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    credentials: {
      clientId: { type: String, default: "" },
      clientSecret: { type: String, default: "" },
      apiKey: { type: String, default: "" },
      mode: { type: String, enum: ["sandbox", "live"], default: "sandbox" },
    },
  },
  { timestamps: true }
);

export default model("PaymentConfig", paymentConfigSchema);
