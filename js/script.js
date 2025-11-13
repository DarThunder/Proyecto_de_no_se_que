const loginForm = document.querySelector(".login-form form");

loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
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

    // El login fue exitoso, ahora pedimos la info del usuario
    const meResponse = await fetch("http://localhost:8080/users/me", {
      method: "GET",
      credentials: "include",
    });

    const userInfo = await meResponse.json();

    if (!meResponse.ok) {
      alert(`Error: ${userInfo.message || userInfo.error}`);
      return;
    }

    // --- LÓGICA DE REDIRECCIÓN CORREGIDA ---
    if (userInfo.role && userInfo.role.permission_ring !== undefined) {
      const permissionRing = userInfo.role.permission_ring;

      // Nueva jerarquía de roles del mongo-init.js:
      // 0 = admin
      // 1 = gerente
      // 2 = cashier
      // 3 = user

      if (permissionRing === 0 || permissionRing === 1) {
        // Admin (0) y Gerente (1) van al panel de administración
        alert(
          "Inicio de sesión exitoso - Redirigiendo a Panel de Administración"
        );
        window.location.href = "../html/admin.html"; //

      } else if (permissionRing === 2) {
        // Cashier (2) va al POS
        alert("Inicio de sesión exitoso - Redirigiendo a POS");
        window.location.href = "../html/POS.html"; //
      
      } else {
        // User (3) y cualquier otro van al index
        window.location.href = "../index.html"; //
      }
    } else {
      alert("Error: No se pudo obtener el rol del usuario.");
    }
    // --- FIN DE LA LÓGICA ---

  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    alert("Error de conexión. Revisa la consola para más detalles.");
  }
}); 