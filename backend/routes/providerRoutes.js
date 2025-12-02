import { Router } from "express";
import Provider from "../models/Provider.js";
import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

const router = Router();

/**
 * Obtiene la lista de todos los proveedores registrados.
 * Ordenados por los más recientes primero.
 *
 * @route GET /providers
 * @access Private (Ring 1 - Manager)
 */
router.get("/", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const providers = await Provider.find().sort({ createdAt: -1 });
    res.json(providers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Obtiene los detalles de un proveedor específico.
 *
 * @route GET /providers/:id
 * @access Private (Ring 1 - Manager)
 */
router.get("/:id", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }
    res.json(provider);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Registra un nuevo proveedor en el sistema.
 * Valida que no exista duplicidad de Nombre o Email.
 *
 * @route POST /providers
 * @access Private (Ring 1 - Manager)
 * @param {string} req.body.name - Nombre de la empresa
 * @param {string} req.body.contactName - Persona de contacto
 * @param {string} req.body.email - Email único
 */
router.post("/", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const { name, contactName, email, phone, address, active } = req.body;

    const existingProvider = await Provider.findOne({
      $or: [{ name }, { email }],
    });

    if (existingProvider) {
      return res
        .status(400)
        .json({ message: "Ya existe un proveedor con ese nombre o email." });
    }

    const newProvider = new Provider({
      name,
      contactName,
      email,
      phone,
      address,
      active: active !== undefined ? active : true,
    });

    const savedProvider = await newProvider.save();
    res.status(201).json(savedProvider);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * Actualiza la información de un proveedor existente.
 *
 * @route PUT /providers/:id
 * @access Private (Ring 1 - Manager)
 */
router.put("/:id", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const updatedProvider = await Provider.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedProvider) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }
    res.json(updatedProvider);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * Elimina un proveedor del sistema.
 *
 * @route DELETE /providers/:id
 * @access Private (Ring 1 - Manager)
 */
router.delete("/:id", verifyToken, hasPermission(1), async (req, res) => {
  try {
    const deletedProvider = await Provider.findByIdAndDelete(req.params.id);

    if (!deletedProvider) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    res.json({ message: "Proveedor eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
