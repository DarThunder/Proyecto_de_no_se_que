import { Router } from "express";
const router = Router();
import Wishlist from "../models/Wishlist.js";
import verifyToken from "../middleware/verifyToken.js";

/**
 * Obtiene la lista de deseos del usuario autenticado.
 *
 * @route GET /wishlist/items
 * @access Private (User)
 */
router.get("/items", verifyToken, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id }).populate({
      path: "items.variant",
      populate: { path: "product" },
    });

    if (!wishlist) {
      return res.status(200).json({ items: [] });
    }

    res.status(200).json(wishlist);
  } catch (err) {
    res.status(500).json({
      error: "Error al obtener la lista de deseos",
      details: err.message,
    });
  }
});

/**
 * Agrega un producto (variante) a la lista de deseos.
 * Evita duplicados automáticamente con `$addToSet`.
 *
 * @route POST /wishlist/items
 * @access Private (User)
 * @param {string} req.body.variantId - ID de la variante a agregar
 */
router.post("/items", verifyToken, async (req, res) => {
  const { variantId } = req.body;
  const userId = req.user.id;

  if (!variantId) {
    return res.status(400).json({ error: "Falta variantId" });
  }

  try {
    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, items: [] });
    }

    // Verifica si ya existe antes de agregar (aunque addToSet lo haría, aquí es lógica manual)
    const exists = wishlist.items.some(
      (item) => item.variant.toString() === variantId
    );

    if (!exists) {
      wishlist.items.push({ variant: variantId });
      await wishlist.save();
    }

    await wishlist.populate({
      path: "items.variant",
      populate: { path: "product" },
    });

    res.status(200).json(wishlist);
  } catch (err) {
    res.status(500).json({
      error: "Error al agregar a la lista de deseos",
      details: err.message,
    });
  }
});

/**
 * Elimina un producto de la lista de deseos.
 *
 * @route DELETE /wishlist/items
 * @access Private (User)
 * @param {string} req.body.variantId - ID de la variante a eliminar
 */
router.delete("/items", verifyToken, async (req, res) => {
  try {
    const { variantId } = req.body;
    const userId = req.user.id;

    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return res.status(404).json({ message: "Lista de deseos no encontrada" });
    }

    // Filtra el array excluyendo el ID enviado
    wishlist.items = wishlist.items.filter(
      (item) => item.variant.toString() !== variantId
    );

    const updatedWishlist = await wishlist.save();
    await updatedWishlist.populate({
      path: "items.variant",
      populate: { path: "product" },
    });

    res.status(200).json(updatedWishlist);
  } catch (error) {
    console.error("Error al eliminar de wishlist:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

export default router;
