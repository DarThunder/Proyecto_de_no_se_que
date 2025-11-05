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
      unique: true,
      min: 0,
    },
  },
  { timestamps: true }
);

export default model("Role", roleSchema);
