// backend/routes/reportRoutes.js

import { Router } from "express";
import Sale from "../models/Sale.js";
import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";
import mongoose from "mongoose";

const router = Router();

/**
 * HU 31: Reporte de Productos más Vendidos
 * CORREGIDO: Ahora usa 'items.variant' y 'items.quantity'
 */
router.get("/bestsellers", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const bestSellers = await Sale.aggregate([
      // 1. Desglosar: Separa cada item en el array 'items'
      { $unwind: "$items" }, //

      // 2. Agrupar: Agrupa por el ID de la variante de producto
      {
        $group: {
          _id: "$items.variant", //
          totalQuantitySold: { $sum: "$items.quantity" }, //
          totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.unit_price"] } } //
        }
      },
      
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 10 },

      // 5. Poblar (Look up): Detalles de ProductVariant
      {
        $lookup: {
          from: "productvariants", 
          localField: "_id",
          foreignField: "_id",
          as: "variantDetails"
        }
      },
      
      // 6. Poblar (Look up): Detalles del Producto base
      {
        $lookup: {
          from: "products", 
          localField: "variantDetails.product",
          foreignField: "_id",
          as: "productDetails"
        }
      },

      // 7. Proyectar: Formatear la salida final
      {
        $project: {
          _id: 1, 
          totalQuantitySold: 1,
          totalRevenue: 1,
          variant: { $arrayElemAt: ["$variantDetails", 0] },
          product: { $arrayElemAt: ["$productDetails", 0] }
        }
      },
      
      // 8. Proyección final más limpia
      {
        $project: {
          variantId: "$_id",
          quantitySold: "$totalQuantitySold",
          revenue: "$totalRevenue",
          productName: "$product.name",
          productSku: "$variant.sku",
          productSize: "$variant.size",
          productImage: "$product.image_url"
        }
      }
    ]);

    res.status(200).json(bestSellers);

  } catch (error) {
    console.error("Error al generar reporte de más vendidos:", error);
    res.status(500).json({ message: "Error del servidor al generar el reporte", error: error.message });
  }
});


/**
 * HU 27: Reporte de Ingresos por Canal (Online vs POS)
 * CORREGIDO: Ahora usa 'transaction_type' y 'total'
 */
router.get("/sales-by-channel", verifyToken, hasPermission(1), async (req, res) => {
    try {
        const salesByChannel = await Sale.aggregate([
            // 1. Agrupar por el campo 'transaction_type' (WEB o POS)
            {
                $group: {
                    _id: "$transaction_type", //
                    totalRevenue: { $sum: "$total" }, //
                    totalSales: { $sum: 1 } 
                }
            },
            // 2. Formatear la salida
            {
                $project: {
                    _id: 0,
                    channel: "$_id",
                    revenue: "$totalRevenue",
                    salesCount: "$totalSales"
                }
            }
        ]);

        // Formatear la respuesta para que sea fácil de usar en el frontend
        const stats = {
            online: { revenue: 0, salesCount: 0 },
            pos: { revenue: 0, salesCount: 0 }
        };

        salesByChannel.forEach(item => {
            // Comparamos con los valores de tu BD ('WEB' y 'POS')
            if (item.channel === 'WEB') { //
                stats.online = item;
            } else if (item.channel === 'POS') { //
                stats.pos = item;
            }
        });

        res.status(200).json(stats);

    } catch (error) {
        console.error("Error al generar reporte por canal:", error);
        res.status(500).json({ message: "Error del servidor al generar el reporte", error: error.message });
    }
});


export default router;