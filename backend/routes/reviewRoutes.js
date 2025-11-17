import { Router } from "express";
const router = Router();

import Review from "../models/Review.js";
import verifyToken from "../middleware/verifyToken.js";
import Sale from "../models/Sale.js";

// --- OBTENER RESEÑAS DEL USUARIO ---
router.get("/my-reviews", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const reviews = await Review.find({ user: userId })
      .populate({
        path: "product",
        select: "name image_url category base_price"
      })
      .populate({  // ← AGREGAR ESTE POPULATE
        path: "user",
        select: "username"  // Incluir ambos campos por si acaso
      })
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (err) {
    console.error("Error en /my-reviews:", err);
    res.status(500).json({ 
      error: "Error al obtener reseñas", 
      details: err.message 
    });
  }
});

// --- CREAR NUEVA RESEÑA ---
router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { product, rating, comment, size } = req.body;

    // Validaciones
    if (!product || !rating || !comment || !size) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "La calificación debe ser entre 1 y 5" });
    }

    // Verificar si ya existe una reseña para este producto
    const existingReview = await Review.findOne({ 
      user: userId, 
      product: product 
    });

    if (existingReview) {
      return res.status(400).json({ error: "Ya has reseñado este producto" });
    }

    // Crear nueva reseña
    const newReview = new Review({
      user: userId,
      product,
      rating,
      comment,
      size
    });

    await newReview.save();
    
    // Poblar datos para la respuesta
    await newReview.populate({
      path: "product",
      select: "name image_url category"
    });

    res.status(201).json({
      message: "Reseña creada exitosamente",
      review: newReview
    });

  } catch (err) {
    console.error("Error en POST /reviews:", err);
    
    if (err.code === 11000) {
      return res.status(400).json({ error: "Ya has reseñado este producto" });
    }
    
    res.status(500).json({ 
      error: "Error al crear reseña", 
      details: err.message 
    });
  }
});

// --- RUTA: PRODUCTOS COMPRADOS PARA RESEÑAS ---
router.get("/user/purchased-products", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("🔍 Buscando productos comprados para usuario:", userId);

    // Buscar todas las ventas del usuario
    const orders = await Sale.find({ user: userId })
      .populate({
        path: "items.variant",
        populate: {
          path: "product",
          model: "Product",
        },
      });

    console.log("📦 Órdenes encontradas:", orders?.length);

    if (!orders || orders.length === 0) {
      console.log("📭 No se encontraron órdenes");
      return res.status(200).json([]);
    }

    // Extraer productos únicos comprados por el usuario
    const purchasedProductsMap = new Map();
    
    orders.forEach(order => {
      console.log("🛒 Procesando orden:", order._id);
      order.items.forEach(item => {
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
              size: item.variant.size
            });
          }
        } else {
          console.log("❌ Item sin variante o producto:", item);
        }
      });
    });

    const purchasedProducts = Array.from(purchasedProductsMap.values());
    console.log("✅ Productos para reseñar:", purchasedProducts.length);
    
    // Por ahora devolvemos todos los productos comprados
    // El filtro de reseñas lo haremos en el frontend
    res.status(200).json(purchasedProducts);

  } catch (err) {
    console.error("❌ Error en /user/purchased-products:", err);
    res.status(500).json({ 
      error: "Error al obtener productos comprados", 
      details: err.message 
    });
  }
});

// --- OBTENER RESEÑAS DE UN PRODUCTO ---
router.get("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    console.log("🔍 Buscando reseñas para producto:", productId);

    const reviews = await Review.find({ 
      product: productId,
      is_approved: true 
    })
      .populate({
        path: "user",
        select: "username"
      })
      .sort({ createdAt: -1 });

    console.log("📝 Reseñas encontradas:", reviews.length);
    res.status(200).json(reviews);

  } catch (err) {
    console.error("❌ Error en /product/:productId:", err);
    res.status(500).json({ 
      error: "Error al obtener reseñas del producto", 
      details: err.message 
    });
  }
});

// --- ELIMINAR RESEÑA ---
router.delete("/:reviewId", verifyToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    // Buscar la reseña
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: "Reseña no encontrada" });
    }

    // Verificar que el usuario es el dueño de la reseña
    if (review.user.toString() !== userId) {
      return res.status(403).json({ error: "No tienes permiso para eliminar esta reseña" });
    }

    // Eliminar la reseña
    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({ 
      message: "Reseña eliminada exitosamente" 
    });

  } catch (err) {
    console.error("Error en DELETE /reviews/:reviewId:", err);
    res.status(500).json({ 
      error: "Error al eliminar reseña", 
      details: err.message 
    });
  }
});

// --- EDITAR RESEÑA ---
router.put("/:reviewId", verifyToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;
    const { rating, comment, size } = req.body;

    // Validaciones
    if (!rating || !comment || !size) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "La calificación debe ser entre 1 y 5" });
    }

    // Buscar la reseña
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: "Reseña no encontrada" });
    }

    // Verificar que el usuario es el dueño de la reseña
    if (review.user.toString() !== userId) {
      return res.status(403).json({ error: "No tienes permiso para editar esta reseña" });
    }

    // Actualizar la reseña
    review.rating = rating;
    review.comment = comment;
    review.size = size;

    await review.save();

    // Poblar datos para la respuesta
    await review.populate({
      path: "product",
      select: "name image_url category"
    });

    res.status(200).json({
      message: "Reseña actualizada exitosamente",
      review: review
    });

  } catch (err) {
    console.error("Error en PUT /reviews/:reviewId:", err);
    res.status(500).json({ 
      error: "Error al editar reseña", 
      details: err.message 
    });
  }
});

export default router;