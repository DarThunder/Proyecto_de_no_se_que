import { Router } from "express";
import Sale from "../models/Sale.js";
import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";
import mongoose from "mongoose";

const router = Router();

/**
 * HU 31: Reporte de Productos más Vendidos
 * (Código existente, ya corregido para usar 'items')
 */
router.get("/bestsellers", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const bestSellers = await Sale.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.variant", 
          totalQuantitySold: { $sum: "$items.quantity" }, 
          totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.unit_price"] } } 
        }
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 10 },
      // ... (Resto de los lookups y projects)
      {
        $lookup: {
          from: "productvariants", 
          localField: "_id",
          foreignField: "_id",
          as: "variantDetails"
        }
      },
      {
        $lookup: {
          from: "products", 
          localField: "variantDetails.product",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $project: {
          _id: 1, 
          totalQuantitySold: 1,
          totalRevenue: 1,
          variant: { $arrayElemAt: ["$variantDetails", 0] },
          product: { $arrayElemAt: ["$productDetails", 0] }
        }
      },
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
 * (Código existente, ya corregido para usar 'transaction_type' y 'total')
 */
router.get("/sales-by-channel", verifyToken, hasPermission(1), async (req, res) => {
    try {
        const salesByChannel = await Sale.aggregate([
            {
                $group: {
                    _id: "$transaction_type", // 'WEB' o 'POS'
                    totalRevenue: { $sum: "$total" }, 
                    totalSales: { $sum: 1 } 
                }
            },
            {
                $project: {
                    _id: 0,
                    channel: "$_id",
                    revenue: "$totalRevenue",
                    salesCount: "$totalSales"
                }
            }
        ]);

        const stats = {
            online: { revenue: 0, salesCount: 0 },
            pos: { revenue: 0, salesCount: 0 }
        };

        salesByChannel.forEach(item => {
            if (item.channel === 'WEB') {
                stats.online = item;
            } else if (item.channel === 'POS') {
                stats.pos = item;
            }
        });

        res.status(200).json(stats);

    } catch (error) {
        console.error("Error al generar reporte por canal:", error);
        res.status(500).json({ message: "Error del servidor al generar el reporte", error: error.message });
    }
});


// --- ========= ENDPOINT CORREGIDO PARA HU 25 ========= ---

/**
 * HU 25: Reporte de Ventas por Vendedor (Empleado)
 * CORREGIDO: Ahora agrupa por 'cashier' en lugar de 'employee'
 */
router.get("/sales-by-employee", verifyToken, hasPermission(1), async (req, res) => {
    try {
        const salesByEmployee = await Sale.aggregate([
            // 1. Agrupar por el campo 'cashier' (ID del usuario)
            {
                $group: {
                    _id: "$cashier", // <-- ¡CORRECCIÓN AQUÍ! (Tu modelo Sale usa 'cashier')
                    totalRevenue: { $sum: "$total" }, 
                    totalSales: { $sum: 1 } 
                }
            },
            
            // 2. Calcular el Ticket Promedio
            {
                $project: {
                    _id: 1,
                    totalRevenue: 1,
                    totalSales: 1,
                    averageTicket: { $divide: ["$totalRevenue", "$totalSales"] } 
                }
            },

            // 3. Obtener los datos del Vendedor (de la colección 'users')
            {
                $lookup: {
                    from: "users", // Nombre de la colección de usuarios
                    localField: "_id",
                    foreignField: "_id",
                    as: "employeeDetails"
                }
            },

            // 4. Limpiar la salida
            {
                $project: {
                    _id: 1,
                    totalRevenue: 1,
                    totalSales: 1,
                    averageTicket: 1,
                    employee: { $arrayElemAt: ["$employeeDetails", 0] } 
                }
            },

            // 5. Proyección final
            {
                $project: {
                    employeeId: "$_id",
                    username: "$employee.username", 
                    email: "$employee.email", 
                    totalRevenue: 1,
                    totalSales: 1,
                    averageTicket: 1
                }
            },

            // 6. Ordenar por el que más ha vendido
            { $sort: { totalRevenue: -1 } }
        ]);

        res.status(200).json(salesByEmployee);

    } catch (error) {
        console.error("Error al generar reporte por vendedor:", error);
        res.status(500).json({ message: "Error del servidor al generar el reporte", error: error.message });
    }
});
// --- ========= FIN DEL ENDPOINT CORREGIDO ========= ---

export default router;