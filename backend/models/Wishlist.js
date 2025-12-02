import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

/**
 * @typedef {Object} WishlistItem
 * @property {Object} variant - ID variante (ObjectId)
 */

/**
 * @typedef {Object} WishlistDocument
 * @property {Object} _id - ID wishlist (ObjectId)
 * @property {Object} user - ID usuario (ObjectId)
 * @property {WishlistItem[]} items - Ítems
 */

const wishlistItemSchema = new Schema(
  {
    variant: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },
  },
  { _id: false }
);

const wishlistSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [wishlistItemSchema],
  },
  { timestamps: true }
);

export default model("Wishlist", wishlistSchema);
