import { Router } from "express";
const router = Router();
import User from "../models/User.js";
import Role from "../models/Role.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendPasswordResetEmail } from "../utils/emailService.js";

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
      secure: true,
      sameSite: "None",
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
      secure: true,
      sameSite: "None",
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

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        message:
          "Si la cuenta existe, se ha enviado un correo de recuperación.",
      });
    }

    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET_RESET,
      { expiresIn: "15m" }
    );

    const resetLink = `http://localhost:8080/auth/reset-password/${resetToken}`;

    await sendPasswordResetEmail(user.email, resetLink);

    res.status(200).json({
      message: "Si la cuenta existe, se ha enviado un correo de recuperación.",
    });
  } catch (err) {
    res.status(500).json({
      error: "Error en el servidor al solicitar restablecimiento.",
      details: err.message,
    });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res
      .status(400)
      .json({ error: "La nueva contraseña es obligatoria." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_RESET);
    const userId = decoded.id;

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    const user = await User.findByIdAndUpdate(
      userId,
      { password_hash },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    res.status(200).json({
      message:
        "Contraseña restablecida exitosamente. Ahora puedes iniciar sesión.",
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(400)
        .json({ error: "El token de recuperación ha expirado." });
    }
    if (err.name === "JsonWebTokenError") {
      return res
        .status(400)
        .json({ error: "Token de recuperación no válido." });
    }

    res.status(500).json({
      error: "Error del servidor al restablecer la contraseña.",
      details: err.message,
    });
  }
});

export default router;
