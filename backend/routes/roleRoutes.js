import { Router } from "express";
const router = Router();
import Role from "../models/Role.js";
import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

router.use(verifyToken, hasPermission(0));

router.get("/", async (req, res) => {
  try {
    const roles = await Role.find().sort({ permission_ring: 1 });
    res.json(roles);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener roles", error: error.message });
  }
});

router.post("/", async (req, res) => {
  const { name, permission_ring, allowed_modules, description } = req.body;

  try {
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ message: "El nombre del rol ya existe." });
    }

    const newRole = new Role({
      name,
      permission_ring: permission_ring || 3,
      allowed_modules: allowed_modules || [],
      description,
    });

    await newRole.save();
    res.status(201).json(newRole);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al crear el rol", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updatedRole = await Role.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedRole)
      return res.status(404).json({ message: "Rol no encontrado" });

    res.json(updatedRole);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al actualizar rol", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (role.name === "admin" || role.permission_ring === 0) {
      return res
        .status(403)
        .json({ message: "No se puede eliminar el rol de Administrador." });
    }

    await Role.findByIdAndDelete(req.params.id);
    res.json({ message: "Rol eliminado correctamente." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al eliminar rol", error: error.message });
  }
});

export default router;
