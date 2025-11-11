// routes/cuponesRoutes.js
import { Router } from "express";
const router = Router();
import Cupon from "../models/Cupon.js";
import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

// Obtener todos los cupones (solo admin)
router.get("/", verifyToken, hasPermission(0), async (req, res) => {
  try {
    const cupones = await Cupon.find().sort({ createdAt: -1 });
    res.json(cupones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener cupón por ID
router.get("/:id", verifyToken, hasPermission(0), async (req, res) => {
  try {
    const cupon = await Cupon.findById(req.params.id);
    if (!cupon) {
      return res.status(404).json({ message: "Cupón no encontrado" });
    }
    res.json(cupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear nuevo cupón
router.post("/", verifyToken, hasPermission(0), async (req, res) => {
  try {
    const { nombre, descuento, fecha_expiracion, usos_maximos } = req.body;

    // Generar código único
    const codigo = generateCuponCode();

    const nuevoCupon = new Cupon({
      nombre,
      descuento,
      codigo,
      fecha_expiracion: fecha_expiracion ? new Date(fecha_expiracion) : null,
      usos_maximos: usos_maximos || null,
    });

    const cuponGuardado = await nuevoCupon.save();
    res.status(201).json(cuponGuardado);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "El código del cupón ya existe" });
    }
    res.status(400).json({ message: error.message });
  }
});

// Actualizar cupón
router.put("/:id", verifyToken, hasPermission(0), async (req, res) => {
  try {
    const cupon = await Cupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!cupon) {
      return res.status(404).json({ message: "Cupón no encontrado" });
    }
    res.json(cupon);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Eliminar cupón
router.delete("/:id", verifyToken, hasPermission(0), async (req, res) => {
  try {
    const cupon = await Cupon.findByIdAndDelete(req.params.id);
    if (!cupon) {
      return res.status(404).json({ message: "Cupón no encontrado" });
    }
    res.json({ message: "Cupón eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Validar cupón (accesible para cajeros también)
router.get("/validar/:codigo", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const codigo = req.params.codigo.toUpperCase();
    const cupon = await Cupon.findOne({ codigo, activo: true });

    if (!cupon) {
      return res.status(404).json({ message: "Cupón no válido o no encontrado" });
    }

    // Verificar fecha de expiración
    if (cupon.fecha_expiracion && new Date() > cupon.fecha_expiracion) {
      return res.status(400).json({ message: "Cupón expirado" });
    }

    // Verificar usos máximos
    if (cupon.usos_maximos && cupon.usos_actuales >= cupon.usos_maximos) {
      return res.status(400).json({ message: "Cupón ha alcanzado su límite de usos" });
    }

    res.json({
      valido: true,
      cupon: {
        id: cupon._id,
        nombre: cupon.nombre,
        descuento: cupon.descuento,
        codigo: cupon.codigo
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//BUscar cupon por código accesible para cajero
router.get("/buscar/:codigo", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const codigo = req.params.codigo.toUpperCase();
    
    const cupon = await Cupon.findOne({ 
      codigo, 
      activo: true 
    });

    if (!cupon) {
      return res.status(404).json({ 
        message: "Cupón no encontrado o inactivo" 
      });
    }

    // Verificar fecha de expiración
    if (cupon.fecha_expiracion && new Date() > cupon.fecha_expiracion) {
      return res.status(400).json({ 
        message: "Cupón expirado" 
      });
    }

    // Verificar usos máximos
    if (cupon.usos_maximos && cupon.usos_actuales >= cupon.usos_maximos) {
      return res.status(400).json({ 
        message: "Cupón ha alcanzado su límite de usos" 
      });
    }

    res.json({
      success: true,
      cupon: {
        id: cupon._id,
        nombre: cupon.nombre,
        descuento: cupon.descuento,
        codigo: cupon.codigo,
        fecha_expiracion: cupon.fecha_expiracion,
        usos_actuales: cupon.usos_actuales,
        usos_maximos: cupon.usos_maximos
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error al buscar cupón",
      details: error.message 
    });
  }
});

// Función para generar código único de cupón
function generateCuponCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default router;