import { Router } from "express";
const router = Router();
import PaymentConfig from "../models/PaymentConfig.js";
import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

router.get("/active", verifyToken, async (req, res) => {
  try {
    // Buscamos solo los activos
    const configs = await PaymentConfig.find({ isActive: true });
    
    // Filtramos para NO enviar el clientSecret al frontend por seguridad
    const safeConfigs = configs.map(config => ({
      providerName: config.providerName,
      isActive: config.isActive,
      mode: config.credentials.mode,
      publicKey: config.credentials.clientId || config.credentials.apiKey // Enviamos solo la llave pública
    }));

    res.json(safeConfigs);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener métodos de pago" });
  }
});

router.use(verifyToken, hasPermission(0));

router.get("/", async (req, res) => {
  try {
    const configs = await PaymentConfig.find();
    res.json(configs);
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener configuraciones",
      error: error.message,
    });
  }
});

router.put("/:providerName", async (req, res) => {
  const { providerName } = req.params;
  const { isActive, credentials } = req.body;

  try {
    const updatedConfig = await PaymentConfig.findOneAndUpdate(
      { providerName: providerName.toUpperCase() },
      {
        $set: {
          isActive: isActive,
          credentials: credentials,
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      message: `Configuración de ${providerName} actualizada correctamente.`,
      config: updatedConfig,
    });
  } catch (error) {
    res.status(400).json({
      message: "Error al guardar configuración",
      error: error.message,
    });
  }
});

export default router;
