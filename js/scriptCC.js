/**
 * @file js/scriptCC.js
 * @description Gestiona la funcionalidad de la página de "Crear Cuenta" (Registro).
 * Escucha el envío del formulario de registro, captura los datos del usuario (username, password, email)
 * y los envía al backend para crear una nueva cuenta.
 */

/**
 * Referencia al formulario de registro en el DOM.
 * @type {HTMLFormElement}
 */
const form = document.getElementById("formulario-registro");

/**
 * Agrega un listener para el evento 'submit' del formulario.
 * Previene la recarga de la página, recolecta los datos y realiza la petición de registro.
 * @event submit
 * @param {Event} event - El evento de envío del formulario.
 */
form.addEventListener("submit", function (event) {
  event.preventDefault(); // Evita que se recargue la página

  // Obtenemos los valores de los campos del formulario
  /** @type {string} Nombre de usuario ingresado. */
  const username = document.getElementById("username").value;
  /** @type {string} Contraseña ingresada. */
  const password = document.getElementById("password").value;
  /** @type {string} Correo electrónico ingresado. */
  const email = document.getElementById("email").value;

  /**
   * Envía los datos de registro al backend mediante una petición POST.
   * Endpoint: /auth/register
   */
  fetch("http://localhost:8080/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, email }),
  })
    .then((response) => {
      if (!response.ok) {
        console.log(response);
        throw new Error("Error en la petición: " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Respuesta del servidor:", data);
      // Notificar éxito al usuario
      alert("Usuario " + username + " creado exitosamente");

      // Opcional: Redirigir al login después del registro exitoso
      // window.location.href = "login.html";
    })
    .catch((error) => {
      console.error("Hubo un problema con la solicitud:", error);
      alert("Error al crear el usuario. Por favor intenta de nuevo.");
    });
});

// Funcionalidad específica para Crear Cuenta
/* // Funcionalidad específica para Crear Cuenta
document.addEventListener('DOMContentLoaded', function() {
    // Toggle para contraseña principal
    document.getElementById('toggle-password').addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('bx-show');
        this.classList.toggle('bx-hide');
    });

    // Toggle para confirmar contraseña
    document.getElementById('toggle-confirm-password').addEventListener('click', function() {
        const confirmPasswordInput = document.getElementById('confirm-password');
        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordInput.setAttribute('type', type);
        this.classList.toggle('bx-show');
        this.classList.toggle('bx-hide');
    });

    // Validación de contraseñas coincidentes
    document.querySelector('form').addEventListener('submit', function(e) {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (password !== confirmPassword) {
            e.preventDefault();
            alert('Las contraseñas no coinciden');
        }
    });
}); */
