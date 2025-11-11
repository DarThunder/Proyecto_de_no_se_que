// Variable global para almacenar los datos de envío
let shippingData = {};

document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Seleccionar todos los elementos del DOM ---
  const stepShipping = document.getElementById("step-shipping");
  const stepPayment = document.getElementById("step-payment");
  const stepConfirmation = document.getElementById("step-confirmation");

  const timelineStep1 = document.getElementById("timeline-step-1");
  const timelineStep2 = document.getElementById("timeline-step-2");
  const timelineStep3 = document.getElementById("timeline-step-3");

  const shippingForm = document.getElementById("shipping-form");
  const paymentForm = document.getElementById("payment-form");

  const summaryItemsContainer = document.getElementById("summary-items");
  const summaryTotalElement = document.getElementById("summary-total-amount");

  const placeOrderBtn = document.getElementById("place-order-btn");
  const trackingNumberElement = document.getElementById("tracking-number");

  // --- 2. Cargar el resumen del carrito al iniciar ---
  loadCartSummary();

  // --- 3. Event Listener para el formulario de Envío ---
  shippingForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Evita que el formulario se envíe
    
    // Guarda los datos del formulario en la variable global
    const formData = new FormData(shippingForm);
    shippingData = {
      full_name: formData.get("full_name"),
      address: formData.get("address"),
      city: formData.get("city"),
      state: formData.get("state"),
      zip_code: formData.get("zip_code"),
      country: "MX", // Asumimos México por ahora
    };

    // Avanzar al siguiente paso
    goToStep(2);
  });

  // --- 4. Event Listener para el formulario de Pago ---
  paymentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    // Validar datos de pago (simulado)
    const cardNum = document.getElementById("card_number").value;
    if (cardNum.length < 16) {
      alert("Por favor, introduce un número de tarjeta válido.");
      return;
    }
    
    // Si la validación es exitosa, procesar el pedido
    processOrder();
  });

  // --- 5. Función para cargar el resumen del carrito ---
  async function loadCartSummary() {
    try {
      // --- CORRECIÓN DE ENDPOINT ---
      // Cambiado de /cart a /cart/items para coincidir con tu backend
      const response = await fetch("http://localhost:8080/cart/items", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Importante para enviar cookies/token
      });

      if (response.status === 401) {
        window.location.href = "../html/login.html"; // Redirige si no está logueado
        return;
      }
      
      const cart = await response.json();
      
      if (!cart || cart.items.length === 0) {
        summaryItemsContainer.innerHTML = "<p>Tu carrito está vacío.</p>";
        // Deshabilita los formularios si no hay nada que comprar
        shippingForm.querySelector("button").disabled = true;
        paymentForm.querySelector("button").disabled = true;
        return;
      }

      summaryItemsContainer.innerHTML = ""; // Limpia el resumen
      let total = 0;

      cart.items.forEach(item => {
        const product = item.variant.product;
        const itemTotal = product.base_price * item.quantity;
        total += itemTotal;
        
        // CORRECCIÓN de ruta de imagen (añadir ../)
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
        summaryItemsContainer.innerHTML += itemHTML;
      });

      summaryTotalElement.textContent = `$${total.toFixed(2)}`;

    } catch (error) {
      console.error("Error al cargar el resumen del carrito:", error);
      summaryItemsContainer.innerHTML = "<p>Error al cargar el resumen.</p>";
    }
  }

  // --- 6. Función para procesar la orden (llamar a la API) ---
  async function processOrder() {
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = "Procesando...";

    try {
      const response = await fetch("http://localhost:8080/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Envía el token de autenticación
        body: JSON.stringify({
          shipping_address: shippingData // Envía los datos guardados del paso 1
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el pedido");
      }

      const result = await response.json();

      // Pedido exitoso, mostrar confirmación
      trackingNumberElement.textContent = result.trackingNumber;
      goToStep(3); // Avanzar al paso de confirmación

    } catch (error) {
      console.error("Error en el pago:", error);
      alert(`Error: ${error.message}`);
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = "Finalizar Pedido";
    }
  }

  // --- 7. Función para cambiar entre pasos ---
  function goToStep(stepNumber) {
    // Oculta todos los pasos
    stepShipping.classList.remove("active");
    stepPayment.classList.remove("active");
    stepConfirmation.classList.remove("active");

    // Actualiza la línea de tiempo
    if (stepNumber === 1) {
      timelineStep1.classList.add("active");
      timelineStep2.classList.remove("active");
      timelineStep3.classList.remove("active");
      stepShipping.classList.add("active");
    } else if (stepNumber === 2) {
      timelineStep1.classList.add("completed");
      timelineStep2.classList.add("active");
      timelineStep3.classList.remove("active");
      stepPayment.classList.add("active");
    } else if (stepNumber === 3) {
      timelineStep1.classList.add("completed");
      timelineStep2.classList.add("completed");
      timelineStep3.classList.add("active");
      stepConfirmation.classList.add("active");
    }
  }
});