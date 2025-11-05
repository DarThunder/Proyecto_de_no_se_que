import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

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
