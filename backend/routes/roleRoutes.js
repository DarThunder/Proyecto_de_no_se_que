import { Router } from "express";
const router = Router();
import Role from "../models/Role.js";
import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

// Middleware global: Todas las rutas de roles requieren ser ADMIN (Ring 0)
router.use(verifyToken, hasPermission(0));

/**
 * Obtiene todos los roles del sistema.
 * Ordenados por jerarquía (permission_ring ascendente).
 *
 * @route GET /roles
 * @access Private (Ring 0 - Admin)
 */
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

/**
 * Crea un nuevo rol en el sistema.
 *
 * @route POST /roles
 * @access Private (Ring 0 - Admin)
 * @param {string} req.body.name - Nombre único del rol
 * @param {number} req.body.permission_ring - Nivel de permiso (0=Admin, 1=Gerente...)
 * @param {string[]} req.body.allowed_modules - Módulos permitidos
 */
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

/**
 * Actualiza un rol existente.
 *
 * @route PUT /roles/:id
 * @access Private (Ring 0 - Admin)
 */
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

/**
 * Elimina un rol.
 * PROTECCIÓN: Impide borrar el rol 'admin' o cualquier rol con anillo 0
 * para evitar bloquear el sistema.
 *
 * @route DELETE /roles/:id
 * @access Private (Ring 0 - Admin)
 */
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
