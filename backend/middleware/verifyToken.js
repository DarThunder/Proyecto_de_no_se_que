import jwt from "jsonwebtoken";

/**
 * Middleware de autenticación que verifica el JWT almacenado en las cookies.
 * Si es válido, decodifica el payload y lo adjunta a `req.user`.
 *
 * @param {Object} req - Objeto de solicitud de Express
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Function} next - Función para continuar al siguiente middleware
 * @returns {any} Retorna respuesta 401/403 si falla, o void si es exitoso.
 */
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Acceso denegado. No se proporcionó token." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (err) {
    res.status(403).json({ message: "Token no válido o expirado." });
  }
};

export default verifyToken;
