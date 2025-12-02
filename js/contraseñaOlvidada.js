/**
 * @file js/contraseñaOlvidada.js
 * @description Maneja la lógica del lado del cliente para solicitar el restablecimiento de contraseña.
 * Captura el email del usuario y envía una petición al backend para generar un token de recuperación.
 */

/**
 * Inicializa el listener para el envío del formulario de recuperación.
 * Previene el comportamiento por defecto, deshabilita el botón para evitar doble envío,
 * y realiza la petición al endpoint de autenticación.
 * * @event submit
 * @listens document#getElementById("formulario-registro")
 * @param {Event} e - El evento de envío del formulario.
 */
document
  .getElementById("formulario-registro")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    /** @type {string} email - El correo electrónico ingresado por el usuario. */
    const email = document.getElementById("email").value;

    /** @type {HTMLButtonElement} boton - El botón de envío, seleccionado para gestionar su estado (disabled/enabled). */
    const boton = document.querySelector(".btn-login");

    // Deshabilitar botón y cambiar texto para feedback visual
    boton.disabled = true;
    boton.textContent = "Enviando...";

    try {
      /**
       * Realiza la petición POST al backend para iniciar el proceso de olvido de contraseña.
       * @type {Response}
       */
      const response = await fetch(
        "http://localhost:8080/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Éxito: Notificar al usuario y redirigir
        alert(data.message || "Correo enviado. Revisa tu bandeja de entrada.");
        window.location.href = "login.html";
      } else {
        // Error controlado del servidor (ej. email no encontrado)
        alert(data.error || "Hubo un error al enviar el correo.");
        boton.disabled = false;
        boton.textContent = "Validar Correo";
      }
    } catch (error) {
      // Error de red o inesperado
      console.error("Error:", error);
      alert("Error de conexión con el servidor.");
      boton.disabled = false;
      boton.textContent = "Validar Correo";
    }
  });
