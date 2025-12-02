import { Router } from "express";
const router = Router();
import Message from "../models/Message.js";

/**
 * Obtiene todos los mensajes de tipo "reorder" (solicitud de stock).
 * Ordenados del más reciente al más antiguo.
 *
 * @route GET /messages/reorder
 * @access Public (Debería ser Private - Ring 1/2)
 */
router.get("/reorder", async (req, res) => {
  try {
    const messages = await Message.find({ type: "reorder" }).sort({
      createdAt: -1,
    });
    res.json(messages);
  } catch (error) {
    console.error("Error obteniendo mensajes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * Crea una nueva solicitud de reabastecimiento.
 *
 * @route POST /messages/reorder
 * @param {string} req.body.productName - Nombre del producto
 * @param {string} req.body.supplier - ID del proveedor
 * @param {number} req.body.quantity - Cantidad a pedir
 * @param {string} req.body.urgency - 'normal' | 'urgent' | 'critical'
 */
router.post("/reorder", async (req, res) => {
  try {
    const {
      productName,
      variantId,
      supplier,
      supplierName,
      quantity,
      urgency,
      orderId,
      requestedBy,
      notes,
    } = req.body;

    const message = new Message({
      type: "reorder",
      productName,
      variantId,
      supplier,
      supplierName,
      quantity,
      urgency,
      orderId,
      requestedBy,
      notes,
      status: "pending",
      read: false,
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    console.error("Error creando mensaje:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * Marca un mensaje específico como leído.
 *
 * @route PUT /messages/:id/read
 */
router.put("/:id/read", async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: "Mensaje no encontrado" });
    }

    res.json(message);
  } catch (error) {
    console.error("Error marcando mensaje como leído:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * Marca TODOS los mensajes pendientes como leídos.
 * Útil para botón "Marcar todo como leído".
 *
 * @route PUT /messages/mark-all-read
 */
router.put("/mark-all-read", async (req, res) => {
  try {
    await Message.updateMany({ read: false }, { read: true });
    res.json({ message: "Todos los mensajes marcados como leídos" });
  } catch (error) {
    console.error("Error marcando todos como leídos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * Aprueba una solicitud de reabastecimiento.
 * Cambia estado a 'approved' y guarda la fecha.
 *
 * @route PUT /messages/:id/approve
 */
router.put("/:id/approve", async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
        approvedAt: new Date(),
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: "Mensaje no encontrado" });
    }

    res.json(message);
  } catch (error) {
    console.error("Error aprobando mensaje:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * Rechaza una solicitud de reabastecimiento.
 * Requiere un motivo de rechazo.
 *
 * @route PUT /messages/:id/reject
 * @param {string} req.body.reason - Motivo del rechazo
 */
router.put("/:id/reject", async (req, res) => {
  try {
    const { reason } = req.body;

    const message = await Message.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: "Mensaje no encontrado" });
    }

    res.json(message);
  } catch (error) {
    console.error("Error rechazando mensaje:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
