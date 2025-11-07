document.addEventListener("DOMContentLoaded", () => {
  loadCartItems();
  setupCartEventListeners();
});

async function loadCartItems() {
  const cartItemsContainer = document.querySelector(".cart-items");

  try {
    const response = await fetch("http://localhost:8080/cart/items", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        cartItemsContainer.innerHTML =
          "<h3 style='text-align: center; color: white;'>Debes iniciar sesión para ver tu carrito.</h3>";
        return;
      }
      throw new Error("No se pudo cargar el carrito.");
    }

    const cart = await response.json();

    if (!cart || cart.items.length === 0) {
      cartItemsContainer.innerHTML =
        "<h3 style='text-align: center; color: white;'>Tu carrito está vacío.</h3>";
      updateSummary(0);
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

      const cartItemHTML = `
                <div class="cart-item" data-variant-id="${variant._id}">
                    <img src="../sources/img/camisa.jpg" alt="${
                      product.name
                    }"> <div class="item-details">
                        <h3>${product.name.toUpperCase()} (${variant.size})</h3>
                        <p class="item-price">$${itemPrice.toFixed(2)} MXN</p>
                    </div>
                    <div class="item-quantity">
                        <label for="qty-${
                          variant._id
                        }" class="sr-only">Cantidad</label>
                        <input type="number" id="qty-${variant._id}" value="${
        item.quantity
      }" min="1" max="10">
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
  const cartSummary = document.querySelector(".cart-summary");

  const envio = subtotal > 0 ? 99.0 : 0;
  const total = subtotal + envio;

  const subtotalEl = cartSummary.querySelector(
    ".summary-row:nth-child(2) span:last-child"
  );
  const envioEl = cartSummary.querySelector(
    ".summary-row:nth-child(3) span:last-child"
  );
  const totalEl = cartSummary.querySelector(".summary-total span:last-child");

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
      const quantity = parseInt(
        cartItem.querySelector(".item-quantity").querySelector("input").value,
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

async function removeItemFromCart(variantId, quantity, cartItemElement) {
  await fetch("http://localhost:8080/cart/items", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ variantId, quantity }),
    credentials: "include",
  });
  cartItemElement.remove();
  recalculateTotal();
  console.log(`Eliminar ${variantId}`);
}

async function updateCartItemQuantity(variantId, quantity) {
  await fetch("http://localhost:8080/cart/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ variantId, quantity }),
    credentials: "include",
  });
  recalculateTotal();
  console.log(`Actualizar ${variantId} a ${quantity}`);
}

function recalculateTotal() {
  const cartItemsContainer = document.querySelector(".cart-items");
  let subtotal = 0;

  cartItemsContainer.querySelectorAll(".cart-item").forEach((item) => {
    const price = item
      .querySelector(".item-details")
      .querySelector(".item-price")
      .textContent.match(/\d+\.?\d*/)[0];
    const quantity = parseInt(item.querySelector("input").value, 10);
    subtotal += price * quantity;
  });

  updateSummary(subtotal);
}
