import { Router } from "express";
import Content from "../models/Content.js";
import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

const router = Router();

/**
 * Obtiene el contenido HTML de una sección específica.
 * Si la sección no existe en la BD, la crea automáticamente con un texto por defecto.
 *
 * @route GET /content/:name
 * @param {string} req.params.name - Identificador de la sección (ej: 'home-banner', 'about-us')
 * @returns {object} { htmlContent: string }
 */
router.get("/:name", async (req, res) => {
  try {
    let contentDoc = await Content.findOne({ name: req.params.name });

    if (!contentDoc) {
      // Lazy creation: Si no existe, lo creamos al vuelo
      contentDoc = new Content({ name: req.params.name });
      await contentDoc.save();
    }

    res.json({ htmlContent: contentDoc.htmlContent });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener el contenido", error: error.message });
  }
});

/**
 * Actualiza el contenido HTML de una sección.
 * Utiliza 'upsert' para crear el documento si no existiera (doble seguridad).
 *
 * @route PUT /content/:name
 * @access Private (Ring 0 - Admin Only)
 * @param {string} req.params.name - Identificador de la sección
 * @param {string} req.body.htmlContent - Nuevo contenido HTML
 */
router.put("/:name", [verifyToken, hasPermission(0)], async (req, res) => {
  const { htmlContent } = req.body;

  if (typeof htmlContent !== "string") {
    return res
      .status(400)
      .json({ message: "El campo htmlContent (string) es requerido." });
  }

  try {
    const updatedContent = await Content.findOneAndUpdate(
      { name: req.params.name },
      { $set: { htmlContent: htmlContent } },
      {
        new: true,
        upsert: true, // Crea si no existe
      }
    );

    res.json({
      message: "Contenido actualizado exitosamente",
      content: updatedContent,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar el contenido",
      error: error.message,
    });
  }
});

export default router;
