import mongoose, { model } from "mongoose";
const { Schema } = mongoose;

/**
 * @typedef {Object} ReviewDocument
 * @property {Object} _id - ID de la reseña (ObjectId)
 * @property {Object} user - Autor de la reseña (ObjectId)
 * @property {Object} product - Producto reseñado (ObjectId)
 * @property {number} rating - Calificación (1-5 estrellas)
 * @property {string} comment - Texto de la opinión
 * @property {'XS'|'S'|'M'|'L'|'XL'} size - Talla comprada por el usuario
 * @property {boolean} is_approved - Moderación de la reseña
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

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

/**
 * Calcula y actualiza el promedio de calificación de un producto.
 * @param {Object} productId - ID del producto a recalcular (ObjectId)
 */
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
    // TODO: Actualizar el modelo Product con el nuevo promedio
  } catch (err) {
    console.error("Error updating product rating:", err);
  }
};

export default model("Review", reviewSchema);
