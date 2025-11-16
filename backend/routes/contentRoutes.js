// Importamos el Router de Express para definir un conjunto de rutas
import { Router } from 'express';
// Importamos el modelo 'Content' que acabamos de crear
import Content from '../models/Content.js';

// Importamos los middlewares de seguridad
// 'verifyToken' revisa si el usuario ha iniciado sesión (autenticación)
import { verifyToken } from '../middleware/verifyToken.js';
// 'hasPermission' revisa si el usuario tiene el rol correcto (autorización)
import { hasPermission } from '../middleware/hasPermission.js';

// Creamos una nueva instancia del Router
const router = Router();

// --- RUTA PÚBLICA (para usuarios) ---
/**
 * GET /content/:name
 * Obtiene un bloque de contenido específico (ej. /content/terms)
 * Es pública, cualquiera puede verla.
 * :name es un parámetro dinámico en la URL.
 */
router.get('/:name', async (req, res) => {
  try {
    // Busca en la BD un documento donde 'name' coincida con el parámetro de la URL
    let contentDoc = await Content.findOne({ name: req.params.name });

    // --- Lógica de Auto-Creación ---
    // Si no se encuentra el documento (ej. es la primera vez que se pide),
    // lo creamos "al vuelo" con el contenido por defecto.
    if (!contentDoc) {
      contentDoc = new Content({ name: req.params.name });
      await contentDoc.save(); // Guardamos el nuevo documento en la BD
    }
    
    // Devolvemos solo el contenido HTML en formato JSON
    res.json({ htmlContent: contentDoc.htmlContent });

  } catch (error) {
    // Si algo sale mal (ej. error de BD), enviamos un error 500
    res.status(500).json({ message: 'Error al obtener el contenido', error: error.message });
  }
});

// --- RUTA PROTEGIDA (para Admin) ---
/**
 * PUT /content/:name
 * Actualiza (o crea) un bloque de contenido (ej. /content/terms)
 * Esta ruta está protegida y requiere permisos de Admin (Anillo 0).
 */
router.put(
  '/:name',
  [verifyToken, hasPermission(0)], // Array de Middlewares: Se ejecutan en orden.
                                   // 1. verifyToken: ¿Está logueado?
                                   // 2. hasPermission(0): ¿Es Admin (Anillo 0)?
                                   // Si alguno falla, la petición no llega al manejador.
  async (req, res) => {
    // Extraemos el nuevo contenido del cuerpo (body) de la petición
    const { htmlContent } = req.body;

    // Validación simple: nos aseguramos de que 'htmlContent' fue enviado y es un string
    if (typeof htmlContent !== 'string') {
      return res.status(400).json({ message: 'El campo htmlContent (string) es requerido.' });
    }

    try {
      // Busca un documento por 'name' y lo actualiza
      const updatedContent = await Content.findOneAndUpdate(
        { name: req.params.name }, // El filtro (a quién buscar)
        { $set: { htmlContent: htmlContent } }, // Los datos (qué actualizar)
        { 
          new: true, // Opción: Devuelve el documento ya actualizado (no el viejo)
          upsert: true // Opción MÁGICA: Si no lo encuentra ('up'), lo inserta ('sert').
        } 
      );
      
      // Devolvemos un mensaje de éxito y el contenido actualizado
      res.json({ message: 'Contenido actualizado exitosamente', content: updatedContent });

    } catch (error) {
      // Si algo sale mal, enviamos un error 500
      res.status(500).json({ message: 'Error al actualizar el contenido', error: error.message });
    }
  }
);

// Exportamos el router para que server.js pueda usarlo
export default router;