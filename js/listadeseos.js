/**
 * @file js/listadeseos.js
 * @description Gestiona la funcionalidad de la lista de deseos (Wishlist) del usuario.
 * Permite visualizar los productos guardados, eliminarlos, limpiar la lista completa
 * y mover productos directamente al carrito de compras.
 */

/**
 * Inicializa la lógica de la lista de deseos cuando el DOM está listo.
 * Carga los ítems iniciales y configura el botón de limpieza masiva.
 * @listens document#DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", () => {
  // Cargar los items de la lista de deseos
  loadWishlistItems();

  // Listener para el botón de "Limpiar Lista"
  const clearAllBtn = document.getElementById("clear-all-btn");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      if (
        confirm("¿Estás seguro de que quieres limpiar toda tu lista de deseos?")
      ) {
        // Simula limpieza masiva disparando el clic de eliminación en cada elemento
        // Nota: Idealmente esto debería ser una única petición 'DELETE /wishlist' al backend
        const removeButtons = document.querySelectorAll(".remove-wishlist");
        removeButtons.forEach((btn) => btn.click());
      }
    });
  }
});

/**
 * Obtiene los ítems de la lista de deseos desde la API y renderiza el contenido.
 * Maneja estados de usuario no autenticado, lista vacía y errores de carga.
 * @async
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

    // Manejo de sesión no iniciada
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

    // Manejo de lista vacía
    if (!wishlist || wishlist.items.length === 0) {
      contentEl.style.display = "none";
      emptyEl.style.display = "block";
      updateWishlistSummary(0, 0); // Asegura que el resumen esté en 0
      return;
    }

    // Renderizado de items
    contentEl.style.display = "grid";
    emptyEl.style.display = "none";
    container.innerHTML = ""; // Limpia items anteriores

    let subtotal = 0;
    wishlist.items.forEach((item) => {
      const variant = item.variant;
      const product = variant.product;

      if (!product) return; // Salta si el producto fue borrado de la BD

      const itemPrice = product.base_price;
      subtotal += itemPrice;

      const itemHTML = `
        <div class="wishlist-item" id="wishlist-item-${variant._id}">
            <div class="item-image">
                <img src="../${product.image_url}" alt="${
        product.name
      }" onerror="this.src='../sources/img/logo_negro.png'">
                <button class="remove-wishlist" title="Eliminar de la lista" data-variant-id="${
                  variant._id
                }">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="item-details">
                <h3>${product.name}</h3>
                <p class="item-price">$${itemPrice.toFixed(2)} MXN</p>
                <p class="item-size">Talla: ${variant.size}</p>
                <div class="item-actions">
                    <button class="move-to-cart" data-variant-id="${
                      variant._id
                    }">
                        <i class="fas fa-shopping-cart"></i> Agregar al Carrito
                    </button>
                    </div>
            </div>
        </div>
      `;
      container.innerHTML += itemHTML;
    });

    updateWishlistSummary(wishlist.items.length, subtotal);
    addWishlistListeners(); // Añade listeners a los nuevos botones renderizados
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
 * Asigna los event listeners a los botones dinámicos de cada tarjeta de producto.
 * (Eliminar item y Mover al carrito).
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
 * Elimina un producto específico de la lista de deseos mediante la API.
 * Actualiza el DOM y recalcula totales si la petición es exitosa.
 * @async
 * @param {string} variantId - ID de la variante a eliminar.
 */
async function removeFromWishlist(variantId) {
  try {
    const response = await fetch(
      `http://localhost:8080/wishlist/${variantId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    if (response.ok) {
      // Elimina la tarjeta del DOM
      const cardToRemove = document.getElementById(
        `wishlist-item-${variantId}`
      );
      if (cardToRemove) {
        cardToRemove.remove();
      }
      // Recalcula el total y verifica si quedó vacía
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
 * Añade un producto de la wishlist al carrito de compras.
 * Si es exitoso, opcionalmente lo elimina de la wishlist.
 * @async
 * @param {string} variantId - ID de la variante.
 * @param {HTMLButtonElement} button - Botón que disparó la acción (para feedback visual).
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
      button.style.backgroundColor = "#4CAF50"; // Verde éxito

      // Opcional: eliminar de la lista de deseos después de añadir al carrito
      // Descomentar si se desea comportamiento de "mover" en lugar de "copiar"
      await removeFromWishlist(variantId);
    } else {
      const errorData = await response.json();
      alert(`Error: ${errorData.error}`);
      button.disabled = false;
      button.innerHTML =
        '<i class="fas fa-shopping-cart"></i> Agregar al Carrito';
    }
  } catch (error) {
    console.error("Error al añadir al carrito:", error);
    button.disabled = false;
    button.innerHTML =
      '<i class="fas fa-shopping-cart"></i> Agregar al Carrito';
  }
}

/**
 * Actualiza los contadores visuales del resumen de la wishlist.
 * @param {number} count - Cantidad total de productos.
 * @param {number} total - Valor monetario total acumulado.
 */
function updateWishlistSummary(count, total) {
  const countEl = document.getElementById("wishlist-count");
  const totalEl = document.getElementById("wishlist-total");

  if (countEl) countEl.textContent = count;
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)} MXN`;
}

/**
 * Recalcula el resumen total leyendo los elementos presentes en el DOM.
 * Útil después de eliminar un elemento sin recargar toda la lista.
 */
function recalculateSummary() {
  let subtotal = 0;
  const items = document.querySelectorAll(".wishlist-item");

  items.forEach((item) => {
    // Extrae el precio del texto (ej: "$500.00 MXN")
    const priceText = item.querySelector(".item-price").textContent;
    const price = parseFloat(
      priceText.replace("$", "").replace(" MXN", "").replace(",", "")
    );
    if (!isNaN(price)) {
      subtotal += price;
    }
  });

  updateWishlistSummary(items.length, subtotal);
}

/**
 * Verifica si la lista visual ha quedado vacía y muestra el mensaje correspondiente.
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
