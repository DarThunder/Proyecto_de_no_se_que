document
  .getElementById("formulario-registro")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const boton = document.querySelector(".btn-login");

    boton.disabled = true;
    boton.textContent = "Enviando...";

    try {
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
        alert(data.message || "Correo enviado. Revisa tu bandeja de entrada.");
        window.location.href = "login.html";
      } else {
        alert(data.error || "Hubo un error al enviar el correo.");
        boton.disabled = false;
        boton.textContent = "Validar Correo";
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión con el servidor.");
      boton.disabled = false;
      boton.textContent = "Validar Correo";
    }
  });
