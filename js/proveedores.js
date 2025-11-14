// js/proveedores.js

// Estado global
let isEditing = false;
let editingProviderId = null;

// Referencias al DOM
const modal = document.getElementById('provider-modal');
const modalTitle = document.getElementById('modal-title');
const providerForm = document.getElementById('provider-form');
const tableBody = document.getElementById('providers-table-body');
const addBtn = document.getElementById('add-provider-btn');
const cancelBtn = document.getElementById('cancel-btn');

/*
 * ===============================================
 * INICIO: Autenticación y Carga Inicial
 * (Copiado de cupones.js)
 * ===============================================
 */
document.addEventListener('DOMContentLoaded', async () => {
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
            // Si el usuario es válido, cargamos los proveedores
            await loadProviders();
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
    addBtn.addEventListener('click', openCreateModal);
    cancelBtn.addEventListener('click', closeProviderModal);
    providerForm.addEventListener('submit', handleFormSubmit);
});
/*
 * ===============================================
 * FIN: Autenticación y Carga Inicial
 * ===============================================
 */


/**
 * Carga todos los proveedores desde la API y los muestra en la tabla
 */
async function loadProviders() {
    try {
        const response = await fetch("http://localhost:8080/providers", {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Error al cargar los proveedores.');
        }
        const providers = await response.json();
        
        tableBody.innerHTML = ''; // Limpiamos la tabla
        
        if (providers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">No se encontraron proveedores.</td></tr>';
            return;
        }

        providers.forEach(provider => {
            const tr = document.createElement('tr');
            
            // Estado
            const status = provider.active 
                ? '<span class="status-active">Activo</span>' 
                : '<span class="status-inactive">Inactivo</span>';

            tr.innerHTML = `
                <td>${provider.name}</td>
                <td>${provider.contactName}</td>
                <td>${provider.email}</td>
                <td>${provider.phone}</td>
                <td>${status}</td>
                <td class="coupon-actions">
                    <button class="btn btn-secondary" onclick="openEditModal('${provider._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="deleteProvider('${provider._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

    } catch (error) {
        console.error(error.message);
        tableBody.innerHTML = `<tr><td colspan="6">${error.message}</td></tr>`;
    }
}

/**
 * Abre el modal para crear un nuevo proveedor
 */
function openCreateModal() {
    isEditing = false;
    editingProviderId = null;
    
    modalTitle.textContent = 'Crear Nuevo Proveedor';
    providerForm.reset(); // Limpia el formulario
    document.getElementById('provider-active').checked = true; // Activo por defecto
    
    modal.style.display = 'flex';
}

/**
 * Abre el modal para editar un proveedor existente
 */
async function openEditModal(id) {
    isEditing = true;
    editingProviderId = id;

    try {
        const response = await fetch(`http://localhost:8080/providers/${id}`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('No se pudo cargar el proveedor');
        
        const provider = await response.json();

        // Llenamos el formulario con los datos
        modalTitle.textContent = `Editar Proveedor: ${provider.name}`;
        document.getElementById('provider-id').value = provider._id;
        document.getElementById('provider-name').value = provider.name;
        document.getElementById('provider-contactName').value = provider.contactName;
        document.getElementById('provider-email').value = provider.email;
        document.getElementById('provider-phone').value = provider.phone;
        document.getElementById('provider-address').value = provider.address || '';
        document.getElementById('provider-active').checked = provider.active;

        modal.style.display = 'flex';
        
    } catch (error) {
        console.error(error.message);
        alert('Error al cargar datos del proveedor.');
    }
}

/**
 * Cierra el modal
 */
function closeProviderModal() {
    modal.style.display = 'none';
    providerForm.reset();
}

/**
 * Maneja el envío del formulario (Crear o Editar)
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';

    // Recolectamos los datos del formulario
    const data = {
        name: document.getElementById('provider-name').value,
        contactName: document.getElementById('provider-contactName').value,
        email: document.getElementById('provider-email').value,
        phone: document.getElementById('provider-phone').value,
        address: document.getElementById('provider-address').value,
        active: document.getElementById('provider-active').checked,
    };

    let url = "http://localhost:8080/providers";
    let method = 'POST';

    if (isEditing) {
        url = `http://localhost:8080/providers/${editingProviderId}`;
        method = 'PUT';
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar el proveedor');
        }

        // Éxito
        closeProviderModal();
        await loadProviders(); // Recargamos la tabla

    } catch (error) {
        console.error(error.message);
        alert(`Error: ${error.message}`);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar';
    }
}

/**
 * Elimina un proveedor
 */
async function deleteProvider(id) {
    // Pedimos confirmación
    if (!confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/providers/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al eliminar');
        }

        // Éxito
        await loadProviders(); // Recargamos la tabla

    } catch (error) {
        console.error(error.message);
        alert(`Error: ${error.message}`);
    }
}