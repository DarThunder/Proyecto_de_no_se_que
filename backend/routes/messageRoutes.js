import { Router } from "express";
const router = Router();
import Message from "../models/Message.js";

// GET /messages/reorder - Obtener todas las solicitudes de reabastecimiento
router.get("/reorder", async (req, res) => {
  try {
    const messages = await Message.find({ type: 'reorder' })
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    console.error("Error obteniendo mensajes:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /messages/reorder - Crear nueva solicitud de reabastecimiento
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
      notes
    } = req.body;

    const message = new Message({
      type: 'reorder',
      productName,
      variantId,
      supplier,
      supplierName,
      quantity,
      urgency,
      orderId,
      requestedBy,
      notes,
      status: 'pending',
      read: false
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    console.error("Error creando mensaje:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT /messages/:id/read - Marcar mensaje como leído
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

// PUT /messages/mark-all-read - Marcar todos como leídos
router.put("/mark-all-read", async (req, res) => {
  try {
    await Message.updateMany(
      { read: false },
      { read: true }
    );
    res.json({ message: "Todos los mensajes marcados como leídos" });
  } catch (error) {
    console.error("Error marcando todos como leídos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// PUT /messages/:id/approve - Aprobar solicitud
router.put("/:id/approve", async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved',
        approvedAt: new Date()
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

// PUT /messages/:id/reject - Rechazar solicitud
router.put("/:id/reject", async (req, res) => {
  try {
    const { reason } = req.body;
    
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason: reason
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