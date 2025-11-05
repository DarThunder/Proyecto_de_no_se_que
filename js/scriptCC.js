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

const form = document.getElementById("formulario-registro");

    // Escuchamos el evento "submit"
    form.addEventListener("submit", function(event) {
      event.preventDefault(); // Evita que se recargue la página

      // Obtenemos los valores de los campos del formulario
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const email = document.getElementById("email").value;

      // Enviamos los datos al backend usando fetch
      fetch("http://localhost:8080/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email })
      })
      .then(response => {
        if (!response.ok) {
            console.log(response);
          throw new Error("Error en la petición: " + response.status);
        }
        return response.json();
      })
      .then(data => {
        console.log("Respuesta del servidor:", data);
        // Aquí podrías guardar el token o redirigir a otra página
        alert("Usuario" + username + "creado");
      })
      .catch(error => {
        console.error("Hubo un problema con la solicitud:", error);
      });
    });