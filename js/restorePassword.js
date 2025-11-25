document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  if (!token) {
    alert(
      "Token no válido o no encontrado. Por favor solicita un nuevo enlace."
    );
    window.location.href = "contraseñaOlvidada.html";
    return;
  }

  const form = document.getElementById("form-reset-password");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    try {
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
