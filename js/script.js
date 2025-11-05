document.addEventListener("DOMContentLoaded", () => {
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
});

document
  .getElementById("login-form-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = e.target.username.value;
    const password = e.target.password.value;

    try {
      const res = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
      }

      const data = await res.json();

      localStorage.setItem("token", data.token);
      window.location.href = "../index.html";
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
    }
  });
