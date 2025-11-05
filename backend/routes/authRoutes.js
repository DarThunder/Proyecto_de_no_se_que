import { Router } from "express";
const router = Router();
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

router.post("/register", async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "El nombre de usuario ya está en uso" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      password_hash,
      role: role || "user",
    });

    await newUser.save();
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET
    );

    res.status(201).json({
      token: token,
      message: "Cuenta creada exitosamente",
    });
  } catch (err) {
    res.status(500).json({
      error: "Error al crear la cuenta",
      details: err.message,
    });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(401)
        .json({ error: "Usuario o contraseña incorrectos" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ error: "Usuario o contraseña incorrectos" });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    res.status(200).json({
      token: token,
      message: "Inicio de sesión exitoso",
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error en el servidor", details: err.message });
  }
});

export default router;
