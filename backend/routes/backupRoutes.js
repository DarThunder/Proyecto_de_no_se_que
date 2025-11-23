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

router.get("/download", verifyToken, hasPermission(0), async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, "-").split(".")[0];
    const filename = `backup-ropadb-${timestamp}.zip`;

    res.attachment(filename);

    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    archive.on("error", (err) => {
      console.error("Error en backup:", err);
      res.status(500).send({ error: err.message });
    });

    archive.pipe(res);

    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    for (const collection of collections) {
      const name = collection.name;
      const data = await mongoose.connection.db
        .collection(name)
        .find({})
        .toArray();
      archive.append(JSON.stringify(data, null, 2), {
        name: `database/${name}.json`,
      });
    }

    const sourcesPath = path.join(__dirname, "..", "..", "sources");

    if (fs.existsSync(sourcesPath)) {
      archive.directory(sourcesPath, "files");
    } else {
      archive.append("No se encontró la carpeta sources.", {
        name: "files/error.txt",
      });
    }

    await archive.finalize();
  } catch (error) {
    console.error("Error generando respaldo:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Error al generar el respaldo" });
    }
  }
});

export default router;
