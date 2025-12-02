/**
 * @file js/cupones.js
 * @description Gestiona el CRUD (Crear, Leer, Actualizar, Eliminar) de cupones de descuento.
 * Permite a los administradores y gerentes listar cupones activos, crear nuevos códigos promocionales,
 * editar sus propiedades (descuento, vigencia, límite de usos) y eliminarlos.
 */

// --- Estado Global ---

/**
 * Indica si el formulario modal se encuentra en modo de edición (`true`) o creación (`false`).
 * @type {boolean}
 */
let isEditing = false;

/**
 * Almacena el ID del cupón que se está editando actualmente.
 * Es `null` si se está creando un nuevo cupón.
 * @type {string|null}
 */
let editingCouponId = null;

// --- Referencias al DOM ---

/** @type {HTMLElement} Modal contenedor del formulario. */
const modal = document.getElementById("coupon-modal");
/** @type {HTMLElement} Título del modal (cambia entre "Crear" y "Editar"). */
const modalTitle = document.getElementById("modal-title");
/** @type {HTMLFormElement} Formulario de datos del cupón. */
const couponForm = document.getElementById("coupon-form");
/** @type {HTMLElement} Cuerpo de la tabla donde se renderizan los cupones. */
const tableBody = document.getElementById("coupons-table-body");
/** @type {HTMLButtonElement} Botón para abrir el modal de creación. */
const addBtn = document.getElementById("add-coupon-btn");
/** @type {HTMLButtonElement} Botón para cancelar y cerrar el modal. */
const cancelBtn = document.getElementById("cancel-btn");

/*
 * ===============================================
 * INICIO: Autenticación y Carga Inicial
 * ===============================================
 */

/**
 * Inicializa la gestión de cupones al cargar el DOM.
 * 1. Verifica la autenticación y permisos del usuario (Rol <= 1).
 * 2. Carga la lista inicial de cupones.
 * 3. Configura los listeners para botones y formularios.
 * @listens document#DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Verificar la autenticación y permisos
  try {
    /** @type {Response} Respuesta del endpoint de sesión. */
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
      const adminUserDisplay = document.getElementById("admin-username");
      if (adminUserDisplay) {
        adminUserDisplay.textContent = userInfo.username || "Admin";
      }
      // Si el usuario es válido, cargamos los cupones
      await loadCoupons();
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
  if (addBtn) addBtn.addEventListener("click", openCreateModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeCouponModal);
  if (couponForm) couponForm.addEventListener("submit", handleFormSubmit);
});

/*
 * ===============================================
 * FIN: Autenticación y Carga Inicial
 * ===============================================
 */

/**
 * Obtiene todos los cupones desde la API y renderiza la tabla.
 * @async
 */
async function loadCoupons() {
  try {
    const response = await fetch("http://localhost:8080/coupons", {
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Error al cargar los cupones.");
    }
    const coupons = await response.json();

    tableBody.innerHTML = ""; // Limpiamos la tabla

    if (coupons.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="7">No se encontraron cupones.</td></tr>';
      return;
    }

    coupons.forEach((coupon) => {
      const tr = document.createElement("tr");

      // Formatear fecha (si existe)
      const expDate = coupon.expiration_date
        ? new Date(coupon.expiration_date).toLocaleDateString()
        : "Nunca";

      // Usos (Actuales / Máximos)
      const uses = `${coupon.actual_uses} / ${coupon.maximum_uses || "∞"}`;

      // Estado visual
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
 * Prepara la interfaz para la creación de un nuevo cupón.
 * Resetea el formulario, establece el modo a 'creación' y muestra el modal.
 */
function openCreateModal() {
  isEditing = false;
  editingCouponId = null;

  modalTitle.textContent = "Crear Nuevo Cupón";
  couponForm.reset(); // Limpia el formulario
  document.getElementById("coupon-active").checked = true; // Activo por defecto

  modal.style.display = "flex";
}

/**
 * Prepara la interfaz para la edición de un cupón existente.
 * Obtiene los detalles del cupón desde la API, rellena el formulario y muestra el modal.
 * @async
 * @param {string} id - El ID del cupón a editar.
 */
async function openEditModal(id) {
  isEditing = true;
  editingCouponId = id;

  try {
    const response = await fetch(`http://localhost:8080/coupons/${id}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("No se pudo cargar el cupón");

    const coupon = await response.json();

    // Llenamos el formulario con los datos
    modalTitle.textContent = `Editar Cupón: ${coupon.code}`;
    document.getElementById("coupon-id").value = coupon._id;
    document.getElementById("coupon-name").value = coupon.name;
    document.getElementById("coupon-discount").value = coupon.discount;

    // Formatear la fecha para el input type="date" (YYYY-MM-DD)
    document.getElementById("coupon-expiration").value = coupon.expiration_date
      ? new Date(coupon.expiration_date).toISOString().split("T")[0]
      : "";

    document.getElementById("coupon-uses").value = coupon.maximum_uses || "";
    document.getElementById("coupon-active").checked = coupon.active;

    modal.style.display = "flex";
  } catch (error) {
    console.error(error.message);
    alert("Error al cargar datos del cupón.");
  }
}

/**
 * Cierra el modal de cupones y resetea el formulario.
 */
function closeCouponModal() {
  modal.style.display = "none";
  couponForm.reset();
}

/**
 * Maneja el envío del formulario (Crear o Editar).
 * Determina si es POST (crear) o PUT (editar) basándose en `isEditing`.
 * @async
 * @param {Event} e - Evento de envío del formulario.
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  const saveBtn = document.getElementById("save-btn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Guardando...";

  // Recolectamos los datos del formulario
  const data = {
    name: document.getElementById("coupon-name").value,
    discount: parseInt(document.getElementById("coupon-discount").value),
    expiration_date: document.getElementById("coupon-expiration").value || null,
    maximum_uses:
      parseInt(document.getElementById("coupon-uses").value) || null,
    active: document.getElementById("coupon-active").checked,
  };

  let url = "http://localhost:8080/coupons";
  let method = "POST";

  if (isEditing) {
    url = `http://localhost:8080/coupons/${editingCouponId}`;
    method = "PUT";
  }

  try {
    const response = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al guardar el cupón");
    }

    // Éxito
    closeCouponModal();
    await loadCoupons(); // Recargamos la tabla
  } catch (error) {
    console.error(error.message);
    alert(`Error: ${error.message}`);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Guardar";
  }
}

/**
 * Elimina un cupón de forma permanente.
 * @async
 * @param {string} id - ID del cupón a eliminar.
 */
async function deleteCoupon(id) {
  // Pedimos confirmación
  if (
    !confirm(
      "¿Estás seguro de que quieres eliminar este cupón? Esta acción no se puede deshacer."
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`http://localhost:8080/coupons/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al eliminar");
    }

    // Éxito
    await loadCoupons(); // Recargamos la tabla
  } catch (error) {
    console.error(error.message);
    alert(`Error: ${error.message}`);
  }
}

// Exponer funciones globales para los botones onclick del HTML dinámico
window.openEditModal = openEditModal;
window.deleteCoupon = deleteCoupon;
