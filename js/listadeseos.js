document.addEventListener("DOMContentLoaded", () => {
  // Cargar los items de la lista de deseos
  loadWishlistItems();

  // Listener para el botón de "Limpiar Lista"
  const clearAllBtn = document.getElementById("clear-all-btn");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      if (confirm("¿Estás seguro de que quieres limpiar toda tu lista de deseos?")) {
        // Itera y elimina uno por uno (o crea una ruta 'DELETE /wishlist' en el backend)
        const removeButtons = document.querySelectorAll(".remove-wishlist");
        removeButtons.forEach(btn => btn.click());
      }
    });
  }
});

/**
 * Carga los items de la lista de deseos desde la API
 */
async function loadWishlistItems() {
  const container = document.getElementById("wishlist-items-container");
  const contentEl = document.getElementById("wishlist-content");
  const emptyEl = document.getElementById("empty-wishlist-message");

  if (!container || !contentEl || !emptyEl) return;

  try {
    const response = await fetch("http://localhost:8080/wishlist", {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 401) {
      emptyEl.innerHTML = `
        <div class="empty-icon"><i class="fas fa-lock"></i></div>
        <h2>Debes iniciar sesión</h2>
        <p>Para ver tu lista de deseos, por favor inicia sesión.</p>
        <a href="login.html" class="cta-button">Iniciar Sesión</a>`;
      contentEl.style.display = "none";
      emptyEl.style.display = "block";
      return;
    }

    if (!response.ok) {
      throw new Error("No se pudo cargar la lista de deseos.");
    }

    const wishlist = await response.json();

    if (!wishlist || wishlist.items.length === 0) {
      contentEl.style.display = "none";
      emptyEl.style.display = "block";
      updateWishlistSummary(0, 0); // Asegura que el resumen esté en 0
      return;
    }

    // Si hay items, muestra el contenido
    contentEl.style.display = "grid";
    emptyEl.style.display = "none";
    container.innerHTML = ""; // Limpia items anteriores

    let subtotal = 0;
    wishlist.items.forEach((item) => {
      const variant = item.variant;
      const product = variant.product;

      if (!product) return; // Salta si el producto fue borrado

      const itemPrice = product.base_price;
      subtotal += itemPrice;

      const itemHTML = `
        <div class="wishlist-item" id="wishlist-item-${variant._id}">
            <div class="item-image">
                <img src="../${product.image_url}" alt="${product.name}" onerror="this.src='../sources/img/logo_negro.png'">
                <button class="remove-wishlist" title="Eliminar de la lista" data-variant-id="${variant._id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="item-details">
                <h3>${product.name}</h3>
                <p class="item-price">$${itemPrice.toFixed(2)} MXN</p>
                <p class="item-size">Talla: ${variant.size}</p>
                <div class="item-actions">
                    <button class="move-to-cart" data-variant-id="${variant._id}">
                        <i class="fas fa-shopping-cart"></i> Agregar al Carrito
                    </button>
                    </div>
            </div>
        </div>
      `;
      container.innerHTML += itemHTML;
    });

    updateWishlistSummary(wishlist.items.length, subtotal);
    addWishlistListeners(); // Añade listeners a los botones recién creados

  } catch (error) {
    console.error("Error al cargar la lista de deseos:", error);
    contentEl.style.display = "none";
    emptyEl.innerHTML = `
        <div class="empty-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <h2>Error al cargar</h2>
        <p>No se pudo conectar con el servidor. Intenta de nuevo más tarde.</p>`;
    emptyEl.style.display = "block";
  }
}

/**
 * Añade listeners a los botones de "Eliminar" y "Mover al Carrito"
 */
function addWishlistListeners() {
  // Botones de Eliminar
  document.querySelectorAll(".remove-wishlist").forEach((button) => {
    button.addEventListener("click", async () => {
      const variantId = button.dataset.variantId;
      await removeFromWishlist(variantId);
    });
  });

  // Botones de Mover al Carrito
  document.querySelectorAll(".move-to-cart").forEach((button) => {
    button.addEventListener("click", async () => {
      const variantId = button.dataset.variantId;
      await moveItemToCart(variantId, button);
    });
  });
}

/**
 * Llama a la API para eliminar un item de la lista de deseos
 */
async function removeFromWishlist(variantId) {
  try {
    const response = await fetch(`http://localhost:8080/wishlist/${variantId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (response.ok) {
      // Elimina la tarjeta del DOM
      const cardToRemove = document.getElementById(`wishlist-item-${variantId}`);
      if (cardToRemove) {
        cardToRemove.remove();
      }
      // Recalcula el total
      recalculateSummary();
      checkIfEmpty();
    } else {
      alert("Error al eliminar el producto.");
    }
  } catch (error) {
    console.error("Error al eliminar:", error);
  }
}

/**
 * Llama a la API para añadir un item al carrito
 */
async function moveItemToCart(variantId, button) {
  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Añadiendo...';

  try {
    const response = await fetch("http://localhost:8080/cart/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ variantId, quantity: 1 }),
    });

    if (response.ok) {
      button.innerHTML = "Añadido ✓";
      button.style.backgroundColor = "#4CAF50"; // Verde
      
      // Opcional: eliminar de la lista de deseos después de añadir al carrito
      await removeFromWishlist(variantId);

    } else {
      const errorData = await response.json();
      alert(`Error: ${errorData.error}`);
      button.disabled = false;
      button.innerHTML = '<i class="fas fa-shopping-cart"></i> Agregar al Carrito';
    }
  } catch (error) {
    console.error("Error al añadir al carrito:", error);
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-shopping-cart"></i> Agregar al Carrito';
  }
}

/**
 * Actualiza el resumen de la lista de deseos
 */
function updateWishlistSummary(count, total) {
  const countEl = document.getElementById("wishlist-count");
  const totalEl = document.getElementById("wishlist-total");

  if (countEl) countEl.textContent = count;
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)} MXN`;
}

/**
 * Recalcula el resumen basado en los items que quedan en el DOM
 */
function recalculateSummary() {
    let subtotal = 0;
    const items = document.querySelectorAll(".wishlist-item");
    
    items.forEach(item => {
        const priceText = item.querySelector('.item-price').textContent;
        const price = parseFloat(priceText.replace('$', '').replace(' MXN', '').replace(',', ''));
        if (!isNaN(price)) {
            subtotal += price;
        }
    });
    
    updateWishlistSummary(items.length, subtotal);
}

/**
 * Comprueba si la lista está vacía y muestra el mensaje correspondiente
 */
function checkIfEmpty() {
    const container = document.getElementById("wishlist-items-container");
    const contentEl = document.getElementById("wishlist-content");
    const emptyEl = document.getElementById("empty-wishlist-message");
    
    if (container.children.length === 0) {
        contentEl.style.display = "none";
        emptyEl.style.display = "block";
    }
}