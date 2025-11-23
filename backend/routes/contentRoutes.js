import { Router } from "express";
import Content from "../models/Content.js";
import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

const router = Router();

router.get("/:name", async (req, res) => {
  try {
    let contentDoc = await Content.findOne({ name: req.params.name });

    if (!contentDoc) {
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
        upsert: true,
      }
    );

    res.json({
      message: "Contenido actualizado exitosamente",
      content: updatedContent,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error al actualizar el contenido",
        error: error.message,
      });
  }
});

export default router;
