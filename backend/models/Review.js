import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    size: {
      type: String,
      enum: ["XS", "S", "M", "L", "XL"],
      required: true,
    },
    is_approved: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

reviewSchema.statics.getAverageRating = async function (productId) {
  const result = await this.aggregate([
    {
      $match: {
        product: productId,
        is_approved: true,
      },
    },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  try {
  } catch (err) {
    console.error("Error updating product rating:", err);
  }
};

export default model("Review", reviewSchema);
