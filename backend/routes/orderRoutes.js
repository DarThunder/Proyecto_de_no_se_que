import { Router } from "express";
const router = Router();
import Sale from "../models/Sale.js";

import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

router.post("/", verifyToken, hasPermission(1), async (req, res) => {
  const { cashier, user, transaction_type, payment_method, items } = req.body;

  if (
    !cashier ||
    !transaction_type ||
    !payment_method ||
    !items ||
    items.length === 0
  ) {
    return res.status(400).json({
      error:
        "Faltan campos obligatorios: cashier, transaction_type, payment_method, items",
    });
  }

  if (cashier.toString() !== req.user.id.toString()) {
    return res.status(403).json({
      error:
        "No tienes permiso para registrar una venta a nombre de otro cajero.",
    });
  }

  try {
    const newSale = new Sale({
      cashier,
      user,
      transaction_type,
      payment_method,
      items,
    });

    await newSale.save();

    res.status(201).json({
      message: `Pedido creado. ID de la orden: ${newSale._id}`,
      sale: newSale,
    });
  } catch (err) {
    res
      .status(400)
      .json({ error: "Error al crear el pedido", details: err.message });
  }
});

export default router;
