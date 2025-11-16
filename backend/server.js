import "dotenv/config";
import express, { json } from "express";
import { connect } from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path"; 
import { fileURLToPath } from "url"; 

import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoute.js";
import cartRoutes from "./routes/cartRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import providerRoutes from "./routes/providerRoutes.js";
// SE METIO ESTO PARA TERMINOS Y CONDICIONES
import contentRoutes from "./routes/contentRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";

const app = express();
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;

// Configurar __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(json());
app.use(cookieParser());

// SERVIR ARCHIVOS ESTÁTICOS CORRECTAMENTE
app.use(express.static(path.join(__dirname, 'public'))); // Para /css, /js, etc.
app.use(express.static(path.join(__dirname, 'html')));   // Para archivos HTML
app.use('/sources', express.static(path.join(__dirname, '..', 'sources')));

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

// Le decimos a express que use estas rutas
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
// SE METIO ESTO PARA TERMINOS Y CONDICIONES
app.use("/content", contentRoutes);
app.use("/categories", categoryRoutes);
app.use("/messages", messageRoutes);

app.get("/inventario-stock-bajo", (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'html', 'InventarioStockB.html'));
});

// DEBUG: Mostrar rutas cargadas
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(`🛣️  Ruta directa: ${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    console.log(`🛣️  Router montado: ${middleware.regexp}`);
  }
});

app.use((_, res) => {
  res.status(404).json({ error: "Recurso no encontrado" });
});