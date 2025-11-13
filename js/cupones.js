// js/cupones.js

// Estado global para saber si estamos editando o creando
let isEditing = false;
let editingCouponId = null;

// Referencias al DOM
const modal = document.getElementById('coupon-modal');
const modalTitle = document.getElementById('modal-title');
const couponForm = document.getElementById('coupon-form');
const tableBody = document.getElementById('coupons-table-body');
const addBtn = document.getElementById('add-coupon-btn');
const cancelBtn = document.getElementById('cancel-btn');

/*
 * ===============================================
 * INICIO: Autenticación y Carga Inicial
 * (Copiado y adaptado de admin.js)
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
            // Si el usuario es válido, cargamos los cupones
            await loadCoupons();
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
    cancelBtn.addEventListener('click', closeCouponModal);
    couponForm.addEventListener('submit', handleFormSubmit);
});
/*
 * ===============================================
 * FIN: Autenticación y Carga Inicial
 * ===============================================
 */


/**
 * Carga todos los cupones desde la API y los muestra en la tabla
 */
async function loadCoupons() {
    try {
        const response = await fetch("http://localhost:8080/coupons", {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Error al cargar los cupones.');
        }
        const coupons = await response.json();
        
        tableBody.innerHTML = ''; // Limpiamos la tabla
        
        if (coupons.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7">No se encontraron cupones.</td></tr>';
            return;
        }

        coupons.forEach(coupon => {
            const tr = document.createElement('tr');
            
            // Formatear fecha (si existe)
            const expDate = coupon.expiration_date 
                ? new Date(coupon.expiration_date).toLocaleDateString()
                : 'Nunca';
            
            // Usos
            const uses = `${coupon.actual_uses} / ${coupon.maximum_uses || '∞'}`;
            
            // Estado
            const status = coupon.active 
                ? '<span class="status-active">Activo</span>' 
                : '<span class="status-inactive">Inactivo</span>';

            tr.innerHTML = `
                <td>${coupon.name}</td>
                <td>${coupon.code}</td>
                <td>${coupon.discount}%</td>
                <td>${uses}</td>
                <td>${expDate}</td>
                <td>${status}</td>
                <td class="coupon-actions">
                    <button class="btn btn-secondary" onclick="openEditModal('${coupon._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="deleteCoupon('${coupon._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

    } catch (error) {
        console.error(error.message);
        tableBody.innerHTML = `<tr><td colspan="7">${error.message}</td></tr>`;
    }
}

/**
 * Abre el modal para crear un nuevo cupón
 */
function openCreateModal() {
    isEditing = false;
    editingCouponId = null;
    
    modalTitle.textContent = 'Crear Nuevo Cupón';
    couponForm.reset(); // Limpia el formulario
    document.getElementById('coupon-active').checked = true; // Activo por defecto
    
    modal.style.display = 'flex';
}

/**
 * Abre el modal para editar un cupón existente
 */
async function openEditModal(id) {
    isEditing = true;
    editingCouponId = id;

    try {
        const response = await fetch(`http://localhost:8080/coupons/${id}`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('No se pudo cargar el cupón');
        
        const coupon = await response.json();

        // Llenamos el formulario con los datos
        modalTitle.textContent = `Editar Cupón: ${coupon.code}`;
        document.getElementById('coupon-id').value = coupon._id;
        document.getElementById('coupon-name').value = coupon.name;
        document.getElementById('coupon-discount').value = coupon.discount;
        // Formatear la fecha para el input type="date" (YYYY-MM-DD)
        document.getElementById('coupon-expiration').value = coupon.expiration_date
            ? new Date(coupon.expiration_date).toISOString().split('T')[0]
            : '';
        document.getElementById('coupon-uses').value = coupon.maximum_uses || '';
        document.getElementById('coupon-active').checked = coupon.active;

        modal.style.display = 'flex';
        
    } catch (error) {
        console.error(error.message);
        alert('Error al cargar datos del cupón.');
    }
}

/**
 * Cierra el modal
 */
function closeCouponModal() {
    modal.style.display = 'none';
    couponForm.reset();
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
        name: document.getElementById('coupon-name').value,
        discount: parseInt(document.getElementById('coupon-discount').value),
        expiration_date: document.getElementById('coupon-expiration').value || null,
        maximum_uses: parseInt(document.getElementById('coupon-uses').value) || null,
        active: document.getElementById('coupon-active').checked,
    };

    let url = "http://localhost:8080/coupons";
    let method = 'POST';

    if (isEditing) {
        url = `http://localhost:8080/coupons/${editingCouponId}`;
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
            throw new Error(errorData.message || 'Error al guardar el cupón');
        }

        // Éxito
        closeCouponModal();
        await loadCoupons(); // Recargamos la tabla

    } catch (error) {
        console.error(error.message);
        alert(`Error: ${error.message}`);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar';
    }
}

/**
 * Elimina un cupón
 */
async function deleteCoupon(id) {
    // Pedimos confirmación
    if (!confirm('¿Estás seguro de que quieres eliminar este cupón? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/coupons/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al eliminar');
        }

        // Éxito
        await loadCoupons(); // Recargamos la tabla

    } catch (error) {
        console.error(error.message);
        alert(`Error: ${error.message}`);
    }
}