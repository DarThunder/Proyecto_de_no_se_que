// Importamos las funciones 'Schema' (para definir la estructura) y 'model' (para crear el modelo) de mongoose
import { Schema, model } from 'mongoose';

/**
 * Define la estructura (esquema) para un bloque de contenido dinámico.
 * Esto nos permitirá almacenar no solo los Términos, sino también "Política de Privacidad", etc.
 */
const contentSchema = new Schema({
  
  // 'name' será el identificador único, por ejemplo: "terms", "privacy", "about-us"
  name: {
    type: String, // Tipo de dato
    required: true, // Es obligatorio
    unique: true, // No puede haber dos documentos con el mismo 'name'
    index: true // Mejora la velocidad de búsqueda al buscar por 'name'
  },
  
  // 'htmlContent' almacenará el texto completo, incluyendo etiquetas HTML
  htmlContent: {
    type: String, // Tipo de dato
    required: true, // Es obligatorio
    default: 'Aún no se ha definido el contenido.' // Valor si se crea un doc nuevo sin contenido
  }
  
}, {
  // Opciones del esquema:
  // 'timestamps: true' añade automáticamente los campos 'createdAt' y 'updatedAt'
  // Esto es útil para saber cuándo se modificó el contenido por última vez.
  timestamps: true 
});

// Creamos el modelo 'Content' basado en el 'contentSchema'.
// Mongoose creará una colección en MongoDB llamada 'contents' (pluralizado).
const Content = model('Content', contentSchema);

// Exportamos el modelo para poder usarlo en otras partes de la aplicación (como en las rutas).
export default Content;