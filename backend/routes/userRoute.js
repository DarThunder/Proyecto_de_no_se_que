import { Router } from "express";
const router = Router();
import User from "../models/User.js";
import Role from "../models/Role.js";

import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

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

router.get("/roles", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const roles = await Role.find().sort({ permission_ring: 1 });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUserId = req.user.id;

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

    const user = await User.findById(userId).select("-password_hash");
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id).populate("role");
    if (!targetUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const requesterRing = req.user.permission_ring;
    const targetRing = targetUser.role.permission_ring;

    if (requesterRing > targetRing) {
      return res
        .status(403)
        .json({
          message:
            "No puedes modificar a un usuario con un rol superior al tuyo.",
        });
    }

    if (req.body.role) {
      const newRole = await Role.findById(req.body.role);
      if (newRole && newRole.permission_ring < requesterRing) {
        return res
          .status(403)
          .json({ message: "No puedes asignar un rol superior al tuyo." });
      }
    }

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
