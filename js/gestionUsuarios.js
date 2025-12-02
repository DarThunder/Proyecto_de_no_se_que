/**
 * @file js/gestionUsuarios.js
 * @description Módulo de administración de usuarios.
 * Permite a los administradores y gerentes listar todos los usuarios registrados
 * y modificar su rol asignado (ej. ascender de Cliente a Cajero).
 * Incluye lógica de protección para evitar que un usuario modifique roles superiores al suyo.
 */

// --- 1. Variables Globales ---

/**
 * Almacena la lista de roles disponibles cargados desde la base de datos.
 * Se utiliza para poblar el selector en el modal de edición.
 * @type {Array<Object>}
 */
let availableRoles = [];

/**
 * ID del usuario que se está editando actualmente.
 * @type {string|null}
 */
let currentEditingUserId = null;

/**
 * Nivel de permisos (`permission_ring`) del usuario actual (el que está usando el sistema).
 * Se usa para restringir qué roles puede asignar a otros.
 * @type {number}
 */
let currentUserRing = -1;

// --- 2. Referencias al DOM (se inicializan en DOMContentLoaded) ---
let modal,
  modalTitle,
  userForm,
  tableBody,
  cancelBtn,
  userRoleSelect,
  userUsernameDisplay;

/*
 * ===============================================
 * INICIO: Autenticación y Carga Inicial
 * ===============================================
 */

/**
 * Inicializa el gestor de usuarios cuando el DOM está listo.
 * 1. Obtiene referencias a elementos del DOM.
 * 2. Verifica la sesión y permisos del usuario actual.
 * 3. Carga roles y usuarios si la autenticación es exitosa.
 * 4. Configura listeners para el modal y logout.
 * @listens document#DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", async () => {
  // --- 3. Definir Referencias al DOM ---
  modal = document.getElementById("user-modal");
  modalTitle = document.getElementById("modal-title");
  userForm = document.getElementById("user-form");
  tableBody = document.getElementById("users-table-body");
  cancelBtn = document.getElementById("cancel-btn");
  userRoleSelect = document.getElementById("user-role-select");
  userUsernameDisplay = document.getElementById("user-username-display");

  // 1. Verificar la autenticación y permisos
  try {
    const meResponse = await fetch("http://localhost:8080/users/me", {
      method: "GET",
      credentials: "include", // Envía la cookie de sesión
    });

    if (!meResponse.ok) {
      throw new Error("No autorizado. Redirigiendo al login.");
    }

    const userInfo = await meResponse.json();

    // Verificamos el rol (Admin=0, Gerente=1)
    if (userInfo.role && userInfo.role.permission_ring <= 1) {
      document.getElementById("admin-username").textContent =
        userInfo.username || "Admin";
      currentUserRing = userInfo.role.permission_ring; // Guardamos el ring del gerente

      // Carga secuencial de datos necesarios
      await loadRoles(); // 1ro los roles (para tenerlos listos en el modal)
      await loadUsers(); // 2do los usuarios (para llenar la tabla)
    } else {
      throw new Error("Acceso denegado. Redirigiendo al login.");
    }
  } catch (error) {
    console.error(error.message);
    alert(
      "Acceso denegado. Debes iniciar sesión como Gerente o Administrador."
    );
    window.location.href = "login.html";
  }

  // 2. Lógica del botón de Cerrar Sesión
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await fetch("http://localhost:8080/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (err) {
        console.error("Error al cerrar sesión", err);
      } finally {
        alert("Sesión cerrada.");
        window.location.href = "login.html";
      }
    });
  }

  // 3. Listeners del Modal
  cancelBtn.addEventListener("click", closeUserModal);
  userForm.addEventListener("submit", handleFormSubmit);
});

/*
 * ===============================================
 * FIN: Autenticación y Carga Inicial
 * ===============================================
 */

/**
 * Obtiene la lista de roles desde la API y la guarda en memoria.
 * Esta lista se usa posteriormente para llenar el `<select>` de roles.
 * @async
 */
async function loadRoles() {
  try {
    const response = await fetch("http://localhost:8080/users/roles", {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Error al cargar los roles.");
    }
    availableRoles = await response.json(); // Guardamos en la variable global
  } catch (error) {
    console.error(error.message);
    alert("Error crítico: no se pudieron cargar los roles de usuario.");
  }
}

/**
 * Obtiene la lista de usuarios y renderiza la tabla.
 * Decide dinámicamente si mostrar el botón de "Editar" basándose en la jerarquía de roles.
 * @async
 */
async function loadUsers() {
  try {
    const response = await fetch("http://localhost:8080/users", {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Error al cargar los usuarios.");
    }
    const users = await response.json();

    tableBody.innerHTML = ""; // Limpiamos la tabla

    if (users.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="4">No se encontraron usuarios.</td></tr>';
      return;
    }

    users.forEach((user) => {
      const tr = document.createElement("tr");
      const roleName = user.role ? user.role.name : "Sin Rol";
      const roleId = user.role ? user.role._id : "null";
      // Si no tiene rol, asignamos un ring alto (99) para que sea editable
      const userRing = user.role ? user.role.permission_ring : 99;

      let actionsHtml = "";

      // REGLA DE SEGURIDAD:
      // El usuario actual solo puede editar a usuarios con igual o menor rango (mayor valor numérico de ring)
      // Ejemplo: Gerente (1) puede editar Cajero (2), pero no Admin (0).
      if (currentUserRing <= userRing) {
        actionsHtml = `
                    <button class="btn btn-secondary" 
                            onclick="openEditModal('${user._id}', '${roleId}', '${user.username}', ${userRing})">
                        <i class="fas fa-edit"></i> Cambiar Rol
                    </button>
                `;
      } else {
        actionsHtml = `<span>(Rol Superior)</span>`;
      }

      tr.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${roleName.charAt(0).toUpperCase() + roleName.slice(1)}</td>
                <td class="coupon-actions">
                    ${actionsHtml}
                </td>
            `;
      tableBody.appendChild(tr);
    });
  } catch (error) {
    console.error(error.message);
    tableBody.innerHTML = `<tr><td colspan="4">${error.message}</td></tr>`;
  }
}

/**
 * Abre el modal para cambiar el rol de un usuario.
 * Filtra las opciones del selector de roles para que el usuario no pueda
 * auto-promoverse o promover a otros a un nivel superior al suyo.
 * * @global
 * @param {string} id - ID del usuario a editar.
 * @param {string} currentRoleId - ID del rol actual del usuario.
 * @param {string} username - Nombre de usuario (para mostrar en el título).
 * @param {number} targetUserRing - Nivel de permisos actual del usuario objetivo.
 */
window.openEditModal = function (id, currentRoleId, username, targetUserRing) {
  currentEditingUserId = id;

  // Llenamos datos visuales
  modalTitle.textContent = `Editar Rol de: ${username}`;
  userUsernameDisplay.textContent = username;

  // Llenamos el select dinámicamente
  userRoleSelect.innerHTML = "";
  availableRoles.forEach((role) => {
    // REGLA DE SEGURIDAD:
    // Solo mostramos roles que son iguales o inferiores al del usuario actual.
    // Un Gerente (1) no verá la opción "Admin" (0).
    if (currentUserRing <= role.permission_ring) {
      const option = document.createElement("option");
      option.value = role._id;
      option.textContent = `${role.name} (Nivel ${role.permission_ring})`;

      // Pre-seleccionar el rol actual
      if (role._id === currentRoleId) {
        option.selected = true;
      }
      userRoleSelect.appendChild(option);
    }
  });

  modal.style.display = "flex";
};

/**
 * Cierra el modal de edición.
 */
function closeUserModal() {
  modal.style.display = "none";
  userForm.reset();
}

/**
 * Envía la petición para actualizar el rol del usuario seleccionado.
 * @async
 * @param {Event} e - Evento de envío del formulario.
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  const saveBtn = document.getElementById("save-btn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Guardando...";

  // Datos a enviar
  const data = {
    role: document.getElementById("user-role-select").value,
  };

  const url = `http://localhost:8080/users/${currentEditingUserId}`;
  const method = "PUT";

  try {
    const response = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al guardar el rol");
    }

    // Éxito
    closeUserModal();
    await loadUsers(); // Recargamos la tabla para ver el cambio
  } catch (error) {
    console.error(error.message);
    alert(`Error: ${error.message}`);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Guardar Cambio";
  }
}
