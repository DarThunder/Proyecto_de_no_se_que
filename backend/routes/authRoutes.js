import { Router } from "express";
const router = Router();
import User from "../models/User.js";
import Role from "../models/Role.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

router.post("/register", async (req, res) => {
  const { username, password, email, role } = req.body;
  let roleDocument;

  if (role) {
    roleDocument = await Role.findOne({ name: role });
  }

  if (!roleDocument) {
    roleDocument = await Role.findOne({ name: "user" });
  }

  if (!roleDocument) {
    return res.status(500).json({
      error:
        "Error de configuración de la DB: Rol por defecto 'user' no encontrado.",
    });
  }

  const roleId = roleDocument._id;

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
      email,
      role: roleId,
    });

    await newUser.save();
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 1000 * 60 * 60 * 24,
    });

    res.status(201).json({
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

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 1000 * 60 * 60 * 24,
    });

    res.status(200).json({
      message: "Inicio de sesión exitoso",
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error en el servidor", details: err.message });
  }
});

export default router;
