import { Router } from "express";
const router = Router();

import Review from "../models/Review.js";
import verifyToken from "../middleware/verifyToken.js";
import Sale from "../models/Sale.js";

/**
 * Obtiene todas las reseñas creadas por el usuario autenticado.
 *
 * @route GET /reviews/my-reviews
 * @access Private (User)
 */
router.get("/my-reviews", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const reviews = await Review.find({ user: userId })
      .populate({
        path: "product",
        select: "name image_url category base_price",
      })
      .populate({
        path: "user",
        select: "username",
      })
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (err) {
    console.error("Error en /my-reviews:", err);
    res.status(500).json({
      error: "Error al obtener reseñas",
      details: err.message,
    });
  }
});

/**
 * Crea una nueva reseña para un producto.
 * Valida que el usuario no haya reseñado el producto previamente.
 *
 * @route POST /reviews
 * @access Private (User)
 * @param {string} req.body.product - ID del producto
 * @param {number} req.body.rating - Calificación (1-5)
 * @param {string} req.body.comment - Comentario
 * @param {string} req.body.size - Talla comprada
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { product, rating, comment, size } = req.body;

    // Validaciones
    if (!product || !rating || !comment || !size) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ error: "La calificación debe ser entre 1 y 5" });
    }

    // Verificar duplicidad
    const existingReview = await Review.findOne({
      user: userId,
      product: product,
    });

    if (existingReview) {
      return res.status(400).json({ error: "Ya has reseñado este producto" });
    }

    const newReview = new Review({
      user: userId,
      product,
      rating,
      comment,
      size,
    });

    await newReview.save();

    await newReview.populate({
      path: "product",
      select: "name image_url category",
    });

    res.status(201).json({
      message: "Reseña creada exitosamente",
      review: newReview,
    });
  } catch (err) {
    console.error("Error en POST /reviews:", err);

    if (err.code === 11000) {
      return res.status(400).json({ error: "Ya has reseñado este producto" });
    }

    res.status(500).json({
      error: "Error al crear reseña",
      details: err.message,
    });
  }
});

/**
 * Obtiene la lista de productos únicos que el usuario ha comprado.
 * Se usa para habilitar la opción de "Dejar Reseña" solo en productos comprados.
 *
 * @route GET /reviews/user/purchased-products
 */
router.get("/user/purchased-products", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Buscando productos comprados para usuario:", userId);

    const orders = await Sale.find({ user: userId }).populate({
      path: "items.variant",
      populate: {
        path: "product",
        model: "Product",
      },
    });

    if (!orders || orders.length === 0) {
      return res.status(200).json([]);
    }

    const purchasedProductsMap = new Map();

    // Filtrar y deducir productos únicos de todas las órdenes
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.variant && item.variant.product) {
          const product = item.variant.product;
          const productId = product._id.toString();

          if (!purchasedProductsMap.has(productId)) {
            purchasedProductsMap.set(productId, {
              id: productId,
              name: product.name,
              category: product.category,
              price: product.base_price,
              imageUrl: product.image_url,
              purchaseDate: order.createdAt,
              size: item.variant.size,
            });
          }
        }
      });
    });

    const purchasedProducts = Array.from(purchasedProductsMap.values());
    res.status(200).json(purchasedProducts);
  } catch (err) {
    console.error("Error en /user/purchased-products:", err);
    res.status(500).json({
      error: "Error al obtener productos comprados",
      details: err.message,
    });
  }
});

/**
 * Obtiene reseñas públicas aprobadas de un producto.
 *
 * @route GET /reviews/product/:productId
 * @access Public
 */
router.get("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    console.log("🔍 Buscando reseñas para producto:", productId);

    const reviews = await Review.find({
      product: productId,
      is_approved: true,
    })
      .populate({
        path: "user",
        select: "username",
      })
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (err) {
    console.error("Error en /product/:productId:", err);
    res.status(500).json({
      error: "Error al obtener reseñas del producto",
      details: err.message,
    });
  }
});

/**
 * Elimina una reseña propia.
 * Valida que el usuario sea el dueño de la reseña.
 *
 * @route DELETE /reviews/:reviewId
 * @access Private (Owner Only)
 */
router.delete("/:reviewId", verifyToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: "Reseña no encontrada" });
    }

    if (review.user.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar esta reseña" });
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({
      message: "Reseña eliminada exitosamente",
    });
  } catch (err) {
    console.error("Error en DELETE /reviews/:reviewId:", err);
    res.status(500).json({
      error: "Error al eliminar reseña",
      details: err.message,
    });
  }
});

/**
 * Actualiza una reseña propia.
 *
 * @route PUT /reviews/:reviewId
 * @access Private (Owner Only)
 */
router.put("/:reviewId", verifyToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const { rating, comment, size } = req.body;

    if (!rating || !comment || !size) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ error: "La calificación debe ser entre 1 y 5" });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: "Reseña no encontrada" });
    }

    if (review.user.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para editar esta reseña" });
    }

    review.rating = rating;
    review.comment = comment;
    review.size = size;

    await review.save();

    await review.populate({
      path: "product",
      select: "name image_url category",
    });

    res.status(200).json({
      message: "Reseña actualizada exitosamente",
      review: review,
    });
  } catch (err) {
    console.error("Error en PUT /reviews/:reviewId:", err);
    res.status(500).json({
      error: "Error al editar reseña",
      details: err.message,
    });
  }
});

export default router;
