import Role from "../models/Role.js";
import User from "../models/User.js";

const hasPermission = (requiredRing) => {
  return async (req, res, next) => {
    try {
      const roleId = req.user.role;
      const role = await Role.findById(roleId);

      if (!role) {
        return res
          .status(403)
          .json({ message: "Rol de usuario no encontrado." });
      }

      if (role.permission_ring <= requiredRing) {
        req.user.permission_ring = role.permission_ring;
        return next();
      }

      return res.status(403).json({
        message: "No tienes los permisos suficientes para esta acción.",
      });
    } catch (err) {
      res.status(500).json({
        message: "Error de servidor en la verificación de permisos.",
        details: err.message,
      });
    }
  };
};

export default hasPermission;
