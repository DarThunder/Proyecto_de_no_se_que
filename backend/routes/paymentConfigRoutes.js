import { Router } from "express";
const router = Router();
import PaymentConfig from "../models/PaymentConfig.js";
import verifyToken from "../middleware/verifyToken.js";
import hasPermission from "../middleware/hasPermission.js";

/**
 * Obtiene las configuraciones de pago activas para el checkout del cliente.
 * 1SEGURIDAD: Filtra datos sensibles. Nunca devuelve 'clientSecret' al frontend.
 *
 * @route GET /payment-config/active
 * @access Private (User) - Aunque sea protegida, debe ser segura.
 */
router.get("/active", verifyToken, async (req, res) => {
  try {
    // Buscamos solo los activos
    const configs = await PaymentConfig.find({ isActive: true });

    // Filtramos para NO enviar el clientSecret al frontend por seguridad
    const safeConfigs = configs.map((config) => ({
      providerName: config.providerName,
      isActive: config.isActive,
      mode: config.credentials.mode,
      publicKey: config.credentials.clientId || config.credentials.apiKey, // Enviamos solo la llave pública
    }));

    res.json(safeConfigs);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener métodos de pago" });
  }
});

// Middleware: Todas las rutas siguientes requieren ser ADMINISTRADOR (Ring 0)
router.use(verifyToken, hasPermission(0));

/**
 * Obtiene TODAS las configuraciones de pago (incluyendo secretos).
 * Uso exclusivo del panel de administración.
 *
 * @route GET /payment-config
 * @access Private (Ring 0 - Admin Only)
 */
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

/**
 * Actualiza o crea la configuración de un proveedor de pagos.
 *
 * @route PUT /payment-config/:providerName
 * @access Private (Ring 0 - Admin Only)
 * @param {string} req.params.providerName - Nombre del proveedor (ej: 'PAYPAL')
 * @param {boolean} req.body.isActive - Estado de activación
 * @param {object} req.body.credentials - Objeto con clientId, secret, etc.
 */
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
