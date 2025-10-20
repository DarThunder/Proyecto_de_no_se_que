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
