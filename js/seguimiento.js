/**
 * @file js/seguimiento.js
 * @description Controlador para la página de rastreo de pedidos (Tracking).
 * Permite a los usuarios buscar un pedido mediante su número de seguimiento,
 * visualizar los detalles de los productos comprados y ver el estado actual del envío
 * en una línea de tiempo visual.
 */

/**
 * Inicializa la lógica de seguimiento cuando el DOM está listo.
 * Configura las referencias a los elementos de la interfaz y el listener del formulario.
 * @listens document#DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", () => {
  // Referencias al DOM
  const trackingForm = document.getElementById("tracking-form");
  const trackingInput = document.getElementById("tracking-input");
  const resultsContainer = document.getElementById("tracking-results");
  const resultsMessage = document.getElementById("results-message");

  // Contenedores de detalles del pedido
  const statusTimeline = document.getElementById("status-timeline");
  const orderDetails = document.getElementById("order-details");
  const itemsList = document.getElementById("order-items-list");
  const totalAmount = document.getElementById("order-total-amount");

  // Elementos visuales de la línea de tiempo (Estados)
  const statusProcessing = document.getElementById("status-processing");
  const statusShipped = document.getElementById("status-shipped");
  const statusDelivered = document.getElementById("status-delivered");

  /**
   * Maneja el envío del formulario de búsqueda.
   * Previene la recarga y dispara la función de búsqueda si hay un número ingresado.
   * @event submit
   */
  trackingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const trackingNumber = trackingInput.value.trim();
    if (trackingNumber) {
      findOrder(trackingNumber);
    }
  });

  /**
   * Busca la información del pedido en el backend mediante el número de seguimiento.
   * Gestiona los estados de carga, error (404/500) y éxito.
   * @async
   * @param {string} trackingNumber - El número de guía o seguimiento del pedido.
   */
  async function findOrder(trackingNumber) {
    // 1. Resetear interfaz y mostrar estado de carga
    resultsContainer.style.display = "block";
    statusTimeline.style.display = "none";
    orderDetails.style.display = "none";
    resultsMessage.style.display = "block";
    resultsMessage.className = "results-message loading";
    resultsMessage.textContent = "Buscando tu pedido...";

    try {
      const response = await fetch(
        `http://localhost:8080/orders/track/${trackingNumber}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "No se encontró ningún pedido con ese número de seguimiento."
          );
        }
        throw new Error("Error al conectar con el servidor.");
      }

      const order = await response.json();

      // 2. Ocultar mensaje de carga y mostrar contenedores de resultados
      resultsMessage.style.display = "none";
      statusTimeline.style.display = "flex";
      orderDetails.style.display = "block";

      // 3. Renderizar los detalles del pedido (productos y total)
      renderOrderDetails(order);

      // 4. Actualizar la línea de tiempo según el estado
      updateStatusTimeline(order.shipping_status);
    } catch (error) {
      resultsMessage.className = "results-message error";
      resultsMessage.textContent = error.message;
    }
  }

  /**
   * Genera el HTML para la lista de productos del pedido y actualiza el total.
   * @param {Object} order - Objeto con los datos del pedido recibido de la API.
   */
  function renderOrderDetails(order) {
    itemsList.innerHTML = ""; // Limpiar resultados anteriores

    order.items.forEach((item) => {
      const product = item.variant.product;
      const itemTotal = item.unit_price * item.quantity;

      // Ajuste de ruta de imagen (subir un nivel desde /html/)
      const imageUrl = product.image_url
        ? `../${product.image_url}`
        : "../sources/img/logo_negro.png";

      const itemHTML = `
              <div class="summary-item">
                <div class="summary-item-img" style="background-image: url('${imageUrl}')"></div>
                <div class="summary-item-info">
                  <h4>${product.name} (x${item.quantity})</h4>
                  <p>Talla: ${item.variant.size}</p>
                </div>
                <span class="summary-item-price">$${itemTotal.toFixed(2)}</span>
              </div>
            `;
      itemsList.innerHTML += itemHTML;
    });

    totalAmount.textContent = `$${order.total.toFixed(2)}`;
  }

  /**
   * Actualiza las clases CSS de la línea de tiempo para reflejar el progreso del envío.
   * Marca los pasos anteriores como 'completed' y el actual como 'active'.
   * @param {string} status - Estado del pedido ('Processing', 'Shipped', 'Delivered', 'Cancelled').
   */
  function updateStatusTimeline(status) {
    // Resetear todos los estados
    statusProcessing.classList.remove("active", "completed");
    statusShipped.classList.remove("active", "completed");
    statusDelivered.classList.remove("active", "completed");

    // Aplicar lógica visual según el estado
    switch (status) {
      case "Processing":
        statusProcessing.classList.add("active");
        break;
      case "Shipped":
        statusProcessing.classList.add("completed");
        statusShipped.classList.add("active");
        break;
      case "Delivered":
        statusProcessing.classList.add("completed");
        statusShipped.classList.add("completed");
        statusDelivered.classList.add("active"); // Marca final
        break;
      case "Cancelled":
        // Manejo especial para pedidos cancelados
        resultsMessage.style.display = "block";
        resultsMessage.className = "results-message error";
        resultsMessage.textContent = "Este pedido ha sido cancelado.";
        statusTimeline.style.display = "none";
        break;
      default:
        // Estado por defecto (Procesando)
        statusProcessing.classList.add("active");
    }
  }
});
