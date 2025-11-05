import { Router } from "express";
const router = Router();
import Cart from "../models/Cart.js";
import verifyToken from "../middleware/verifyToken.js";

router.get("/", verifyToken, async (req, res) => {
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

router.post("/items", verifyToken, async (req, res) => {
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
    res
      .status(500)
      .json({
        error: "Error al agregar item al carrito",
        details: err.message,
      });
  }
});

export default router;
