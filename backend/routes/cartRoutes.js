import { Router } from "express";
const router = Router();
import Cart from "../models/Cart.js";
import verifyToken from "../middleware/verifyToken.js"; // Usas esto para saber QUÉ usuario está logueado

// --- OBTENER EL CARRITO DEL USUARIO LOGUEADO ---
// Se usará en carrito.html
router.get("/", verifyToken, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate({
      path: "items.variant",
      populate: { path: "product" }, // Pobla la información del producto base
    });

    if (!cart) {
      // Si no tiene carrito, devuelve uno vacío (o créalo si prefieres)
      return res.status(200).json({ items: [] });
    }

    res.status(200).json(cart);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al obtener el carrito", details: err.message });
  }
});

// --- AGREGAR/ACTUALIZAR UN ITEM EN EL CARRITO ---
// Se usará en index.html (botón "Agregar al Carrito")
router.post("/items", verifyToken, async (req, res) => {
  const { variantId, quantity } = req.body;
  const userId = req.user.id; // Obtenido del verifyToken

  if (!variantId || !quantity || quantity < 1) {
    return res
      .status(400)
      .json({ error: "Faltan variantId o quantity (mínimo 1)" });
  }

  try {
    // 1. Busca el carrito del usuario (o créalo si no existe)
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // 2. Revisa si el item ya está en el carrito
    const itemIndex = cart.items.findIndex(
      (item) => item.variant.toString() === variantId
    );

    if (itemIndex > -1) {
      // Si ya existe, actualiza la cantidad
      cart.items[itemIndex].quantity = quantity;
    } else {
      // Si no existe, agrégalo al array
      cart.items.push({ variant: variantId, quantity });
    }

    // 3. Guarda el carrito actualizado
    await cart.save();
    
    // 4. Pobla los datos antes de devolverlos para que el frontend tenga la info
    await cart.populate({
      path: "items.variant",
      populate: { path: "product" },
    });

    res.status(200).json(cart);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al agregar item al carrito", details: err.message });
  }
});

// (Aquí también agregarías las rutas DELETE /items/:variantId y PUT /items/:variantId)

export default router;