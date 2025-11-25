import { Router } from "express";
import Sale from "../models/Sale.js";
import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";
import mongoose from "mongoose";

const router = Router();

// 1. Reporte de Más Vendidos
router.get("/bestsellers", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const bestSellers = await Sale.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.variant",
          totalQuantitySold: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.quantity", "$items.unit_price"] },
          },
        },
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "productvariants",
          localField: "_id",
          foreignField: "_id",
          as: "variantDetails",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "variantDetails.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $project: {
          _id: 1,
          totalQuantitySold: 1,
          totalRevenue: 1,
          variant: { $arrayElemAt: ["$variantDetails", 0] },
          product: { $arrayElemAt: ["$productDetails", 0] },
        },
      },
      {
        $project: {
          variantId: "$_id",
          quantitySold: "$totalQuantitySold",
          revenue: "$totalRevenue",
          productName: "$product.name",
          productSku: "$variant.sku",
          productSize: "$variant.size",
          productImage: "$product.image_url",
        },
      },
    ]);
    res.status(200).json(bestSellers);
  } catch (error) {
    console.error("Error al generar reporte de más vendidos:", error);
    res.status(500).json({ message: "Error del servidor", error: error.message });
  }
});

// 2. Ventas por Canal (Online vs POS)
router.get("/sales-by-channel", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const salesByChannel = await Sale.aggregate([
      {
        $group: {
          _id: "$transaction_type",
          totalRevenue: { $sum: "$total" },
          totalSales: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          channel: "$_id",
          revenue: "$totalRevenue",
          salesCount: "$totalSales",
        },
      },
    ]);

    const stats = {
      online: { revenue: 0, salesCount: 0 },
      pos: { revenue: 0, salesCount: 0 },
    };

    salesByChannel.forEach((item) => {
      if (item.channel === "WEB") stats.online = item;
      else if (item.channel === "POS") stats.pos = item;
    });

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error al generar reporte por canal:", error);
    res.status(500).json({ message: "Error del servidor", error: error.message });
  }
});

// 3. REPORTE DE VENDEDORES (Este es el que te falta o falla)
router.get("/sales-by-employee", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const salesByEmployee = await Sale.aggregate([
      // Solo consideramos ventas del POS que tengan un cajero asignado
      { 
        $match: { 
            transaction_type: "POS",
            cashier: { $ne: null } 
        } 
      },
      {
        $group: {
          _id: "$cashier",
          totalRevenue: { $sum: "$total" },
          totalSales: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "employeeDetails",
        },
      },
      {
        $project: {
          employee: { $arrayElemAt: ["$employeeDetails", 0] },
          totalRevenue: 1,
          totalSales: 1,
          // Evitar división por cero
          averageTicket: { 
            $cond: [
                { $eq: ["$totalSales", 0] }, 
                0, 
                { $divide: ["$totalRevenue", "$totalSales"] }
            ]
          },
        },
      },
      {
        $project: {
          employeeId: "$_id",
          username: "$employee.username",
          email: "$employee.email",
          totalRevenue: 1,
          totalSales: 1,
          averageTicket: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    res.status(200).json(salesByEmployee);
  } catch (error) {
    console.error("Error al generar reporte por vendedor:", error);
    res.status(500).json({ message: "Error del servidor", error: error.message });
  }
});

export default router;