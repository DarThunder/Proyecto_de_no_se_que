document.addEventListener("DOMContentLoaded", () => {
    
    const trackingForm = document.getElementById("tracking-form");
    const trackingInput = document.getElementById("tracking-input");
    const resultsContainer = document.getElementById("tracking-results");
    const resultsMessage = document.getElementById("results-message");
    
    // Contenedores de detalles
    const statusTimeline = document.getElementById("status-timeline");
    const orderDetails = document.getElementById("order-details");
    const itemsList = document.getElementById("order-items-list");
    const totalAmount = document.getElementById("order-total-amount");
    
    // Estados de la línea de tiempo
    const statusProcessing = document.getElementById("status-processing");
    const statusShipped = document.getElementById("status-shipped");
    const statusDelivered = document.getElementById("status-delivered");

    trackingForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const trackingNumber = trackingInput.value.trim();
        if (trackingNumber) {
            findOrder(trackingNumber);
        }
    });

    async function findOrder(trackingNumber) {
        // 1. Mostrar estado de carga y ocultar resultados anteriores
        resultsContainer.style.display = "block";
        statusTimeline.style.display = "none";
        orderDetails.style.display = "none";
        resultsMessage.style.display = "block";
        resultsMessage.className = "results-message loading";
        resultsMessage.textContent = "Buscando tu pedido...";

        try {
            const response = await fetch(`http://localhost:8080/orders/track/${trackingNumber}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("No se encontró ningún pedido con ese número de seguimiento.");
                }
                throw new Error("Error al conectar con el servidor.");
            }

            const order = await response.json();
            
            // 2. Ocultar mensaje de carga y mostrar detalles
            resultsMessage.style.display = "none";
            statusTimeline.style.display = "flex";
            orderDetails.style.display = "block";

            // 3. Renderizar los detalles del pedido
            renderOrderDetails(order);

            // 4. Actualizar la línea de tiempo
            updateStatusTimeline(order.shipping_status);

        } catch (error) {
            resultsMessage.className = "results-message error";
            resultsMessage.textContent = error.message;
        }
    }

    function renderOrderDetails(order) {
        itemsList.innerHTML = ""; // Limpiar items anteriores

        order.items.forEach(item => {
            const product = item.variant.product;
            const itemTotal = item.unit_price * item.quantity;
            
            // La ruta es relativa a la raíz (../) porque esta página está en /html
            const imageUrl = product.image_url ? `../${product.image_url}` : '../sources/img/logo_negro.png';

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

    function updateStatusTimeline(status) {
        // Resetear todos los estados
        statusProcessing.classList.remove("active", "completed");
        statusShipped.classList.remove("active", "completed");
        statusDelivered.classList.remove("active", "completed");

        // Aplicar clases según el estado del pedido
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
                statusDelivered.classList.add("active"); // 'active' o 'completed'
                break;
            case "Cancelled":
                // Podrías tener un estado de "Cancelado"
                resultsMessage.style.display = "block";
                resultsMessage.className = "results-message error";
                resultsMessage.textContent = "Este pedido ha sido cancelado.";
                statusTimeline.style.display = "none";
                break;
            default:
                statusProcessing.classList.add("active");
        }
    }
});