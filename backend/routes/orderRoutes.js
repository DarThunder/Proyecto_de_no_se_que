import { Router } from "express";
const router = Router();

import Sale from "../models/Sale.js";
import Cart from "../models/Cart.js";
import ProductVariant from "../models/ProductVariant.js";
import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

/**
 * Crea una venta genérica (Legacy/Admin).
 * Valida stock y actualiza inventario.
 *
 * @route POST /orders
 * @access Private (Ring 1)
 */
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
    await Promise.all(itemsToUpdate);

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

/**
 * Procesa el checkout desde el carrito de compras (WEB).
 * 1. Valida stock de todos los items del carrito.
 * 2. Descuenta stock.
 * 3. Genera la orden con estado 'Processing'.
 * 4. Vacía el carrito.
 *
 * @route POST /orders/checkout
 * @access Private (User)
 */
router.post("/checkout", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { shipping_address } = req.body;

    if (!shipping_address) {
      return res.status(400).json({ error: "Faltan datos de envío" });
    }

    const cart = await Cart.findOne({ user: userId }).populate({
      path: "items.variant",
      populate: { path: "product" },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "No hay productos en el carrito" });
    }

    let total = 0;
    const saleItems = [];
    const stockUpdates = [];

    for (const cartItem of cart.items) {
      const variant = cartItem.variant;

      if (!variant || !variant.product) {
        return res
          .status(404)
          .json({ error: "Un producto en tu carrito ya no existe." });
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
        discount_rate: 0,
      });

      total += cartItem.quantity * unit_price;
    }

    const tracking_number = `SS-${Date.now()}`;

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
    await Promise.all(stockUpdates);

    cart.items = [];
    await cart.save();

    res.status(201).json({
      message: "Pedido realizado exitosamente",
      saleId: newSale._id,
      trackingNumber: newSale.tracking_number,
    });
  } catch (err) {
    console.error("Error en /orders/checkout:", err);
    res
      .status(500)
      .json({ error: "Error al procesar el pedido", details: err.message });
  }
});

/**
 * Rastrea el estado de un pedido mediante su número de guía.
 * Acceso público (o protegido si se requiere).
 *
 * @route GET /orders/track/:trackingNumber
 */
router.get("/track/:trackingNumber", async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const sale = await Sale.findOne({
      tracking_number: trackingNumber,
    }).populate({
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
    res
      .status(500)
      .json({ error: "Error al buscar el pedido", details: err.message });
  }
});

/**
 * Obtiene el historial de pedidos del usuario autenticado.
 *
 * @route GET /orders/my-orders
 * @access Private (User)
 */
router.get("/my-orders", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Sale.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "items.variant",
        populate: {
          path: "product",
          model: "Product",
        },
      });

    if (!orders) {
      return res.status(200).json([]);
    }

    res.status(200).json(orders);
  } catch (err) {
    console.error("Error en /my-orders:", err);
    res.status(500).json({
      error: "Error al obtener el historial de pedidos",
      details: err.message,
    });
  }
});

/**
 * Obtiene una lista única de productos que el usuario ha comprado.
 * Útil para validar si puede dejar una reseña ("Compra Verificada").
 *
 * @route GET /orders/user/purchased-products
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
 * Registra una venta en Punto de Venta (POS).
 * Acceso para Cajeros.
 *
 * @route POST /orders/pos-sale
 * @access Private (Ring 2 - Cashier)
 */
router.post("/pos-sale", verifyToken, hasPermission(2), async (req, res) => {
  try {
    const { user, cashier, items, payment_method = "CASH" } = req.body;

    if (!user || !items || items.length === 0) {
      return res
        .status(400)
        .json({ error: "Faltan campos requeridos: user, items" });
    }

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

      total +=
        item.quantity * item.unit_price * (1 - (item.discount_rate || 0));
    }

    const newSale = new Sale({
      user,
      cashier: cashier || req.user.id,
      items,
      total,
      transaction_type: "POS",
      payment_method,
    });

    await newSale.save();
    await Promise.all(itemsToUpdate);

    res.status(201).json({
      message: "Venta POS registrada exitosamente",
      saleId: newSale._id,
    });
  } catch (err) {
    console.error("Error en venta POS:", err);
    res
      .status(500)
      .json({ error: "Error al registrar la venta POS", details: err.message });
  }
});

/**
 * Obtiene todas las órdenes WEB para gestión de envíos.
 *
 * @route GET /orders/web-orders/all
 * @access Private (Ring 1 - Manager)
 */
router.get(
  "/web-orders/all",
  verifyToken,
  hasPermission(1),
  async (req, res) => {
    try {
      const orders = await Sale.find({ transaction_type: "WEB" })
        .populate("user", "username email")
        .sort({ createdAt: -1 });

      res.status(200).json(orders);
    } catch (error) {
      console.error("Error obteniendo pedidos web:", error);
      res.status(500).json({ message: "Error al obtener pedidos" });
    }
  }
);

/**
 * Actualiza el estado de envío de un pedido.
 * Incluye lógica de simulación: Si cambia a 'Shipped', espera 1 minuto y cambia a 'Delivered'.
 *
 * @route PUT /orders/:id/shipping-status
 * @access Private (Ring 1 - Manager)
 */
router.put(
  "/:id/shipping-status",
  verifyToken,
  hasPermission(1),
  async (req, res) => {
    const { id } = req.params;
    const { status, tracking_number } = req.body;

    try {
      const updateData = { shipping_status: status };
      if (tracking_number) updateData.tracking_number = tracking_number;

      const updatedOrder = await Sale.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );

      if (!updatedOrder) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }

      // --- SIMULACIÓN DE LOGÍSTICA ---
      if (status === "Shipped") {
        console.log(
          `Pedido ${id} marcado como Enviado. Se entregará automáticamente en 1 min...`
        );
        setTimeout(async () => {
          try {
            await Sale.findByIdAndUpdate(id, {
              shipping_status: "Delivered",
            });
            console.log(`AUTOMÁTICO: Pedido ${id} actualizado a Entregado.`);
          } catch (err) {
            console.error(
              `Error en actualización automática del pedido ${id}:`,
              err
            );
          }
        }, 60000);
      }

      res
        .status(200)
        .json({ message: "Estado actualizado", order: updatedOrder });
    } catch (error) {
      console.error("Error actualizando estado:", error);
      res.status(500).json({ message: "Error del servidor" });
    }
  }
);

/**
 * Procesa una devolución de productos (Refund).
 * 1. Restaura el stock de los productos devueltos.
 * 2. Registra una "Venta Negativa" para contabilidad.
 *
 * @route POST /orders/return
 * @access Private (Ring 2 - Cashier)
 */
router.post("/return", verifyToken, hasPermission(2), async (req, res) => {
  try {
    const { originalSaleId, itemsToReturn, cashier } = req.body;

    const originalSale = await Sale.findById(originalSaleId);
    if (!originalSale) {
      return res.status(404).json({ error: "Venta original no encontrada" });
    }

    let refundTotal = 0;
    const returnItems = [];
    const stockUpdates = [];

    for (const item of itemsToReturn) {
      const originalItem = originalSale.items.find(
        (i) => i.variant.toString() === item.variantId
      );

      if (!originalItem) continue;

      // Restaurar Stock
      const variant = await ProductVariant.findById(item.variantId);
      if (variant) {
        variant.stock += parseInt(item.quantity);
        stockUpdates.push(variant.save());
      }

      // Calcular reembolso
      const itemTotal = originalItem.unit_price * parseInt(item.quantity);
      refundTotal += itemTotal;

      returnItems.push({
        variant: item.variantId,
        quantity: parseInt(item.quantity),
        unit_price: originalItem.unit_price,
        discount_rate: originalItem.discount_rate || 0,
      });
    }

    const returnSale = new Sale({
      user: originalSale.user,
      cashier: cashier || req.user.id,
      items: returnItems,
      total: -refundTotal, // Negativo para cuadrar caja
      payment_method: "CASH",
      transaction_type: "RETURN",
      shipping_status: "Delivered",
    });

    await returnSale.save();
    await Promise.all(stockUpdates);

    res.status(201).json({
      message: "Devolución procesada exitosamente",
      returnId: returnSale._id,
      refundAmount: refundTotal,
    });
  } catch (error) {
    console.error("Error en devolución:", error);
    res.status(500).json({ error: "Error al procesar la devolución" });
  }
});

/**
 * Busca detalles de una venta específica por ID (para tickets o devoluciones).
 *
 * @route GET /orders/detail/:id
 */
router.get("/detail/:id", verifyToken, hasPermission(2), async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate({
      path: "items.variant",
      populate: { path: "product" },
    });

    if (!sale) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    res.json(sale);
  } catch (err) {
    console.error("Error buscando venta por ID:", err);
    res
      .status(500)
      .json({ error: "Error al buscar venta", details: err.message });
  }
});

export default router;
