import "dotenv/config";

import express, { json } from "express";
import { connect } from "mongoose";

import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoute.js";

const app = express();
const PORT = process.env.PORT || 8080;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(json());

connect(MONGODB_URI)
  .then(() => {
    console.log("Conexión a MongoDB exitosa.");

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log("Presiona Ctrl+C para detenerlo");
    });
  })
  .catch((err) => {
    console.error("Error al conectar a MongoDB:", err.message);
    process.exit(1);
  });

app.use("/products", productRoutes);
app.use("/auth", authRoutes);
app.use("/orders", orderRoutes);
app.use("/users", userRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Recurso no encontrado" });
});
