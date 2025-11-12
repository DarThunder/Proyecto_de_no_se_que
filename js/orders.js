document.addEventListener("DOMContentLoaded", () => {
  loadUserOrders();
});

async function loadUserOrders() {
  const container = document.getElementById("orders-list");
  const loadingMsg = document.getElementById("loading-message");
  const emptyMsg = document.getElementById("empty-orders-message");

  try {
    const response = await fetch("http://localhost:8080/orders/my-orders", {
      method: "GET",
      credentials: "include", // Esencial para enviar el token/cookie
    });

    if (response.status === 401) {
      // No está logueado
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

    const orders = await response.json();

    // Oculta el mensaje de "cargando"
    loadingMsg.style.display = "none";

    if (orders.length === 0) {
      // No tiene pedidos
      emptyMsg.style.display = "block";
      return;
    }

    // Si hay pedidos, los renderiza
    orders.forEach((order, index) => {
      const cardHTML = createOrderCardHTML(order);
      const cardElement = document.createElement('div');
      cardElement.innerHTML = cardHTML;

      // --- ===== CORRECCIÓN AQUÍ ===== ---
      // Cambiamos .firstChild por .firstElementChild para evitar nodos de texto
      if (cardElement.firstElementChild) {
        cardElement.firstElementChild.style.animationDelay = `${index * 0.1}s`;
        container.appendChild(cardElement.firstElementChild);
      }
      // --- =========================== ---
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
 * Crea el HTML para una sola tarjeta de pedido
 * @param {object} order - El objeto del pedido
 * @returns {string} - El string HTML
 */
function createOrderCardHTML(order) {
  // Formatear la fecha
  const orderDate = new Date(order.createdAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Crear la lista de items
  const itemsHTML = order.items.map(item => {
    // Manejo de items que podrían no estar populados (aunque deberían)
    if (!item.variant || !item.variant.product) {
        return '<div class="order-item"><li>Producto ya no disponible</li></div>';
    }
    
    const product = item.variant.product;
    const itemTotal = item.unit_price * item.quantity;
    
    // Ruta de imagen corregida (desde /html subimos a /)
    const imageUrl = product.image_url ? `../${product.image_url}` : '../sources/img/logo_negro.png';

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
  }).join('');

  // Clase de estado CSS
  const statusClass = order.shipping_status ? order.shipping_status.toLowerCase() : 'processing';

  // El \n inicial causaba el error de firstChild, pero lo dejamos por legibilidad
  // y lo corregimos en la función de carga.
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
                <a href="seguimiento.html?tracking=${order.tracking_number}" title="Rastrear este pedido">
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
