document.addEventListener("DOMContentLoaded", () => {
  // --- Tu código existente para el ojo ---
  const togglePassword = document.querySelector("#toggle-password");
  const passwordField = document.querySelector("#password");

  if (togglePassword && passwordField) {
    togglePassword.addEventListener("click", function () {
      // Cambia el tipo del input
      const type =
        passwordField.getAttribute("type") === "password" ? "text" : "password";
      passwordField.setAttribute("type", type);

      // Cambia el icono
      this.classList.toggle("bx-show");
      this.classList.toggle("bx-hide");
    });
  }
  
  // --- AÑADE ESTA NUEVA LÓGICA PARA EL LOGIN ---
  const loginForm = document.querySelector(".login-form form");

  if (loginForm) {
    loginForm.addEventListener("submit", async function(e) {
      e.preventDefault(); // Evita que la página se recargue

      const email = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      
      const loginData = {
          username: email, // O el ID que uses para el campo de email/usuario
          password: password
      };

      try {
        const response = await fetch("http://localhost:8080/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginData),
        });

        const data = await response.json();

        if (response.ok) {
          // --- ¡AQUÍ ESTÁ EL PASO CLAVE! ---
          // Guarda el token en el localStorage del navegador
          localStorage.setItem('jwt_token', data.token);

          alert(data.message); // "Inicio de sesión exitoso"
          
          // Redirige al usuario a la página principal
          window.location.href = '../index.html'; // Ajusta la ruta a tu página principal

        } else {
          // Si el servidor responde con un error (ej. 401)
          alert(`Error: ${data.error}`);
        }
      } catch (error) {
        // Si hay un error de red (como el de CORS que tenías)
        console.error("Error al iniciar sesión:", error);
        alert("Error de conexión. Revisa la consola para más detalles.");
      }
    });
  }
});