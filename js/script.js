/**
 * @file script.js
 * @description Maneja la lógica de inicio de sesión (Login).
 * Conecta con el backend, valida credenciales y redirige según el rol del usuario.
 */

const loginForm = document.querySelector(".login-form form");

/**
 * Listener para el envío del formulario de login.
 *
 * @event submit
 * @param {Event} e - Evento de envío del formulario.
 */
loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    // 1. Petición de Login (obtiene cookie httpOnly)
    const loginResponse = await fetch("http://localhost:8080/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });

    const loginData = await loginResponse.json();
    console.log(loginData);

    if (!loginResponse.ok) {
      alert(`Error: ${loginData.message || loginData.error}`);
      return;
    }

    // 2. Petición de "Me" (obtiene datos del usuario y rol)
    const meResponse = await fetch("http://localhost:8080/users/me", {
      method: "GET",
      credentials: "include",
    });

    const userInfo = await meResponse.json();

    if (!meResponse.ok) {
      alert(`Error: ${userInfo.message || userInfo.error}`);
      return;
    }

    // 3. Lógica de Redirección según Permission Ring
    if (userInfo.role && userInfo.role.permission_ring !== undefined) {
      const permissionRing = userInfo.role.permission_ring;

      // 0 = admin, 1 = gerente -> Panel Admin
      if (permissionRing === 0 || permissionRing === 1) {
        alert(
          "Inicio de sesión exitoso - Redirigiendo a Panel de Administración"
        );
        window.location.href = "../html/admin.html";
      }
      // 2 = cashier -> Punto de Venta (POS)
      else if (permissionRing === 2) {
        alert("Inicio de sesión exitoso - Redirigiendo a POS");
        window.location.href = "../html/POS.html";
      }
      // 3 = user (o cualquier otro) -> Home
      else {
        window.location.href = "../index.html";
      }
    } else {
      alert("Error: No se pudo obtener el rol del usuario.");
    }
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    alert("Error de conexión. Revisa la consola para más detalles.");
  }
});
