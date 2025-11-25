// Variables globales
let shippingData = {};
let selectedProvider = null; // Para saber qué eligió el usuario

document.addEventListener("DOMContentLoaded", () => {
  // Referencias DOM
  const stepShipping = document.getElementById("step-shipping");
  const stepPayment = document.getElementById("step-payment");
  const stepConfirmation = document.getElementById("step-confirmation");
  
  const timelineSteps = [
    document.getElementById("timeline-step-1"),
    document.getElementById("timeline-step-2"),
    document.getElementById("timeline-step-3")
  ];

  const shippingForm = document.getElementById("shipping-form");
  const paymentForm = document.getElementById("payment-form"); // Formulario de tarjeta
  const paypalBtn = document.getElementById("pay-paypal-btn");

  const summaryItemsContainer = document.getElementById("summary-items");
  const summaryTotalElement = document.getElementById("summary-total-amount");
  const trackingNumberElement = document.getElementById("tracking-number");

  // Cargar resumen inicial
  loadCartSummary();

  // --- PASO 1: Envío ---
  shippingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(shippingForm);
    shippingData = {
      full_name: formData.get("full_name"),
      address: formData.get("address"),
      city: formData.get("city"),
      state: formData.get("state"),
      zip_code: formData.get("zip_code"),
      country: "MX",
    };
    
    // Al avanzar al paso 2, cargamos los métodos de pago
    loadPaymentMethods();
    goToStep(2);
  });

  // --- LÓGICA DE MÉTODOS DE PAGO ---
  async function loadPaymentMethods() {
    const container = document.getElementById("payment-methods-container");
    container.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Cargando métodos de pago...</p>';

    try {
        const res = await fetch("http://localhost:8080/payment-config/active", {
            credentials: "include"
        });
        const providers = await res.json();

        container.innerHTML = "";

        if (providers.length === 0) {
            container.innerHTML = "<p>No hay métodos de pago activos. Contacte al soporte.</p>";
            return;
        }

        providers.forEach(provider => {
            const card = document.createElement("div");
            card.className = "payment-option-card";
            
            // Iconos según proveedor
            let icon = "fa-credit-card";
            if(provider.providerName === "PAYPAL") icon = "fa-paypal";
            if(provider.providerName === "STRIPE") icon = "fa-stripe";

            card.innerHTML = `
                <i class="fab ${icon}"></i>
                <strong>${provider.providerName}</strong>
            `;

            card.onclick = () => selectPaymentMethod(provider.providerName, card);
            container.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = "<p>Error al cargar métodos de pago.</p>";
    }
  }

  function selectPaymentMethod(providerName, cardElement) {
      selectedProvider = providerName;

      // Estilos visuales de selección
      document.querySelectorAll(".payment-option-card").forEach(el => el.classList.remove("selected"));
      cardElement.classList.add("selected");

      // Mostrar/Ocultar formularios según selección
      const cardContainer = document.getElementById("card-form-container");
      const paypalContainer = document.getElementById("paypal-button-container");

      if (providerName === "STRIPE") {
          // Simulamos que Stripe usa el formulario de tarjeta estándar
          cardContainer.style.display = "block";
          paypalContainer.style.display = "none";
      } else if (providerName === "PAYPAL") {
          cardContainer.style.display = "none";
          paypalContainer.style.display = "block";
      }
  }

  // --- PASO 2: Procesar Pago ---
  
  // Caso A: Tarjeta (Stripe simulado)
  if(paymentForm) {
      paymentForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const cardNum = document.getElementById("card_number").value;
        if (cardNum.length < 14) {
            alert("Número de tarjeta inválido");
            return;
        }
        // Procesar como tarjeta
        processOrder("CARD"); 
      });
  }

  // Caso B: PayPal (Simulado)
  if(paypalBtn) {
      paypalBtn.addEventListener("click", () => {
          // Simular redirección y proceso
          const confirm = window.confirm("Se abrirá una ventana segura de PayPal para completar el pago. ¿Continuar?");
          if(confirm) {
              processOrder("ONLINE"); // PayPal cuenta como ONLINE en tu Schema
          }
      });
  }

  // --- FUNCIÓN PRINCIPAL DE ORDEN ---
  async function processOrder(paymentMethodEnum) {
    // Mostrar loading en el botón activo
    const btn = selectedProvider === "PAYPAL" ? paypalBtn : document.getElementById("pay-card-btn");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = "Procesando...";

    try {
      const response = await fetch("http://localhost:8080/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          shipping_address: shippingData,
          // Opcional: Podrías enviar el providerName al backend si modificaras el modelo Sale
          // provider: selectedProvider 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear el pedido");
      }

      const result = await response.json();
      trackingNumberElement.textContent = result.trackingNumber;
      goToStep(3);

    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  // --- UTILIDADES ---
  async function loadCartSummary() {
    // (Tu código existente de loadCartSummary va aquí, sin cambios)
    try {
        const response = await fetch("http://localhost:8080/cart/items", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
  
        if (response.status === 401) {
          window.location.href = "../html/login.html";
          return;
        }
        
        const cart = await response.json();
        
        if (!cart || cart.items.length === 0) {
          summaryItemsContainer.innerHTML = "<p>Tu carrito está vacío.</p>";
          return;
        }
  
        summaryItemsContainer.innerHTML = "";
        let total = 0;
  
        cart.items.forEach(item => {
          const product = item.variant.product;
          const itemTotal = product.base_price * item.quantity;
          total += itemTotal;
          
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
        console.error("Error al cargar el resumen:", error);
      }
  }

  function goToStep(stepNumber) {
    stepShipping.classList.remove("active");
    stepPayment.classList.remove("active");
    stepConfirmation.classList.remove("active");

    if (stepNumber === 1) {
      timelineSteps[0].classList.add("active");
      stepShipping.classList.add("active");
    } else if (stepNumber === 2) {
      timelineSteps[0].classList.add("completed");
      timelineSteps[1].classList.add("active");
      stepPayment.classList.add("active");
    } else if (stepNumber === 3) {
      timelineSteps[0].classList.add("completed");
      timelineSteps[1].classList.add("completed");
      timelineSteps[2].classList.add("active");
      stepConfirmation.classList.add("active");
    }
  }
});