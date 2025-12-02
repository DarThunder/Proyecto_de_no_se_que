/**
 * @file js/gestion_envios.js
 * @description Gestiona la interfaz de administración para el seguimiento y actualización
 * del estado de envíos de pedidos realizados vía web.
 * Permite visualizar una lista de pedidos, ver detalles básicos y actualizar su estado de envío (Procesando, Enviado, Entregado).
 */

/**
 * Inicializa la carga de pedidos y la configuración del modal al cargar el DOM.
 * Nota: La seguridad de sesión ya es verificada por el script global 'admin.js'.
 * @listens document#DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", () => {
  loadWebOrders();
  setupModal();
});

/**
 * Obtiene la lista completa de pedidos web desde el backend y renderiza la tabla de gestión.
 * Formatea fechas, direcciones y precios, y asigna insignias visuales (badges) según el estado del envío.
 * @async
 */
async function loadWebOrders() {
  const tableBody = document.getElementById("orders-table-body");
  tableBody.innerHTML =
    '<tr><td colspan="8" style="text-align:center;">Cargando pedidos...</td></tr>';

  try {
    /**
     * Petición GET para obtener todos los pedidos web (no POS).
     * @type {Response}
     */
    const response = await fetch(
      "http://localhost:8080/orders/web-orders/all",
      {
        credentials: "include",
      }
    );

    if (!response.ok) throw new Error("Error al cargar pedidos");

    const orders = await response.json();

    if (orders.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="8" style="text-align:center;">No hay pedidos online registrados.</td></tr>';
      return;
    }

    tableBody.innerHTML = "";

    orders.forEach((order) => {
      // Formateo de datos para la vista
      const date = new Date(order.createdAt).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const user = order.user ? order.user.username : "Usuario eliminado";
      const addressObj = order.shipping_address || {};
      const address = `${addressObj.address}, ${addressObj.city}, ${addressObj.state}`;
      const total = `$${order.total.toFixed(2)}`;
      const tracking = order.tracking_number || "N/A";

      // Lógica de estilos para las insignias de estado (CSS classes)
      let statusClass = "bg-processing";
      let statusText = "Procesando";

      if (order.shipping_status === "Shipped") {
        statusClass = "bg-shipped";
        statusText = "Enviado";
      } else if (order.shipping_status === "Delivered") {
        statusClass = "bg-delivered";
        statusText = "Entregado";
      } else if (order.shipping_status === "Cancelled") {
        statusClass = "bg-cancelled";
        statusText = "Cancelado";
      }

      // Construcción de la fila de la tabla
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${date}</td>
                <td><small>${order._id.slice(-6).toUpperCase()}</small></td>
                <td>${user}</td>
                <td title="${address}" style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${address}</td>
                <td>${total}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>${tracking}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openShippingModal('${
                      order._id
                    }', '${order.shipping_status}', '${
        order.tracking_number || ""
      }')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </td>
            `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error(error);
    tableBody.innerHTML =
      '<tr><td colspan="8" style="text-align:center; color: var(--danger);">Error de conexión con el servidor.</td></tr>';
  }
}

/**
 * Configura los event listeners y el comportamiento del modal de edición de envíos.
 * Maneja la lógica de mostrar/ocultar el campo de número de rastreo dinámicamente
 * según el estado seleccionado (Solo visible si es 'Shipped').
 */
function setupModal() {
  const modal = document.getElementById("shipping-modal");
  const closeBtn = modal.querySelector(".close");
  const cancelBtn = document.getElementById("cancel-modal-btn");
  const form = document.getElementById("shipping-form");
  const statusSelect = document.getElementById("shipping-status");
  const trackingGroup = document.getElementById("tracking-group");

  // Listener para mostrar input de tracking solo si se selecciona "Enviado"
  statusSelect.addEventListener("change", (e) => {
    if (e.target.value === "Shipped") {
      trackingGroup.style.display = "block";
      document.getElementById("tracking-number").required = true;
    } else {
      trackingGroup.style.display = "none";
      document.getElementById("tracking-number").required = false;
    }
  });

  const closeModal = () => {
    modal.style.display = "none";
  };

  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);
  window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Manejar envío del formulario de actualización
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const orderId = document.getElementById("order-id").value;
    const status = document.getElementById("shipping-status").value;
    const tracking = document.getElementById("tracking-number").value;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Guardando...";

    try {
      /**
       * Petición PUT para actualizar el estado de envío y número de seguimiento en el backend.
       */
      const response = await fetch(
        `http://localhost:8080/orders/${orderId}/shipping-status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            status: status,
            tracking_number: tracking,
          }),
        }
      );

      if (!response.ok) throw new Error("Error actualizando estado");

      alert(
        `Estado actualizado a: ${status}. ${
          status === "Shipped"
            ? '\n⚠️ El sistema marcará el pedido como "Entregado" automáticamente en 1 minuto.'
            : ""
        }`
      );

      closeModal();
      loadWebOrders(); // Recargar tabla para reflejar cambios
    } catch (error) {
      console.error(error);
      alert("Error al guardar los cambios.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Guardar Cambios";
    }
  });
}

/**
 * Abre el modal de edición de envío pre-cargado con los datos del pedido seleccionado.
 * Se expone globalmente (`window.openShippingModal`) para ser llamada desde el botón "Editar" en la tabla HTML.
 * * @global
 * @param {string} id - ID del pedido a editar.
 * @param {string} currentStatus - Estado actual del envío (Processing, Shipped, etc.).
 * @param {string} currentTracking - Número de seguimiento actual (cadena vacía si no existe).
 */
window.openShippingModal = function (id, currentStatus, currentTracking) {
  document.getElementById("order-id").value = id;
  const statusSelect = document.getElementById("shipping-status");
  statusSelect.value = currentStatus;
  document.getElementById("tracking-number").value = currentTracking;

  // Disparar evento change manualmente para actualizar la visibilidad correcta del campo tracking
  statusSelect.dispatchEvent(new Event("change"));

  document.getElementById("shipping-modal").style.display = "block";
};
