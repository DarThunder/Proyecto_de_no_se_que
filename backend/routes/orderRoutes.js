import { Router } from "express";
const router = Router();

import Sale from "../models/Sale.js";
import Cart from "../models/Cart.js";
import ProductVariant from "../models/ProductVariant.js";
import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

// --- RUTA POS (CAJERO) ---
// (Esta es tu ruta original, la dejamos como estaba)
router.post("/", verifyToken, hasPermission(1), async (req, res) => {
  const { user, cashier, items, transaction_type, payment_method } = req.body;

  try {
    let total = 0;
    const itemsToUpdate = [];

    for (const item of items) {
      const variant = await ProductVariant.findById(item.variant);
      if (!variant) {
        return res
          .status(404)
          .json({ error: `Variante con ID ${item.variant} no encontrada` });
      }
      if (variant.stock < item.quantity) {
        return res
          .status(400)
          .json({ error: `Stock insuficiente para ${variant.sku}` });
      }

      variant.stock -= item.quantity;
      itemsToUpdate.push(variant.save());

      total += item.quantity * item.unit_price * (1 - item.discount_rate);
    }

    const newSale = new Sale({
      user,
      cashier: cashier || req.user.id,
      items,
      total,
      transaction_type: transaction_type || "POS",
      payment_method: payment_method || "CASH",
    });

    await newSale.save();
    await Promise.all(itemsToUpdate); // Actualiza el stock en la BD

    res.status(201).json({
      message: "Venta registrada exitosamente",
      saleId: newSale._id,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al registrar la venta", details: err.message });
  }
});

// --- RUTA CHECKOUT (WEB) ---
// (Esta es la ruta corregida, con toda la lógica DENTRO del try...catch)
router.post("/checkout", verifyToken, async (req, res) => {
  try {
    // 1. Mover la lógica DENTRO del try
    // Si req.user es undefined (porque el token es malo), el catch lo atrapará
    const userId = req.user.id; 
    const { shipping_address } = req.body;

    if (!shipping_address) {
      return res.status(400).json({ error: "Faltan datos de envío" });
    }

    // 2. Encontrar el carrito del usuario
    const cart = await Cart.findOne({ user: userId }).populate({
      path: "items.variant",
      populate: { path: "product" },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "No hay productos en el carrito" });
    }

    // 3. Preparar los items de la venta y verificar stock
    let total = 0;
    const saleItems = [];
    const stockUpdates = [];

    for (const cartItem of cart.items) {
      const variant = cartItem.variant;

      // Verificación de seguridad
      if (!variant || !variant.product) {
        return res.status(404).json({ error: "Un producto en tu carrito ya no existe."});
      }

      if (variant.stock < cartItem.quantity) {
        return res
          .status(400)
          .json({ error: `Stock insuficiente para ${variant.sku}` });
      }

      variant.stock -= cartItem.quantity;
      stockUpdates.push(variant.save());

      const unit_price = variant.product.base_price;
      saleItems.push({
        variant: variant._id,
        quantity: cartItem.quantity,
        unit_price: unit_price,
        discount_rate: 0, // Implementar cupones aquí si se desea
      });

      total += cartItem.quantity * unit_price;
    }

    // 4. Crear el número de seguimiento (simulado)
    const tracking_number = `SS-${Date.now()}`;

    // 5. Crear la nueva venta (Sale)
    const newSale = new Sale({
      user: userId,
      items: saleItems,
      total: total,
      payment_method: "ONLINE", 
      transaction_type: "WEB",
      shipping_address: shipping_address,
      shipping_status: "Processing",
      tracking_number: tracking_number,
    });

    await newSale.save();
    await Promise.all(stockUpdates); // Actualizar stock

    // 6. Vaciar el carrito del usuario
    cart.items = [];
    await cart.save();

    // 7. Responder con éxito
    res.status(201).json({
      message: "Pedido realizado exitosamente",
      saleId: newSale._id,
      trackingNumber: newSale.tracking_number,
    });
  } catch (err) {
    // 8. Si algo falla (incluyendo req.user.id), se envía un error 500
    console.error("Error en /orders/checkout:", err);
    res
      .status(500)
      .json({ error: "Error al procesar el pedido", details: err.message });
  }
});


// --- RUTA DE SEGUIMIENTO ---
// (La dejamos como estaba)
router.get("/track/:trackingNumber", async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const sale = await Sale.findOne({ tracking_number: trackingNumber })
      .populate({
        path: "items.variant", 
        populate: {
          path: "product", 
        },
      });

    if (!sale) {
      return res.status(404).json({ error: "Pedido no encontrado." });
    }
    
    res.status(200).json(sale);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al buscar el pedido", details: err.message });
  }
});

export default router;
