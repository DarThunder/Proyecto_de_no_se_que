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

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      
      const loginData = {
          username: username,
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
          // Guardar el token
          localStorage.setItem('jwt_token', data.token);
          
          // Decodificar el token para obtener el ID del usuario
          const decodedToken = decodeJWT(data.token);
          console.log("Token decodificado:", decodedToken);
          
          if (decodedToken && decodedToken.id) {
            // Obtener información completa del usuario usando el endpoint /users/:id
            const userInfo = await getUserInfo(decodedToken.id, data.token);
            console.log("Información del usuario:", userInfo);
            
            if (userInfo && userInfo.role) {
              // Obtener el permission_ring usando búsqueda de usuarios por rol
              const permissionRing = await getPermissionRingByUserSearch(userInfo.role, data.token);
              console.log("Permission Ring encontrado:", permissionRing);
              
              // Redirigir según el permission_ring
              if (permissionRing === 0) { // Admin
                alert("✅ Inicio de sesión exitoso - Redirigiendo a Panel de Administración");
                window.location.href = '../html/admin.html';
              } else if (permissionRing === 1) { // Cajero
                alert("✅ Inicio de sesión exitoso - Redirigiendo a POS");
                window.location.href = '../html/POS.html';
              } else { // Cliente u otros roles
                window.location.href = '../index.html';
              }
            } else {
              alert("Error: No se pudo obtener la información del usuario");
              window.location.href = '../index.html';
            }
          } else {
            alert("Error: No se pudo decodificar el token");
          }
        } else {
          alert(`Error: ${data.message || data.error}`);
        }
      } catch (error) {
        console.error("Error al iniciar sesión:", error);
        alert("Error de conexión. Revisa la consola para más detalles.");
      }
    });
  }
});

// Función para decodificar JWT
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decodificando JWT:", error);
    return null;
  }
}

// Función para obtener información del usuario por ID
async function getUserInfo(userId, token) {
  try {
    const response = await fetch(`http://localhost:8080/users/${userId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.ok) {
      const userData = await response.json();
      return userData;
    } else {
      console.error("Error obteniendo información del usuario:", await response.text());
      return null;
    }
  } catch (error) {
    console.error("Error en la solicitud del usuario:", error);
    return null;
  }
}

// Función ALTERNATIVA para obtener el permission_ring usando búsqueda de usuarios
async function getPermissionRingByUserSearch(roleId, token) {
  try {
    // Buscar usuarios con ese rol para obtener información del rol
    const response = await fetch(`http://localhost:8080/users/search/${roleId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.ok) {
      const users = await response.json();
      if (users.length > 0 && users[0].role && users[0].role.permission_ring !== undefined) {
        return users[0].role.permission_ring;
      }
    }
    
    // Si falla, intentar con una búsqueda directa por el ObjectId conocido
    return getPermissionRingByKnownRoles(roleId);
    
  } catch (error) {
    console.error("Error en búsqueda de usuarios por rol:", error);
    return getPermissionRingByKnownRoles(roleId);
  }
}

// Función de respaldo basada en los ObjectIds conocidos
function getPermissionRingByKnownRoles(roleId) {
  const roleMappings = {
    '690b4fc5fe5fa7361dce5f47': 0, // Admin
    '690b4fc5fe5fa7361dce5f48': 1, // Cajero  
    '690b4fc5fe5fa7361dce5f49': 2  // Cliente
  };
  
  return roleMappings[roleId] !== undefined ? roleMappings[roleId] : 2; // Por defecto cliente
}