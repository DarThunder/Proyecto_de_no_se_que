import { Router } from "express";
const router = Router();

import Sale from "../models/Sale.js";
import Cart from "../models/Cart.js";
import ProductVariant from "../models/ProductVariant.js";
import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

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

    console.log("Órdenes encontradas:", orders?.length);

    if (!orders || orders.length === 0) {
      console.log("No se encontraron órdenes");
      return res.status(200).json([]);
    }

    const purchasedProductsMap = new Map();

    orders.forEach((order) => {
      console.log("Procesando orden:", order._id);
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
        } else {
          console.log("Item sin variante o producto:", item);
        }
      });
    });

    const purchasedProducts = Array.from(purchasedProductsMap.values());
    console.log("Productos para reseñar:", purchasedProducts.length);

    res.status(200).json(purchasedProducts);
  } catch (err) {
    console.error("Error en /user/purchased-products:", err);
    res.status(500).json({
      error: "Error al obtener productos comprados",
      details: err.message,
    });
  }
});


// Agregar en orderRoutes.js - NUEVO ENDPOINT
router.post("/pos-sale", verifyToken, hasPermission(2), async (req, res) => {
  try {
    const { user, cashier, items, payment_method = "CASH" } = req.body;

    // Validaciones básicas
    if (!user || !items || items.length === 0) {
      return res.status(400).json({ error: "Faltan campos requeridos: user, items" });
    }

    let total = 0;
    const itemsToUpdate = [];

    // Procesar items y calcular total
    for (const item of items) {
      const variant = await ProductVariant.findById(item.variant);
      if (!variant) {
        return res.status(404).json({ error: `Variante con ID ${item.variant} no encontrada` });
      }
      if (variant.stock < item.quantity) {
        return res.status(400).json({ error: `Stock insuficiente para ${variant.sku}` });
      }

      variant.stock -= item.quantity;
      itemsToUpdate.push(variant.save());

      total += item.quantity * item.unit_price * (1 - (item.discount_rate || 0));
    }

    // Crear la venta
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
    res.status(500).json({ error: "Error al registrar la venta POS", details: err.message });
  }
});

export default router;
