/**
 * @file js/orders.js
 * @description Gestiona la visualización del historial de pedidos del usuario.
 * Carga las órdenes desde el backend, maneja la autenticación requerida y
 * renderiza tarjetas detalladas con información de productos, totales y estado de envío.
 */

/**
 * Inicializa la carga de pedidos cuando el DOM está completamente cargado.
 * @listens document#DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", () => {
  loadUserOrders();
});

/**
 * Obtiene la lista de pedidos del usuario actual desde la API.
 * Gestiona los estados de la interfaz: cargando, sin sesión, error, lista vacía y éxito.
 * @async
 */
async function loadUserOrders() {
  const container = document.getElementById("orders-list");
  const loadingMsg = document.getElementById("loading-message");
  const emptyMsg = document.getElementById("empty-orders-message");

  try {
    /**
     * Petición GET al endpoint de "mis pedidos".
     * Es crucial incluir `credentials: "include"` para enviar la cookie de sesión.
     * @type {Response}
     */
    const response = await fetch("http://localhost:8080/orders/my-orders", {
      method: "GET",
      credentials: "include",
    });

    // Manejo de usuario no autenticado (401 Unauthorized)
    if (response.status === 401) {
      loadingMsg.style.display = "none";
      emptyMsg.innerHTML = `
        <div class="empty-icon"><i class="fas fa-lock"></i></div>
        <h2>Debes iniciar sesión</h2>
        <p>Para ver tu historial de compras, por favor inicia sesión.</p>
        <a href="login.html" class="cta-button">Iniciar Sesión</a>`;
      emptyMsg.style.display = "block";
      return;
    }

    if (!response.ok) {
      throw new Error("Error del servidor al cargar pedidos.");
    }

    /** @type {Array<Object>} Lista de pedidos obtenidos. */
    const orders = await response.json();

    // Ocultar indicador de carga
    loadingMsg.style.display = "none";

    // Manejo de lista vacía
    if (orders.length === 0) {
      emptyMsg.style.display = "block";
      return;
    }

    // Renderizado de tarjetas de pedido
    orders.forEach((order, index) => {
      const cardHTML = createOrderCardHTML(order);

      // Creamos un elemento temporal para convertir el string HTML a nodo DOM
      const cardElement = document.createElement("div");
      cardElement.innerHTML = cardHTML;

      // Insertamos solo el primer hijo elemento (evitando nodos de texto vacíos)
      if (cardElement.firstElementChild) {
        // Añadimos un retraso escalonado para la animación de entrada
        cardElement.firstElementChild.style.animationDelay = `${index * 0.1}s`;
        container.appendChild(cardElement.firstElementChild);
      }
    });
  } catch (error) {
    console.error("Error al cargar pedidos:", error);
    loadingMsg.style.display = "none";
    emptyMsg.innerHTML = `
        <div class="empty-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <h2>Error al cargar</h2>
        <p>No se pudo conectar con el servidor. Intenta de nuevo más tarde.</p>`;
    emptyMsg.style.display = "block";
  }
}

/**
 * Genera el string HTML para una tarjeta de pedido completa.
 * Incluye cabecera con resumen (fecha, total, tracking) y cuerpo con lista de productos.
 * * @param {Object} order - Objeto con los datos del pedido.
 * @param {string} order.createdAt - Fecha de creación.
 * @param {number} order.total - Monto total.
 * @param {string} order.tracking_number - Número de guía.
 * @param {string} order.shipping_status - Estado del envío (Processing, Shipped, etc.).
 * @param {Array<Object>} order.items - Lista de productos en el pedido.
 * @returns {string} HTML de la tarjeta de pedido.
 */
function createOrderCardHTML(order) {
  // Formatear la fecha a formato local (ej: 12 de enero de 2024)
  const orderDate = new Date(order.createdAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Generar HTML para la lista de productos dentro del pedido
  const itemsHTML = order.items
    .map((item) => {
      // Protección contra datos corruptos (si el producto fue eliminado de la BD)
      if (!item.variant || !item.variant.product) {
        return '<div class="order-item"><li>Producto ya no disponible</li></div>';
      }

      const product = item.variant.product;
      const itemTotal = item.unit_price * item.quantity;

      // Ajuste de ruta de imagen (subir desde /html/ a raíz)
      const imageUrl = product.image_url
        ? `../${product.image_url}`
        : "../sources/img/logo_negro.png";

      return `
      <div class="order-item">
          <div class="order-item-img" style="background-image: url('${imageUrl}')"></div>
          <div class="order-item-details">
              <h5>${product.name}</h5>
              <p>Talla: ${item.variant.size} | Cantidad: ${item.quantity}</p>
          </div>
          <div class="order-item-price">
              $${itemTotal.toFixed(2)}
              <span>($${item.unit_price.toFixed(2)} c/u)</span>
          </div>
      </div>
    `;
    })
    .join("");

  // Determinar clase CSS para el estado (ej. 'status-shipped', 'status-processing')
  const statusClass = order.shipping_status
    ? order.shipping_status.toLowerCase()
    : "processing";

  return ` 
    <div class="order-card">
        <div class="order-card-header">
            <div class="order-info">
                <strong>Fecha del Pedido:</strong>
                ${orderDate}
            </div>
            <div class="order-info">
                <strong>Total del Pedido:</strong>
                $${order.total.toFixed(2)} MXN
            </div>
            <div class="order-info">
                <strong>No. Seguimiento:</strong>
                <a href="seguimiento.html?tracking=${
                  order.tracking_number
                }" title="Rastrear este pedido">
                    <span>${order.tracking_number}</span>
                </a>
            </div>
            <div class="order-status ${statusClass}">
                ${order.shipping_status}
            </div>
        </div>
        <div class="order-card-body">
            <h4>Productos en este pedido (${order.items.length})</h4>
            <div class="order-item-list">
                ${itemsHTML}
            </div>
        </div>
    </div>
  `;
}
