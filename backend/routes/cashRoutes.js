import { Router } from "express";
const router = Router();
import CashMovement from "../models/CashMovement.js";
import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";
import Sale from "../models/Sale.js";

// Registrar movimiento (Cajero nivel 2 o superior)
router.post("/", verifyToken, hasPermission(2), async (req, res) => {
  try {
    const { type, amount, description } = req.body;
    
    const movement = new CashMovement({
      user: req.user.id,
      type, // "IN" o "OUT"
      amount,
      description
    });

    await movement.save();
    res.status(201).json({ message: "Movimiento registrado exitosamente", movement });
  } catch (error) {
    console.error("Error registrando movimiento:", error);
    res.status(500).json({ error: "Error al registrar el movimiento" });
  }
});

// Obtener balance y estadísticas de caja (Hoy)
router.get("/balance", verifyToken, hasPermission(2), async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Analizar TODAS las ventas POS de hoy (Efectivo y Tarjeta)
    const salesStats = await Sale.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          transaction_type: "POS"
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" }, // Total vendido (Cualquier método)
          totalTransactions: { $sum: 1 },   // Cantidad de ventas
          cashRevenue: {                    // Solo lo que entró en EFECTIVO
            $sum: {
              $cond: [{ $eq: ["$payment_method", "CASH"] }, "$total", 0]
            }
          }
        }
      }
    ]);

    // 2. Sumar Movimientos de Caja (Entradas/Salidas manuales)
    const movements = await CashMovement.aggregate([
      {
        $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } }
      },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" }
        }
      }
    ]);

    // Procesar resultados
    const stats = salesStats[0] || { totalRevenue: 0, totalTransactions: 0, cashRevenue: 0 };
    const movesIn = movements.find(m => m._id === "IN")?.total || 0;
    const movesOut = movements.find(m => m._id === "OUT")?.total || 0;

    // Balance en Caja = Ventas Efectivo + Entradas - Salidas
    const currentBalance = stats.cashRevenue + movesIn - movesOut;

    res.json({
      balance: currentBalance,          // Para el contador verde
      dailySales: stats.totalRevenue,   // Para "Ventas del Día"
      transactions: stats.totalTransactions // Para "Transacciones"
    });

  } catch (error) {
    console.error("Error obteniendo balance:", error);
    res.status(500).json({ error: "Error al calcular balance" });
  }
});

export default router;