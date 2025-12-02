/**
 * @file js/carrito.js
 * @description Gestiona la lógica del carrito de compras en el frontend.
 * Se encarga de cargar los productos del usuario, manejar cambios de cantidad,
 * eliminar ítems y calcular los totales (subtotal, envío, total) dinámicamente.
 */

/**
 * Inicializa el carrito cuando el DOM está completamente cargado.
 * 1. Carga los ítems del carrito desde el backend.
 * 2. Configura los listeners globales para eventos de cambio y eliminación.
 * 3. Configura la redirección del botón de "Pagar".
 * @listens document#DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", () => {
  loadCartItems();
  setupCartEventListeners();

  // --- 3. FUNCIONALIDAD DEL BOTÓN DE PAGAR ---
  const checkoutButton = document.querySelector(".btn-checkout");
  if (checkoutButton) {
    checkoutButton.addEventListener("click", () => {
      // Redirige a la página de checkout (proceso de pago)
      window.location.href = "checkout.html";
    });
  }
});

/**
 * Obtiene los ítems del carrito del usuario actual desde la API y los renderiza en el DOM.
 * Maneja estados de carrito vacío, usuario no autenticado (401/403) y errores de red.
 * @async
 */
async function loadCartItems() {
  const cartItemsContainer = document.querySelector(".cart-items");

  try {
    const response = await fetch("http://localhost:8080/cart/items", {
      method: "GET",
      credentials: "include", // Importante: Envía la cookie de sesión
    });

    if (!response.ok) {
      // Manejo de sesión expirada o no iniciada
      if (response.status === 401 || response.status === 403) {
        cartItemsContainer.innerHTML =
          "<h3 style='text-align: center; color: white;'>Debes iniciar sesión para ver tu carrito.</h3>";
        // Deshabilita el botón de pagar si no está logueado
        const checkoutBtn = document.querySelector(".btn-checkout");
        if (checkoutBtn) checkoutBtn.disabled = true;
      }
      throw new Error("No se pudo cargar el carrito.");
    }

    const cart = await response.json();

    // Manejo de carrito vacío
    if (!cart || cart.items.length === 0) {
      cartItemsContainer.innerHTML =
        "<h3 style='text-align: center; color: white;'>Tu carrito está vacío.</h3>";
      updateSummary(0);
      const checkoutBtn = document.querySelector(".btn-checkout");
      if (checkoutBtn) checkoutBtn.disabled = true;
      return;
    }

    // Renderizado de ítems
    cartItemsContainer.innerHTML = "";
    let subtotal = 0;

    cart.items.forEach((item) => {
      const variant = item.variant;
      const product = variant.product;

      const itemPrice = product.base_price;
      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      // Corrección de ruta de imagen (subir un nivel desde /html/)
      const imageUrl = product.image_url
        ? `../${product.image_url}`
        : "../sources/img/logo_negro.png";

      const cartItemHTML = `
        <div class="cart-item" data-variant-id="${variant._id}">
            <div class="cart-item-img" style="background-image: url('${imageUrl}')"></div>
            <div class="item-details">
                <h3>${product.name.toUpperCase()} (${variant.size})</h3>
                <p class="item-price">$${itemPrice.toFixed(2)} MXN</p>
            </div>
            <div class="item-quantity">
                <label for="qty-${variant._id}" class="sr-only">Cantidad</label>
                <input type="number" id="qty-${variant._id}" 
                       value="${item.quantity}" 
                       min="1" max="${variant.stock || 10}" 
                       data-price="${itemPrice}">
            </div>
            <button class="item-remove" title="Eliminar producto">&times;</button>
        </div>
      `;
      cartItemsContainer.innerHTML += cartItemHTML;
    });

    updateSummary(subtotal);
  } catch (error) {
    console.error(error);
    cartItemsContainer.innerHTML =
      "<h3 style='text-align: center; color: red;'>Error al cargar el carrito.</h3>";
  }
}

/**
 * Actualiza la sección de resumen de pedido (Subtotal, Envío, Total).
 * @param {number} subtotal - La suma del precio de todos los productos.
 */
function updateSummary(subtotal) {
  // Lógica de envío: $99 si hay productos, $0 si está vacío
  const envio = subtotal > 0 ? 99.0 : 0;
  const total = subtotal + envio;

  const subtotalEl = document.getElementById("cart-subtotal");
  const envioEl = document.getElementById("cart-shipping");
  const totalEl = document.getElementById("cart-total");

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (envioEl) envioEl.textContent = `$${envio.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

/**
 * Configura la delegación de eventos para la lista de ítems.
 * Detecta clics en "Eliminar" y cambios en los inputs de "Cantidad".
 */
function setupCartEventListeners() {
  const cartItemsContainer = document.querySelector(".cart-items");

  // Listener para eliminar producto
  cartItemsContainer.addEventListener("click", (event) => {
    if (event.target.classList.contains("item-remove")) {
      const cartItem = event.target.closest(".cart-item");
      const variantId = cartItem.dataset.variantId;
      // Para eliminar, enviamos la cantidad actual para vaciarlo del backend
      const quantity = parseInt(
        cartItem.querySelector("input[type='number']").value,
        10
      );

      removeItemFromCart(variantId, quantity, cartItem);
    }
  });

  // Listener para cambiar cantidad
  cartItemsContainer.addEventListener("change", (event) => {
    if (event.target.matches("input[type='number']")) {
      const cartItem = event.target.closest(".cart-item");
      const variantId = cartItem.dataset.variantId;
      const newQuantity = parseInt(event.target.value, 10);

      updateCartItemQuantity(variantId, newQuantity);
    }
  });
}

/**
 * Elimina un producto del carrito llamando a la API y actualizando el DOM.
 * @async
 * @param {string} variantId - ID de la variante a eliminar.
 * @param {number} quantity - Cantidad a remover (usualmente toda la cantidad actual).
 * @param {HTMLElement} cartItemElement - El elemento DOM de la tarjeta del producto.
 */
async function removeItemFromCart(variantId, quantity, cartItemElement) {
  try {
    const response = await fetch("http://localhost:8080/cart/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, quantity }),
      credentials: "include",
    });
    if (!response.ok) throw new Error("Error al eliminar");

    cartItemElement.remove(); // Elimina del DOM inmediatamente
    recalculateTotal(); // Recalcula el total sin recargar la página
  } catch (error) {
    console.error(error);
    alert("No se pudo eliminar el producto.");
  }
}

/**
 * Actualiza la cantidad de un producto en el backend.
 * @async
 * @param {string} variantId - ID de la variante.
 * @param {number} quantity - Nueva cantidad total deseada.
 */
async function updateCartItemQuantity(variantId, quantity) {
  try {
    const response = await fetch("http://localhost:8080/cart/items", {
      method: "POST", // El backend usa POST para setear/actualizar
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, quantity }),
      credentials: "include",
    });
    if (!response.ok) throw new Error("Error al actualizar");

    recalculateTotal(); // Recalcula totales con la nueva cantidad
  } catch (error) {
    console.error(error);
    alert("No se pudo actualizar la cantidad.");
  }
}

/**
 * Recalcula el total del carrito basándose en los datos actuales del DOM.
 * Itera sobre los inputs visibles, lee su `data-price` y cantidad, y suma.
 * Más eficiente que volver a llamar a `loadCartItems()`.
 */
function recalculateTotal() {
  const cartItemsContainer = document.querySelector(".cart-items");
  let subtotal = 0;

  cartItemsContainer.querySelectorAll(".cart-item").forEach((item) => {
    const input = item.querySelector("input[type='number']");
    const price = parseFloat(input.dataset.price); // Leemos el precio guardado
    const quantity = parseInt(input.value, 10);
    subtotal += price * quantity;
  });

  updateSummary(subtotal);
}
