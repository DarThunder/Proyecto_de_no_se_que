import { Router } from "express";
const router = Router();
import { Types } from "mongoose";
import Category from "../models/Category.js";

/**
 * Obtiene todas las categorías activas (para mostrar al cliente).
 * Ordenadas alfabéticamente.
 *
 * @route GET /categories
 */
router.get("/", async (_, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({
      name: 1,
    });
    res.status(200).json(categories);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al obtener categorías", details: err.message });
  }
});

/**
 * Obtiene TODAS las categorías (activas e inactivas).
 * Uso interno para panel administrativo.
 *
 * @route GET /categories/admin/all
 */
router.get("/admin/all", async (_, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json(categories);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error al obtener categorías", details: err.message });
  }
});

/**
 * Crea una nueva categoría.
 * Valida que el nombre no esté duplicado.
 *
 * @route POST /categories/admin
 * @param {string} req.body.name - Nombre único
 * @param {string} [req.body.description] - Descripción opcional
 * @param {string} [req.body.image_url] - URL de imagen
 */
router.post("/admin", async (req, res) => {
  const { name, description, image_url } = req.body;

  console.log("📨 Creando categoría con datos:", req.body);

  if (!name || name.trim() === "") {
    return res
      .status(400)
      .json({ error: "El nombre de la categoría es requerido" });
  }

  try {
    // Búsqueda insensible a mayúsculas/minúsculas
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existingCategory) {
      return res
        .status(400)
        .json({ error: "Ya existe una categoría con ese nombre" });
    }

    const newCategory = new Category({
      name: name.trim(),
      description: description?.trim() || "",
      image_url: image_url || "sources/img/category_default.png",
    });

    await newCategory.save();
    console.log("Categoría creada exitosamente:", newCategory);
    res.status(201).json(newCategory);
  } catch (err) {
    console.error("Error al crear categoría:", err);
    res
      .status(500)
      .json({ error: "Error al crear la categoría", details: err.message });
  }
});

/**
 * Actualiza una categoría existente.
 * Valida duplicidad de nombre excluyendo el ID actual.
 *
 * @route PUT /categories/admin/:id
 * @param {string} req.params.id - ID de la categoría
 */
router.put("/admin/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image_url, isActive } = req.body;

    console.log("Actualizando categoría:", id, req.body);

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de categoría no válido" });
    }

    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json({ error: "El nombre de la categoría es requerido" });
    }

    // Verificar si el nuevo nombre ya existe en OTRA categoría
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      _id: { $ne: id },
    });

    if (existingCategory) {
      return res
        .status(400)
        .json({ error: "Ya existe otra categoría con ese nombre" });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        description: description?.trim() || "",
        image_url: image_url || "sources/img/category_default.png",
        isActive: isActive !== undefined ? isActive : true,
      },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    res.status(200).json(updatedCategory);
  } catch (err) {
    console.error("Error al actualizar categoría:", err);
    res.status(500).json({
      error: "Error al actualizar la categoría",
      details: err.message,
    });
  }
});

/**
 * Elimina una categoría.
 * PROTECCIÓN: Verifica si hay productos usando esta categoría antes de borrar.
 *
 * @route DELETE /categories/admin/:id
 */
router.delete("/admin/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Eliminando categoría:", id);

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de categoría no válido" });
    }

    // Importación dinámica para evitar ciclos de dependencia si fuera necesario
    const Product = (await import("../models/Product.js")).default;
    const productsWithCategory = await Product.findOne({ category: id });

    if (productsWithCategory) {
      return res.status(400).json({
        error:
          "No se puede eliminar la categoría porque hay productos asociados a ella",
      });
    }

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    res.status(200).json({ message: "Categoría eliminada correctamente" });
  } catch (err) {
    console.error("Error al eliminar categoría:", err);
    res
      .status(500)
      .json({ error: "Error al eliminar la categoría", details: err.message });
  }
});

/**
 * Alterna el estado de activo/inactivo de una categoría.
 *
 * @route PATCH /categories/admin/:id/toggle
 */
router.patch("/admin/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Cambiando estado de categoría:", id);

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de categoría no válido" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.status(200).json({
      message: `Categoría ${
        category.isActive ? "activada" : "desactivada"
      } correctamente`,
      category,
    });
  } catch (err) {
    console.error("Error al cambiar estado de categoría:", err);
    res.status(500).json({
      error: "Error al cambiar estado de la categoría",
      details: err.message,
    });
  }
});

export default router;
