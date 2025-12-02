/**
 * @file server.js
 * @description Punto de entrada principal del servidor Backend (Express + MongoDB).
 * Configura middlewares, conecta a la base de datos y define las rutas de la API.
 */

import "dotenv/config";
import express, { json } from "express";
import { connect } from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

// Importación de Rutas
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import providerRoutes from "./routes/providerRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import paymentConfigRoutes from "./routes/paymentConfigRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import backupRoutes from "./routes/backupRoutes.js";
import cashRoutes from "./routes/cashRoutes.js";

const app = express();
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;

// Configuración de rutas estáticas (ES Modules fix)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Lista de orígenes permitidos para CORS.
 * Incluye localhost y Live Server (127.0.0.1).
 */
const allowedOrigins = new Set([
  "http://127.0.0.1:5500",
  "http://127.0.0.1:3000",
  "http://localhost:5500",
  "http://localhost:3000",
  "http://localhost:8080",
]);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Origen no permitido por CORS: " + origin));
    }
  },
  credentials: true, // Permite envío de cookies
  methods: ["GET", "POST", "PUT", "DELETE"],
  optionsSuccessStatus: 200,
};

// --- Middlewares Globales ---
app.use(cors(corsOptions));
app.use(json());
app.use(cookieParser());

// Archivos Estáticos
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "html")));
// Servir carpeta sources padre para imágenes
app.use("/sources", express.static(path.join(__dirname, "..", "sources")));

// --- Conexión a Base de Datos ---
connect(MONGODB_URI)
  .then(() => {
    console.log("Conexión a MongoDB exitosa.");
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error al conectar a MongoDB:", err.message);
    process.exit(1);
  });

// --- Definición de Endpoints ---
app.use("/products", productRoutes);
app.use("/auth", authRoutes);
app.use("/orders", orderRoutes);
app.use("/users", userRoutes);
app.use("/cart", cartRoutes);
app.use("/reviews", reviewRoutes);
app.use("/coupons", couponRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/reports", reportRoutes);
app.use("/providers", providerRoutes);

app.use("/content", contentRoutes);
app.use("/categories", categoryRoutes);
app.use("/messages", messageRoutes);
app.use("/payment-config", paymentConfigRoutes);
app.use("/roles", roleRoutes);
app.use("/backup", backupRoutes);
app.use("/cash-movements", cashRoutes);

// Ruta especial para vista HTML de inventario
app.get("/inventario-stock-bajo", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "html", "InventarioStockB.html"));
});

// Debug: Imprimir rutas cargadas (Solo desarrollo)
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(
      `Ruta directa: ${Object.keys(middleware.route.methods)} ${
        middleware.route.path
      }`
    );
  } else if (middleware.name === "router") {
    console.log(`Router montado: ${middleware.regexp}`);
  }
});

// Middleware de Error 404
app.use((_, res) => {
  res.status(404).json({ error: "Recurso no encontrado" });
});
