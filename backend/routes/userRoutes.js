import { Router } from "express";
const router = Router();
import User from "../models/User.js";
import Role from "../models/Role.js";

import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

/**
 * Obtiene la lista de todos los usuarios (sin hashes de contraseña).
 *
 * @route GET /users
 * @access Private (Ring 1 - Manager)
 */
router.get("/", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const users = await User.find()
      .select("-password_hash")
      .populate("role", "name permission_ring");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Obtiene lista de roles disponibles (Helper para el frontend de gestión de usuarios).
 *
 * @route GET /users/roles
 * @access Private (Ring 1 - Manager)
 */
router.get("/roles", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const roles = await Role.find().sort({ permission_ring: 1 });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Obtiene el perfil del usuario autenticado actualmente (Me).
 *
 * @route GET /users/me
 * @access Private (Cualquier usuario logueado)
 */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .select("-password_hash")
      .populate("role", "name permission_ring");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Obtiene un usuario específico por ID.
 * REGLA DE ACCESO: Un usuario puede ver su propio perfil.
 * Si intenta ver otro perfil, necesita ser Admin (Ring 0).
 *
 * @route GET /users/:id
 */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUserId = req.user.id;

    if (userId !== requestingUserId) {
      // Si no soy yo mismo, invoco el middleware de permiso 0 manualmente
      await hasPermission(0)(req, res, async () => {
        const user = await User.findById(userId).select("-password_hash");
        if (!user) {
          return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.json(user);
      });
      return;
    }

    const user = await User.findById(userId).select("-password_hash");
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Actualiza la información de un usuario.
 * LÓGICA DE SEGURIDAD (Permisos Verticales):
 * 1. No puedes modificar a alguien con mayor rango que tú.
 * 2. No puedes asignarle a alguien un rol mayor al tuyo.
 *
 * @route PUT /users/:id
 * @access Private (Ring 1 - Manager)
 */
router.put("/:id", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id).populate("role");
    if (!targetUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const requesterRing = req.user.permission_ring; // Mi nivel (ej: 1)
    const targetRing = targetUser.role.permission_ring; // Nivel de la víctima (ej: 0)

    // Regla 1: Protección de superiores
    if (requesterRing > targetRing) {
      return res.status(403).json({
        message:
          "No puedes modificar a un usuario con un rol superior al tuyo.",
      });
    }

    // Regla 2: Escalada de privilegios
    if (req.body.role) {
      const newRole = await Role.findById(req.body.role);
      // Si intento dar un rol 0 (Admin) y yo soy 1 (Gerente)... error.
      if (newRole && newRole.permission_ring < requesterRing) {
        return res
          .status(403)
          .json({ message: "No puedes asignar un rol superior al tuyo." });
      }
    }

    // Limpieza de contraseña vacía para evitar hashear strings vacíos
    if (req.body.password_hash === "" || req.body.password_hash === null) {
      delete req.body.password_hash;
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).select("-password_hash");

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * Elimina un usuario del sistema.
 *
 * @route DELETE /users/:id
 * @access Private (Ring 0 - Admin Only)
 */
router.delete("/:id", verifyToken, hasPermission(0), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json({ message: "Usuario eliminado" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Busca clientes (usuarios con rol >= 2) por nombre.
 * Útil para el POS o asignar ventas.
 *
 * @route GET /users/search/customers
 * @access Private (Ring 2 - Cashier)
 * @param {string} req.query.query - Término de búsqueda (min 2 chars)
 */
router.get(
  "/search/customers",
  verifyToken,
  hasPermission(2),
  async (req, res) => {
    try {
      const { query } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          message: "La búsqueda debe tener al menos 2 caracteres",
        });
      }

      const customers = await User.find({
        username: { $regex: query, $options: "i" },
      })
        .select("-password_hash")
        .populate("role", "name permission_ring")
        .limit(10);

      // Filtra en memoria para asegurar que solo devolvemos "clientes" o empleados de bajo rango
      // Esto oculta a los administradores de la búsqueda del cajero
      const filteredCustomers = customers.filter(
        (customer) => customer.role && customer.role.permission_ring >= 2
      );

      res.json(filteredCustomers);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;
