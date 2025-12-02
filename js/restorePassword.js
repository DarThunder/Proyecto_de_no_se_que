/**
 * @file js/restorePassword.js
 * @description Gestiona el restablecimiento de contraseña en el frontend.
 * Verifica la presencia de un token en la URL, valida que las contraseñas coincidan
 * y envía la nueva credencial al backend.
 */

/**
 * Inicializa la lógica cuando el DOM ha cargado completamente.
 * Extrae el token de la URL y configura el listener para el formulario.
 * @listens document#DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", () => {
  /**
   * Parámetros de la URL actual.
   * @type {URLSearchParams}
   */
  const urlParams = new URLSearchParams(window.location.search);

  /**
   * Token de seguridad extraído de la URL. Necesario para autorizar el cambio de contraseña.
   * @type {string|null}
   */
  const token = urlParams.get("token");

  // Validación inicial del token
  if (!token) {
    alert(
      "Token no válido o no encontrado. Por favor solicita un nuevo enlace."
    );
    window.location.href = "contraseñaOlvidada.html";
    return;
  }

  /**
   * Referencia al formulario de restablecimiento.
   * @type {HTMLFormElement}
   */
  const form = document.getElementById("form-reset-password");

  /**
   * Maneja el envío del formulario de cambio de contraseña.
   * @event submit
   * @param {Event} e - Evento de envío del formulario.
   */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    /** @type {string} newPassword - La nueva contraseña ingresada por el usuario. */
    const newPassword = document.getElementById("newPassword").value;

    /** @type {string} confirmPassword - Confirmación de la contraseña. */
    const confirmPassword = document.getElementById("confirmPassword").value;

    // --- Validaciones locales ---
    if (newPassword.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    try {
      /**
       * Petición POST al backend para actualizar la contraseña.
       * Incluye el token en la ruta y la nueva contraseña en el cuerpo.
       */
      const response = await fetch(
        `http://localhost:8080/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newPassword }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(
          "¡Contraseña restablecida con éxito! Ahora puedes iniciar sesión."
        );
        window.location.href = "login.html";
      } else {
        alert(
          data.error ||
            "Error al restablecer la contraseña. El enlace puede haber expirado."
        );
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión con el servidor.");
    }
  });
});
