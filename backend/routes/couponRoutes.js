import { Router } from "express";
const router = Router();
import Coupon from "../models/Coupon.js";
import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

/**
 * Genera un código de cupón aleatorio alfanumérico de 8 caracteres.
 * @returns {string} Código generado (ej: 'A1B2C3D4')
 */
function generateCouponCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Obtiene todos los cupones ordenados por fecha de creación descendente.
 *
 * @route GET /coupons
 * @access Private (Ring 1 - Manager)
 */
router.get("/", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Obtiene un cupón específico por su ID interno.
 *
 * @route GET /coupons/:id
 * @access Private (Ring 1 - Manager)
 */
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

/**
 * Crea un nuevo cupón con un código generado automáticamente.
 *
 * @route POST /coupons
 * @access Private (Ring 1 - Manager)
 * @param {string} req.body.name - Nombre de la promoción
 * @param {number} req.body.discount - Porcentaje de descuento
 * @param {Date} [req.body.expiration_date] - Fecha de expiración
 * @param {number} [req.body.maximum_uses] - Límite de usos totales
 */
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

/**
 * Actualiza los datos de un cupón existente.
 *
 * @route PUT /coupons/:id
 * @access Private (Ring 1 - Manager)
 */
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

/**
 * Elimina un cupón permanentemente.
 *
 * @route DELETE /coupons/:id
 * @access Private (Ring 1 - Manager)
 */
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

/**
 * Valida si un cupón es aplicable.
 * Verifica existencia, estado activo, fecha de expiración y límite de usos.
 * Endpoint ligero para validación rápida en POS/Checkout.
 *
 * @route GET /coupons/validate/:code
 * @access Private (Ring 2 - Cashier+)
 * @param {string} req.params.code - Código del cupón
 */
router.get(
  "/validate/:code",
  verifyToken,
  hasPermission(2),
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

/**
 * Busca y devuelve detalles completos de un cupón válido.
 * Similar a validar, pero retorna más metadatos (fechas, usos, etc.).
 *
 * @route GET /coupons/search/:code
 * @access Private (Ring 2 - Cashier+)
 */
router.get("/search/:code", verifyToken, hasPermission(2), async (req, res) => {
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

export default router;
