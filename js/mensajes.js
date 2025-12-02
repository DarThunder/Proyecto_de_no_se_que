/**
 * @file js/mensajes.js
 * @description Gestiona el sistema de mensajería interna y notificaciones de reabastecimiento.
 * Permite visualizar solicitudes de stock bajo, marcar mensajes como leídos y procesar
 * las órdenes (Aprobar/Rechazar) interactuando con el backend.
 * Incluye un sistema de actualización en tiempo real (polling).
 */

/**
 * Inicializa el sistema de mensajes cuando el DOM está completamente cargado.
 * Carga los mensajes iniciales, configura listeners y arranca el polling de actualizaciones.
 * @listens document#DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", function () {
  initializeMessagesSystem();
});

/**
 * Función principal de configuración.
 * Llama a la carga inicial de datos, asigna eventos a botones globales (refrescar, marcar leídos)
 * e inicia el ciclo de actualizaciones automáticas.
 */
function initializeMessagesSystem() {
  // Cargar mensajes desde el backend
  loadMessagesFromBackend();

  // Configurar event listeners
  const refreshBtn = document.getElementById("refreshMessages");
  if (refreshBtn) refreshBtn.addEventListener("click", loadMessagesFromBackend);

  const markAllBtn = document.getElementById("markAllRead");
  if (markAllBtn) markAllBtn.addEventListener("click", markAllAsRead);

  // Configurar actualizaciones en tiempo real
  startMessagesRealTimeUpdates();
}

/**
 * Obtiene la lista de mensajes/solicitudes desde el backend.
 * Actualiza la interfaz de usuario con los datos recibidos o muestra un error en caso de fallo.
 * @async
 */
async function loadMessagesFromBackend() {
  try {
    console.log("Cargando mensajes desde el backend...");
    const response = await fetch("http://localhost:8080/messages/reorder", {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const messages = await response.json();
      console.log("Mensajes cargados:", messages);
      updateMessagesUI(messages);
    } else {
      console.error("Error al cargar mensajes:", response.status);
      showMessagesError("Error al cargar los mensajes");
    }
  } catch (error) {
    console.error("Error cargando mensajes:", error);
    showMessagesError("Error de conexión con el servidor");
  }
}

/**
 * Renderiza la lista de mensajes en la barra lateral y actualiza los contadores (No leídos, Pendientes).
 * Ordena los mensajes para mostrar primero los no leídos y luego los más recientes.
 * @param {Array<Object>} messages - Lista de objetos mensaje recibidos de la API.
 */
function updateMessagesUI(messages) {
  const messagesList = document.getElementById("messagesList");
  const totalMessages = document.getElementById("totalMessages");
  const unreadMessages = document.getElementById("unreadMessages");
  const pendingOrders = document.getElementById("pendingOrders");

  if (!messagesList) return;

  // Calcular estadísticas
  const unreadCount = messages.filter((msg) => !msg.read).length;
  const pendingCount = messages.filter(
    (msg) => msg.status === "pending"
  ).length;

  if (totalMessages) totalMessages.textContent = messages.length;
  if (unreadMessages) unreadMessages.textContent = unreadCount;
  if (pendingOrders) pendingOrders.textContent = pendingCount;

  // Actualizar lista de mensajes
  if (messages.length === 0) {
    messagesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h4>No hay mensajes</h4>
                <p>Las solicitudes de reabastecimiento aparecerán aquí</p>
            </div>
        `;
    return;
  }

  // Ordenar mensajes: no leídos primero, luego por fecha descendente
  const sortedMessages = messages.sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // Generar HTML de la lista
  messagesList.innerHTML = sortedMessages
    .map(
      (message) => `
        <div class="message-item ${
          message.read ? "" : "unread"
        }" data-message-id="${message._id}">
            <div class="message-header">
                <h4 class="message-title">Solicitud de Reabastecimiento</h4>
                <span class="message-date">${formatDate(
                  message.createdAt
                )}</span>
            </div>
            <p class="message-preview">${message.productName} - ${
        message.quantity
      } unidades</p>
            <div class="message-meta">
                <span class="message-urgency urgency-${
                  message.urgency
                }">${getUrgencyLabel(message.urgency)}</span>
                <span class="message-status status-${
                  message.status
                }">${getStatusLabel(message.status)}</span>
            </div>
        </div>
    `
    )
    .join("");

  // Agregar event listeners a cada ítem de la lista para ver detalles
  document.querySelectorAll(".message-item").forEach((item) => {
    item.addEventListener("click", function () {
      const messageId = this.getAttribute("data-message-id");
      const message = messages.find((msg) => msg._id === messageId);
      if (message) {
        showMessageDetail(message);
        // Marcar como leído automáticamente al abrir
        if (!message.read) {
          markMessageAsRead(messageId);
        }
      }
    });
  });
}

/**
 * Muestra el contenido completo de un mensaje seleccionado en el panel principal.
 * Incluye botones de acción (Aprobar/Rechazar) si el estado es 'pending'.
 * @param {Object} message - Objeto con los datos del mensaje.
 */
function showMessageDetail(message) {
  const messageDetail = document.getElementById("messageDetail");

  if (!messageDetail) return;

  messageDetail.innerHTML = `
        <div class="detail-header">
            <h3 class="detail-title">Solicitud de Reabastecimiento</h3>
            <div class="detail-meta">
                <span>Recibido: ${formatDate(message.createdAt)}</span>
                <span class="message-urgency urgency-${
                  message.urgency
                }">${getUrgencyLabel(message.urgency)}</span>
                <span class="message-status status-${
                  message.status
                }">${getStatusLabel(message.status)}</span>
            </div>
        </div>
        
        <div class="detail-content">
            <div class="detail-section">
                <h4>Producto Solicitado</h4>
                <p>${message.productName}</p>
            </div>
            
            <div class="product-info-grid">
                <div class="info-item">
                    <div class="info-label">Proveedor</div>
                    <div class="info-value">${message.supplierName}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Cantidad</div>
                    <div class="info-value">${message.quantity} unidades</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Solicitado por</div>
                    <div class="info-value">${message.requestedBy}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">ID de Variante</div>
                    <div class="info-value">${message.variantId}</div>
                </div>
            </div>
            
            <div class="detail-section">
                <h4>Notas del Solicitante</h4>
                <p>${message.notes || "No se agregaron notas adicionales."}</p>
            </div>
        </div>
        
        ${
          message.status === "pending"
            ? `
        <div class="detail-actions">
            <button class="btn btn-success" onclick="approveOrder('${message._id}')">
                <i class="fas fa-check"></i> Aprobar Pedido
            </button>
            <button class="btn btn-danger" onclick="rejectOrder('${message._id}')">
                <i class="fas fa-times"></i> Rechazar
            </button>
        </div>
        `
            : ""
        }
    `;
}

// --- Funciones de Utilidad ---

/**
 * Formatea una fecha ISO a un formato local legible (dd/mm/yyyy hh:mm).
 * @param {string} dateString
 * @returns {string} Fecha formateada.
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Traduce el código de urgencia a una etiqueta legible en español.
 * @param {string} urgency - 'critical', 'urgent', 'normal'.
 * @returns {string} Etiqueta traducida.
 */
function getUrgencyLabel(urgency) {
  const labels = {
    critical: "Crítico",
    urgent: "Urgente",
    normal: "Normal",
  };
  return labels[urgency] || urgency;
}

/**
 * Traduce el código de estado a una etiqueta legible en español.
 * @param {string} status - 'pending', 'approved', 'rejected'.
 * @returns {string} Etiqueta traducida.
 */
function getStatusLabel(status) {
  const labels = {
    pending: "Pendiente",
    approved: "Aprobado",
    rejected: "Rechazado",
  };
  return labels[status] || status;
}

// --- Acciones de la API ---

/**
 * Marca un mensaje individual como leído en el backend.
 * @async
 * @param {string} messageId
 */
async function markMessageAsRead(messageId) {
  try {
    const response = await fetch(
      `http://localhost:8080/messages/${messageId}/read`,
      {
        method: "PUT",
        credentials: "include",
      }
    );

    if (response.ok) {
      // Recargar mensajes para actualizar la UI (quitar marca de no leído)
      loadMessagesFromBackend();
    }
  } catch (error) {
    console.error("Error marcando mensaje como leído:", error);
  }
}

/**
 * Marca todos los mensajes como leídos.
 * @async
 */
async function markAllAsRead() {
  try {
    const response = await fetch(
      "http://localhost:8080/messages/mark-all-read",
      {
        method: "PUT",
        credentials: "include",
      }
    );

    if (response.ok) {
      loadMessagesFromBackend();
      alert("Todos los mensajes han sido marcados como leídos");
    }
  } catch (error) {
    console.error("Error marcando todos como leídos:", error);
    alert("Error al marcar los mensajes como leídos");
  }
}

/**
 * Aprueba una solicitud de pedido.
 * Función expuesta globalmente (`window`) para ser usada en el onclick del HTML inyectado.
 * @async
 * @global
 * @param {string} messageId
 */
window.approveOrder = async function (messageId) {
  if (!confirm("¿Estás seguro de que deseas aprobar este pedido?")) return;

  try {
    const response = await fetch(
      `http://localhost:8080/messages/${messageId}/approve`,
      {
        method: "PUT",
        credentials: "include",
      }
    );

    if (response.ok) {
      alert("Pedido aprobado correctamente");
      loadMessagesFromBackend();
    } else {
      alert("Error al aprobar el pedido");
    }
  } catch (error) {
    console.error("Error aprobando pedido:", error);
    alert("Error de conexión al aprobar el pedido");
  }
};

/**
 * Rechaza una solicitud de pedido solicitando un motivo al usuario.
 * Función expuesta globalmente (`window`).
 * @async
 * @global
 * @param {string} messageId
 */
window.rejectOrder = async function (messageId) {
  const reason = prompt("Ingresa el motivo del rechazo:");
  if (reason === null) return; // Usuario canceló

  try {
    const response = await fetch(
      `http://localhost:8080/messages/${messageId}/reject`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: reason }),
      }
    );

    if (response.ok) {
      alert("Pedido rechazado correctamente");
      loadMessagesFromBackend();
    } else {
      alert("Error al rechazar el pedido");
    }
  } catch (error) {
    console.error("Error rechazando pedido:", error);
    alert("Error de conexión al rechazar el pedido");
  }
};

/**
 * Inicia un intervalo para consultar nuevos mensajes periódicamente (Polling).
 * Actualiza la lista cada 15 segundos.
 */
function startMessagesRealTimeUpdates() {
  setInterval(async () => {
    await loadMessagesFromBackend();
  }, 15000);
}

/**
 * Muestra un mensaje de error visual en el panel de lista de mensajes.
 * @param {string} message - Texto del error.
 */
function showMessagesError(message) {
  const messagesList = document.getElementById("messagesList");
  if (messagesList) {
    messagesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>Error</h4>
                <p>${message}</p>
            </div>
        `;
  }
}
