import { Router } from "express";
const router = Router();
import verifyToken from "../middleware/verifyToken.js";
import Wishlist from "../models/Wishlist.js";
import ProductVariant from "../models/ProductVariant.js";

// Proteger todas las rutas de la lista de deseos
router.use(verifyToken);

// OBTENER la lista de deseos del usuario
router.get("/", async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id }).populate({
      path: "items.variant",
      populate: { path: "product" },
    });

    if (!wishlist) {
      // Si no existe, crea una vacía
      const newWishlist = new Wishlist({ user: req.user.id, items: [] });
      await newWishlist.save();
      return res.status(200).json(newWishlist);
    }

    res.status(200).json(wishlist);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener la lista de deseos", details: err.message });
  }
});

// AÑADIR un item a la lista de deseos
router.post("/", async (req, res) => {
  const { variantId } = req.body;
  const userId = req.user.id;

  try {
    const variant = await ProductVariant.findById(variantId);
    if (!variant) {
      return res.status(404).json({ error: "Variante de producto no encontrada" });
    }

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, items: [] });
    }

    // Verificar si el item ya está en la lista
    const itemExists = wishlist.items.some(
      (item) => item.variant.toString() === variantId
    );

    if (itemExists) {
      return res.status(400).json({ message: "El producto ya está en tu lista de deseos" });
    }

    wishlist.items.push({ variant: variantId });
    await wishlist.save();
    res.status(201).json({ message: "Producto añadido a la lista de deseos", wishlist });

  } catch (err) {
    res.status(500).json({ error: "Error al añadir a la lista de deseos", details: err.message });
  }
});

// ELIMINAR un item de la lista de deseos
router.delete("/:variantId", async (req, res) => {
  const { variantId } = req.params;
  const userId = req.user.id;

  try {
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return res.status(404).json({ error: "Lista de deseos no encontrada" });
    }

    // $pull de Mongoose elimina el item del array
    wishlist.items.pull({ variant: variantId });
    await wishlist.save();

    res.status(200).json({ message: "Producto eliminado de la lista de deseos" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar de la lista de deseos", details: err.message });
  }
});

export default router;