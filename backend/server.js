import "dotenv/config";
import express, { json } from "express";
import { connect } from "mongoose";
import cors from "cors"; // <-- 1. Importa CORS

// Importa tus rutas
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoute.js";
import cartRoutes from "./routes/cartRoutes.js"; // (Si ya agregaste el del carrito)

const app = express();
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;

// --- 2. Configura las opciones de CORS ---
// Define qué orígenes (frontends) tienen permiso
const corsOptions = {
  origin: "http://127.0.0.1:3000", // Permite solo a tu frontend en el puerto 3000
  optionsSuccessStatus: 200 
};

// --- 3. Aplica los middlewares ---
app.use(cors(corsOptions)); // <-- Usa CORS con tus opciones
app.use(json()); // <-- Asegúrate que json() venga después de cors

// (Conexión a MongoDB...)
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

// --- 4. Define tus rutas (después de los middlewares) ---
app.use("/products", productRoutes);
app.use("/auth", authRoutes);
app.use("/orders", orderRoutes);
app.use("/users", userRoutes);
// app.use("/cart", cartRoutes); // (Si ya agregaste el del carrito)

app.use((req, res) => {
  res.status(404).json({ error: "Recurso no encontrado" });
});