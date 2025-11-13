import { Router } from "express";
const router = Router();
import Coupon from "../models/Coupon.js";
import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

// Ver todos los cupones (Admin y Gerente)
router.get("/", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ver un cupón (Admin y Gerente)
router.get("/:id", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Cupón no encontrado" });
    }
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear un cupón (Admin y Gerente)
router.post("/", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const { name, discount, expiration_date, maximum_uses } = req.body;

    const code = generateCouponCode();

    const newCoupon = new Coupon({
      name,
      discount,
      code,
      expiration_date: expiration_date ? new Date(expiration_date) : null,
      maximum_uses: maximum_uses || null,
    });

    const saveCoupon = await newCoupon.save();
    res.status(201).json(saveCoupon);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "El código del cupón ya existe" });
    }
    res.status(400).json({ message: error.message });
  }
});

// Actualizar un cupón (Admin y Gerente)
router.put("/:id", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!coupon) {
      return res.status(404).json({ message: "Cupón no encontrado" });
    }
    res.json(coupon);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Eliminar un cupón (Admin y Gerente)
router.delete("/:id", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: "Cupón no encontrado" });
    }
    res.json({ message: "Cupón eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Validar un cupón (Admin, Gerente y Cajero)
router.get(
  "/validate/:code",
  verifyToken,
  hasPermission(2), // <-- Cambiado de 1 a 2
  async (req, res) => {
    try {
      const code = req.params.code.toUpperCase();
      const coupon = await Coupon.findOne({ code, active: true });

      if (!coupon) {
        return res
          .status(404)
          .json({ message: "Cupón no válido o no encontrado" });
      }

      if (coupon.expiration_date && new Date() > coupon.expiration_date) {
        return res.status(400).json({ message: "Cupón expirado" });
      }

      if (coupon.maximum_uses && coupon.actual_uses >= coupon.maximum_uses) {
        return res
          .status(400)
          .json({ message: "Cupón ha alcanzado su límite de usos" });
      }

      res.json({
        valido: true,
        coupon: {
          id: coupon._id,
          name: coupon.name,
          discount: coupon.discount,
          code: coupon.code,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Buscar un cupón (Admin, Gerente y Cajero)
router.get("/search/:code", verifyToken, hasPermission(2), async (req, res) => { // <-- Cambiado de 1 a 2
  try {
    const code = req.params.code.toUpperCase();

    const coupon = await Coupon.findOne({
      code,
      active: true,
    });
    console.log("Resultado de la consulta DB:", coupon);

    if (!coupon) {
      return res.status(404).json({
        message: "Cupón no encontrado o inactive",
      });
    }

    if (coupon.expiration_date && new Date() > coupon.expiration_date) {
      return res.status(400).json({
        message: "Cupón expirado",
      });
    }

    if (coupon.maximum_uses && coupon.actual_uses >= coupon.maximum_uses) {
      return res.status(400).json({
        message: "Cupón ha alcanzado su límite de usos",
      });
    }

    res.json({
      success: true,
      coupon: {
        id: coupon._id,
        name: coupon.name,
        discount: coupon.discount,
        code: coupon.code,
        expiration_date: coupon.expiration_date,
        actual_uses: coupon.actual_uses,
        maximum_uses: coupon.maximum_uses,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al buscar cupón",
      details: error.message,
    });
  }
});

function generateCouponCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default router;