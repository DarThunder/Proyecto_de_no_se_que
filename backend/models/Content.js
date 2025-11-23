import { Schema, model } from "mongoose";

const contentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    htmlContent: {
      type: String,
      required: true,
      default: "Aún no se ha definido el contenido.",
    },
  },
  {
    timestamps: true,
  }
);

const Content = model("Content", contentSchema);

export default Content;
