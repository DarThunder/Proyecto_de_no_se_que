import { Router } from "express";
const router = Router();
import Cart from "../models/Cart.js";
import verifyToken from "../middleware/verifyToken.js";

/**
 * Obtiene el carrito de compras del usuario autenticado.
 *
 * @route GET /cart/items
 * @returns {Object} Objeto carrito poblado con productos.
 */
router.get("/items", verifyToken, async (req, res) => {
  // ... resto del código igual ...
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate({
      path: "items.variant",
      populate: { path: "product" },
    });

    if (!cart) {
      return res.status(200).json({ items: [] });
    }

    res.status(200).json(cart);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al obtener el carrito", details: err.message });
  }
});

/**
 * Agrega un ítem al carrito.
 *
 * @route POST /cart/items
 * @param {Object} req.body
 * @param {string} req.body.variantId
 * @param {number} req.body.quantity
 */
router.post("/items", verifyToken, async (req, res) => {
  // ... resto del código igual ...
  const { variantId, quantity } = req.body;
  const userId = req.user.id;

  if (!variantId || !quantity || quantity < 1) {
    return res
      .status(400)
      .json({ error: "Faltan variantId o quantity (mínimo 1)" });
  }

  try {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.variant.toString() === variantId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
    } else {
      cart.items.push({ variant: variantId, quantity });
    }

    await cart.save();

    await cart.populate({
      path: "items.variant",
      populate: { path: "product" },
    });

    res.status(200).json(cart);
  } catch (err) {
    res.status(500).json({
      error: "Error al agregar item al carrito",
      details: err.message,
    });
  }
});

/**
 * Elimina item del carrito.
 *
 * @route DELETE /cart/items
 * @param {Object} req.body
 */
router.delete("/items", verifyToken, async (req, res) => {
  // ... resto del código igual ...
  try {
    const { variantId, quantity } = req.body;
    const userId = req.user.id;

    if (!quantity || typeof quantity !== "number" || quantity < 1) {
      return res.status(400).json({
        message:
          "La cantidad a eliminar debe ser un número positivo enviado en el body.",
      });
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.variant.toString() === variantId
    );

    if (itemIndex === -1) {
      return res
        .status(404)
        .json({ message: "Artículo no encontrado en el carrito" });
    }

    const item = cart.items[itemIndex];

    if (quantity >= item.quantity) {
      cart.items = cart.items.filter((i) => i.variant.toString() !== variantId);
    } else {
      item.quantity -= quantity;
    }

    const updatedCart = await cart.save();

    await updatedCart.populate("items.variant");

    res.status(200).json(updatedCart);
  } catch (error) {
    console.error("Error al eliminar cantidad del carrito:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID de variante no válido" });
    }
    res.status(500).json({ message: "Error del servidor" });
  }
});

export default router;
