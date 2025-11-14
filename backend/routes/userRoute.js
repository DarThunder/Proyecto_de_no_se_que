import { Router } from "express";
const router = Router();
import User from "../models/User.js";
import Role from "../models/Role.js";

import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

// --- CAMBIO ---
// GET /: Ahora Gerente (1) y Admin (0) pueden ver todos los usuarios.
router.get("/", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const users = await User.find()
      .select("-password_hash")
      .populate("role", "name permission_ring"); // Poblar info del rol
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- NUEVA RUTA ---
// GET /roles: Permite al Gerente (1) obtener la lista de roles para asignar
router.get("/roles", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const roles = await Role.find().sort({ permission_ring: 1 }); // Ordenar por jerarquía
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// GET /me: Obtener mi propia información (Sin cambios)
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

// GET /:id (Sin cambios, la lógica es compleja pero correcta)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUserId = req.user.id;

    // Si un usuario intenta ver a OTRO usuario, requiere ser Admin
    if (userId !== requestingUserId) {
      await hasPermission(0)(req, res, async () => {
        const user = await User.findById(userId).select("-password_hash");
        if (!user) {
          return res.status(404).json({ message: "Usuario no encontrado" });
        }
        res.json(user);
      });
      return;
    }

    // Si es el mismo usuario, se permite
    const user = await User.findById(userId).select("-password_hash");
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- CAMBIO ---
// PUT /:id: Ahora Gerente (1) y Admin (0) pueden actualizar usuarios.
router.put("/:id", verifyToken, hasPermission(1), async (req, res) => {
  try {
    // Un Gerente (1) no puede modificar a un Admin (0)
    const targetUser = await User.findById(req.params.id).populate("role");
    if (!targetUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    // El rol del solicitante (ej. 1 para Gerente)
    const requesterRing = req.user.permission_ring; 
    // El rol del usuario a editar (ej. 0 para Admin)
    const targetRing = targetUser.role.permission_ring;

    if (requesterRing > targetRing) {
         return res.status(403).json({ message: "No puedes modificar a un usuario con un rol superior al tuyo." });
    }

    // Un Gerente no puede ascender a alguien a Admin
    if (req.body.role) {
        const newRole = await Role.findById(req.body.role);
        if (newRole && newRole.permission_ring < requesterRing) {
             return res.status(403).json({ message: "No puedes asignar un rol superior al tuyo." });
        }
    }
    
    // Evitar que la contraseña se actualice a vacío
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

// DELETE /:id (Sin cambios, solo Admin puede borrar)
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


// --- CAMBIO (BUG FIX) ---
// GET /search/customers: Usado por POS, debe ser hasPermission(2) [Cajero]
router.get(
  "/search/customers",
  verifyToken,
  hasPermission(2), // <-- Cambiado de 1 a 2
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

      // Filtra para que solo muestre usuarios (ring 3) o cajeros (ring 2)
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