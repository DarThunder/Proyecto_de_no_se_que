import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      maxlength: 60,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 500,
    },
    quality_rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comfort_rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    value_rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    media: [
      {
        type: String,
        required: false,
      },
    ],
    reviewer_name: {
      type: String,
      required: true,
    },
    reviewer_location: {
      type: String,
      required: false,
    },
    verified_purchase: {
      type: Boolean,
      default: false,
    },
    purchase_date: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ user: 1, product: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
