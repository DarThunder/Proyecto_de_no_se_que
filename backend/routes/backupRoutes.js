import { Router } from "express";
import path from "path";
import fs from "fs";
import archiver from "archiver";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Genera y descarga una copia de seguridad completa del sistema.
 * El backup incluye:
 * 1. Dump de todas las colecciones de MongoDB en formato JSON.
 * 2. Copia de la carpeta de archivos estáticos 'sources'.
 *
 * La respuesta es un stream de archivo ZIP.
 *
 * @route GET /backup/download
 * @access Private (Ring 0 - Admin Only)
 */
router.get("/download", verifyToken, hasPermission(0), async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
    const filename = `backup-ropadb-${timestamp}.zip`;

    // Configura la cabecera para forzar la descarga del archivo
    res.attachment(filename);

    const archive = archiver("zip", {
      zlib: { level: 9 }, // Nivel máximo de compresión
    });

    // Manejo de errores durante la compresión
    archive.on("error", (err) => {
      console.error("Error en backup:", err);
      res.status(500).send({ error: err.message });
    });

    // Conectar el stream del archivo zip directamente a la respuesta HTTP
    archive.pipe(res);

    // 1. Obtener y agregar datos de MongoDB
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    for (const collection of collections) {
      const name = collection.name;
      const data = await mongoose.connection.db
        .collection(name)
        .find({})
        .toArray();
      // Agrega cada colección como un archivo JSON dentro del zip
      archive.append(JSON.stringify(data, null, 2), {
        name: `database/${name}.json`,
      });
    }

    // 2. Agregar archivos estáticos (imágenes, etc.)
    const sourcesPath = path.join(__dirname, "..", "..", "sources");

    if (fs.existsSync(sourcesPath)) {
      archive.directory(sourcesPath, "files");
    } else {
      archive.append("No se encontró la carpeta sources.", {
        name: "files/error.txt",
      });
    }

    // Finalizar el archivo zip (cierra el stream y termina la respuesta)
    await archive.finalize();
  } catch (error) {
    console.error("Error generando respaldo:", error);
    // Solo enviamos error JSON si las cabeceras no se han enviado aún (si el stream no empezó)
    if (!res.headersSent) {
      res.status(500).json({ message: "Error al generar el respaldo" });
    }
  }
});

export default router;
