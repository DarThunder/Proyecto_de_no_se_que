document.addEventListener("DOMContentLoaded", () => {
  loadCartItems();
  setupCartEventListeners();

  // --- 3. FUNCIONALIDAD DEL BOTÓN DE PAGAR ---
  const checkoutButton = document.querySelector(".btn-checkout");
  if (checkoutButton) {
    checkoutButton.addEventListener("click", () => {
      // Redirige a la página de checkout
      window.location.href = "checkout.html";
    });
  }
});

async function loadCartItems() {
  const cartItemsContainer = document.querySelector(".cart-items");

  try {
    // Este endpoint es el correcto según tu backend
    const response = await fetch("http://localhost:8080/cart/items", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        cartItemsContainer.innerHTML =
          "<h3 style='text-align: center; color: white;'>Debes iniciar sesión para ver tu carrito.</h3>";
        // Deshabilita el botón de pagar si no está logueado
        document.querySelector(".btn-checkout").disabled = true;
      }
      throw new Error("No se pudo cargar el carrito.");
    }

    const cart = await response.json();

    if (!cart || cart.items.length === 0) {
      cartItemsContainer.innerHTML =
        "<h3 style='text-align: center; color: white;'>Tu carrito está vacío.</h3>";
      updateSummary(0);
      document.querySelector(".btn-checkout").disabled = true; // Deshabilita el botón si está vacío
      return;
    }

    cartItemsContainer.innerHTML = "";
    let subtotal = 0;

    cart.items.forEach((item) => {
      const variant = item.variant;
      const product = variant.product;

      const itemPrice = product.base_price;
      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      // --- 1. CORRECCIÓN DE IMAGEN ---
      // Creamos la ruta correcta. La página está en /html, así que subimos un nivel (../)
      // para acceder a /sources/img/
      const imageUrl = product.image_url ? `../${product.image_url}` : '../sources/img/logo_negro.png';

      const cartItemHTML = `
        <div class="cart-item" data-variant-id="${variant._id}">
            <!-- Se aplica la imagen como fondo -->
            <div class="cart-item-img" style="background-image: url('${imageUrl}')"></div>
            <div class="item-details">
                <h3>${product.name.toUpperCase()} (${variant.size})</h3>
                <p class="item-price">$${itemPrice.toFixed(2)} MXN</p>
            </div>
            <div class="item-quantity">
                <label for="qty-${variant._id}" class="sr-only">Cantidad</label>
                <!-- Guardamos el precio en data-price para recalcular fácil -->
                <input type="number" id="qty-${variant._id}" value="${item.quantity}" min="1" max="${variant.stock || 10}" data-price="${itemPrice}">
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

function updateSummary(subtotal) {
  // Costo de envío (puedes hacerlo más dinámico después)
  const envio = subtotal > 0 ? 99.0 : 0;
  const total = subtotal + envio;

  // --- 2. CORRECCIÓN DE SELECTORES (Usando IDs del HTML) ---
  const subtotalEl = document.getElementById("cart-subtotal");
  const envioEl = document.getElementById("cart-shipping");
  const totalEl = document.getElementById("cart-total");

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (envioEl) envioEl.textContent = `$${envio.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

function setupCartEventListeners() {
  const cartItemsContainer = document.querySelector(".cart-items");

  cartItemsContainer.addEventListener("click", (event) => {
    if (event.target.classList.contains("item-remove")) {
      const cartItem = event.target.closest(".cart-item");
      const variantId = cartItem.dataset.variantId;
      // Para eliminar, enviamos la cantidad actual para vaciarlo
      const quantity = parseInt(
        cartItem.querySelector("input[type='number']").value,
        10
      );

      removeItemFromCart(variantId, quantity, cartItem);
    }
  });

  cartItemsContainer.addEventListener("change", (event) => {
    if (event.target.matches("input[type='number']")) {
      const cartItem = event.target.closest(".cart-item");
      const variantId = cartItem.dataset.variantId;
      const newQuantity = parseInt(event.target.value, 10);

      updateCartItemQuantity(variantId, newQuantity);
    }
  });
}

// Esta función TUYA es CORRECTA para tu backend
async function removeItemFromCart(variantId, quantity, cartItemElement) {
  try {
    const response = await fetch("http://localhost:8080/cart/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, quantity }), // Tu backend espera un body
      credentials: "include",
    });
    if (!response.ok) throw new Error('Error al eliminar');
    
    cartItemElement.remove(); // Elimina del DOM
    recalculateTotal(); // Recalcula el total
  } catch (error) {
    console.error(error);
    alert('No se pudo eliminar el producto.');
  }
}

// Esta función TUYA es CORRECTA para tu backend
async function updateCartItemQuantity(variantId, quantity) {
  try {
    const response = await fetch("http://localhost:8080/cart/items", {
      method: "POST", // Tu backend usa POST para actualizar
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, quantity }),
      credentials: "include",
    });
    if (!response.ok) throw new Error('Error al actualizar');

    recalculateTotal(); // Recalcula el total
  } catch (error) {
    console.error(error);
    alert('No se pudo actualizar la cantidad.');
  }
}

// Esta función AHORA USA DATA-PRICE para ser más segura
function recalculateTotal() {
  const cartItemsContainer = document.querySelector(".cart-items");
  let subtotal = 0;

  cartItemsContainer.querySelectorAll(".cart-item").forEach((item) => {
    const input = item.querySelector("input[type='number']");
    const price = parseFloat(input.dataset.price); // Usamos el data-price guardado
    const quantity = parseInt(input.value, 10);
    subtotal += price * quantity;
  });

  updateSummary(subtotal);
}