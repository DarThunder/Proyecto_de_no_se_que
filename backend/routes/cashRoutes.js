import { Router } from "express";
const router = Router();
import CashMovement from "../models/CashMovement.js";
import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";
import Sale from "../models/Sale.js";

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

router.get("/balance", verifyToken, hasPermission(2), async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

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
          totalRevenue: { $sum: "$total" },
          totalTransactions: { $sum: 1 },
          cashRevenue: {
            $sum: {
              $cond: [{ $eq: ["$payment_method", "CASH"] }, "$total", 0],
            },
          },
        },
      },
    ]);

    const movements = await CashMovement.aggregate([
      {
        $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } },
      },
      {
        $group: {
          _id: "$type",
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
