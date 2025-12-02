import { Router } from "express";
const router = Router();
import CashMovement from "../models/CashMovement.js";
import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";
import Sale from "../models/Sale.js";

/**
 * Registra un movimiento manual de efectivo (Entrada o Salida).
 * Útil para registrar fondo inicial, retiros parciales o pagos a proveedores desde caja.
 *
 * @route POST /cash-movements
 * @access Private (Ring 2 - Cashier+)
 * @param {string} req.body.type - Tipo de movimiento ('IN' | 'OUT')
 * @param {number} req.body.amount - Cantidad monetaria
 * @param {string} req.body.description - Motivo del movimiento
 */
router.post("/", verifyToken, hasPermission(2), async (req, res) => {
  try {
    const { type, amount, description } = req.body;

    const movement = new CashMovement({
      user: req.user.id,
      type,
      amount,
      description,
    });

    await movement.save();
    res
      .status(201)
      .json({ message: "Movimiento registrado exitosamente", movement });
  } catch (error) {
    console.error("Error registrando movimiento:", error);
    res.status(500).json({ error: "Error al registrar el movimiento" });
  }
});

/**
 * Calcula el balance actual de la caja del día.
 * La fórmula es: (Ventas en Efectivo del día) + (Movimientos IN) - (Movimientos OUT).
 *
 * @route GET /cash-movements/balance
 * @access Private (Ring 2 - Cashier+)
 * @returns {object} { balance, dailySales, transactions }
 */
router.get("/balance", verifyToken, hasPermission(2), async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Agregación para obtener totales de Ventas (Sale) tipo POS
    const salesStats = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          transaction_type: "POS",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" }, // Total vendido (cualquier método)
          totalTransactions: { $sum: 1 },
          cashRevenue: {
            $sum: {
              // Sumar solo si el método de pago es 'CASH'
              $cond: [{ $eq: ["$payment_method", "CASH"] }, "$total", 0],
            },
          },
        },
      },
    ]);

    // Agregación para obtener movimientos manuales (CashMovement)
    const movements = await CashMovement.aggregate([
      {
        $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } },
      },
      {
        $group: {
          _id: "$type", // Agrupar por IN o OUT
          total: { $sum: "$amount" },
        },
      },
    ]);

    const stats = salesStats[0] || {
      totalRevenue: 0,
      totalTransactions: 0,
      cashRevenue: 0,
    };
    const movesIn = movements.find((m) => m._id === "IN")?.total || 0;
    const movesOut = movements.find((m) => m._id === "OUT")?.total || 0;

    // Cálculo final del efectivo esperado en caja
    const currentBalance = stats.cashRevenue + movesIn - movesOut;

    res.json({
      balance: currentBalance,
      dailySales: stats.totalRevenue,
      transactions: stats.totalTransactions,
    });
  } catch (error) {
    console.error("Error obteniendo balance:", error);
    res.status(500).json({ error: "Error al calcular balance" });
  }
});

export default router;
