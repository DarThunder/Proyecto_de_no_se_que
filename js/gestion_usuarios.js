// js/gestion_usuarios.js

// --- 1. Variables Globales ---
let availableRoles = []; // Almacenará los roles de la BD
let currentEditingUserId = null;
let currentUserRing = -1; // Almacenará el 'permission_ring' del gerente

// --- 2. Referencias al DOM (se definirán en DOMContentLoaded) ---
let modal, modalTitle, userForm, tableBody, cancelBtn, userRoleSelect, userUsernameDisplay;

/*
 * ===============================================
 * INICIO: Autenticación y Carga Inicial
 * ===============================================
 */
document.addEventListener('DOMContentLoaded', async () => {
    
    // --- 3. Definir Referencias al DOM ---
    modal = document.getElementById('user-modal');
    modalTitle = document.getElementById('modal-title');
    userForm = document.getElementById('user-form');
    tableBody = document.getElementById('users-table-body');
    cancelBtn = document.getElementById('cancel-btn');
    userRoleSelect = document.getElementById('user-role-select');
    userUsernameDisplay = document.getElementById('user-username-display');
    
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
            document.getElementById('admin-username').textContent = userInfo.username || 'Admin';
            currentUserRing = userInfo.role.permission_ring; // Guardamos el ring del gerente
            
            // Si el usuario es válido, cargamos los datos necesarios
            await loadRoles(); // 1ro los roles
            await loadUsers(); // 2do los usuarios
        } else {
            throw new Error("Acceso denegado. Redirigiendo al login.");
        }

    } catch (error) {
        console.error(error.message);
        alert("Acceso denegado. Debes iniciar sesión como Gerente o Administrador.");
        window.location.href = 'login.html';
    }

    // 2. Lógica del botón de Cerrar Sesión
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
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
                window.location.href = 'login.html';
            }
        });
    }

    // 3. Listeners del Modal
    cancelBtn.addEventListener('click', closeUserModal);
    userForm.addEventListener('submit', handleFormSubmit);
});
/*
 * ===============================================
 * FIN: Autenticación y Carga Inicial
 * ===============================================
 */


/**
 * Carga la lista de roles desde la API
 */
async function loadRoles() {
    try {
        const response = await fetch("http://localhost:8080/users/roles", {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Error al cargar los roles.');
        }
        availableRoles = await response.json(); // Guardamos en la variable global
    } catch (error) {
        console.error(error.message);
        alert("Error crítico: no se pudieron cargar los roles de usuario.");
    }
}


/**
 * Carga todos los usuarios desde la API y los muestra en la tabla
 */
async function loadUsers() {
    try {
        const response = await fetch("http://localhost:8080/users", {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Error al cargar los usuarios.');
        }
        const users = await response.json();
        
        tableBody.innerHTML = ''; // Limpiamos la tabla
        
        if (users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4">No se encontraron usuarios.</td></tr>';
            return;
        }

        users.forEach(user => {
            const tr = document.createElement('tr');
            const roleName = user.role ? user.role.name : 'Sin Rol';
            const roleId = user.role ? user.role._id : 'null';
            const userRing = user.role ? user.role.permission_ring : 99;

            let actionsHtml = '';

            // El Gerente/Admin solo puede editar usuarios con ring IGUAL O INFERIOR al suyo
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
 * Abre el modal para editar el rol de un usuario
 */
function openEditModal(id, currentRoleId, username, targetUserRing) {
    currentEditingUserId = id;

    // Llenamos el formulario
    modalTitle.textContent = `Editar Rol de: ${username}`;
    userUsernameDisplay.textContent = username;
    
    // Llenamos el select con los roles disponibles
    userRoleSelect.innerHTML = '';
    availableRoles.forEach(role => {
        // Un Gerente no puede asignar un rol superior a él mismo (ej. Admin)
        if (currentUserRing <= role.permission_ring) {
            const option = document.createElement('option');
            option.value = role._id;
            option.textContent = `${role.name} (Nivel ${role.permission_ring})`;
            
            // Seleccionamos el rol actual del usuario
            if (role._id === currentRoleId) {
                option.selected = true;
            }
            userRoleSelect.appendChild(option);
        }
    });
    
    modal.style.display = 'flex';
}

/**
 * Cierra el modal
 */
function closeUserModal() {
    modal.style.display = 'none';
    userForm.reset();
}

/**
 * Maneja el envío del formulario (Editar Rol)
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';

    // Recolectamos los datos del formulario
    const data = {
        role: document.getElementById('user-role-select').value,
    };

    const url = `http://localhost:8080/users/${currentEditingUserId}`;
    const method = 'PUT';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar el rol');
        }

        // Éxito
        closeUserModal();
        await loadUsers(); // Recargamos la tabla

    } catch (error) {
        console.error(error.message);
        alert(`Error: ${error.message}`);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar Cambio';
    }
}