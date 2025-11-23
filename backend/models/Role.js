import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

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
