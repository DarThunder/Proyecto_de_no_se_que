/**
 * @file js/reseñaUser.js
 * @description Gestiona el flujo de creación de nuevas reseñas por parte del usuario.
 * Permite listar los productos comprados previamente, seleccionar uno para calificar,
 * y enviar la reseña completa (rating, comentario, talla) al backend.
 */

/**
 * Inicializa la lógica de reseñas cuando el DOM está listo.
 * Carga los datos del usuario y sus productos comprados, y configura los eventos.
 * @listens document#DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", () => {
  loadUserDataAndProducts();
  setupEventListeners();
});

// --- Estado Global ---

/** @type {Object|null} Producto seleccionado para reseñar (id, nombre). */
let selectedProduct = null;

/** @type {number} Calificación seleccionada (1-5 estrellas). */
let selectedRating = 0;

/** @type {string} Talla seleccionada ('S', 'M', 'L', etc.). */
let selectedSize = "";

/**
 * Carga la información del usuario y la lista de productos disponibles para reseñar.
 * Verifica la sesión y maneja los estados de carga y errores.
 * @async
 */
async function loadUserDataAndProducts() {
  const loadingMsg = document.getElementById("loading-message");
  const loginRequiredMsg = document.getElementById("login-required-message");
  const noProductsMsg = document.getElementById("no-products-message");
  const productSelectionStep = document.getElementById(
    "product-selection-step"
  );
  const userHeaderInfo = document.getElementById("user-header-info");
  const headerUsername = document.getElementById("header-username");

  try {
    // PRIMERO: Obtener datos del usuario para el header
    const userResponse = await fetch("http://localhost:8080/users/me", {
      method: "GET",
      credentials: "include",
    });

    if (userResponse.status === 401) {
      loadingMsg.style.display = "none";
      loginRequiredMsg.style.display = "block";
      return;
    }

    if (!userResponse.ok) {
      throw new Error("Error al obtener datos del usuario");
    }

    const userData = await userResponse.json();

    // Mostrar nombre en el header
    userHeaderInfo.style.display = "flex";
    headerUsername.textContent = userData.username || "Cliente";

    // SEGUNDO: Obtener productos comprados elegibles para reseña
    const productsResponse = await fetch(
      "http://localhost:8080/orders/user/purchased-products",
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!productsResponse.ok) {
      throw new Error("Error del servidor al cargar productos");
    }

    const products = await productsResponse.json();
    loadingMsg.style.display = "none";

    if (products.length === 0) {
      noProductsMsg.style.display = "block";
      return;
    }

    // Mostrar paso de selección de producto
    productSelectionStep.style.display = "block";
    displayProducts(products);
  } catch (error) {
    console.error("Error al cargar productos:", error);
    loadingMsg.style.display = "none";
    loginRequiredMsg.innerHTML = `
            <div class="login-icon"><i class="fas fa-exclamation-triangle"></i></div>
            <h2>Error al cargar</h2>
            <p>No se pudo conectar con el servidor. Intenta de nuevo más tarde.</p>`;
    loginRequiredMsg.style.display = "block";
  }
}

/**
 * Configura los event listeners para la interacción del formulario.
 * (Selección de estrellas, tallas, contador de caracteres y envío).
 */
function setupEventListeners() {
  // Selección de estrellas (Rating)
  document.querySelectorAll(".rating-star").forEach((star) => {
    star.addEventListener("click", () => {
      selectedRating = parseInt(star.dataset.rating);
      updateRatingStars();
      document.getElementById("rating-value").value = selectedRating;
    });
  });

  // Selección de talla
  document.querySelectorAll(".size-option").forEach((option) => {
    option.addEventListener("click", () => {
      selectedSize = option.dataset.size;
      updateSizeSelection();
      document.getElementById("size-value").value = selectedSize;
    });
  });

  // Contador de caracteres en tiempo real
  document.getElementById("comment").addEventListener("input", (e) => {
    document.getElementById("char-count").textContent = e.target.value.length;
  });

  // Envío del formulario
  document
    .getElementById("review-form")
    .addEventListener("submit", submitReview);
}

/**
 * Renderiza la cuadrícula de productos disponibles para reseñar.
 * @param {Array<Object>} products - Lista de productos comprados.
 */
function displayProducts(products) {
  const productsGrid = document.getElementById("products-grid");

  products.forEach((product, index) => {
    const productHTML = createProductHTML(product, index);
    productsGrid.innerHTML += productHTML;
  });

  // Asignar evento click a cada tarjeta generada
  document.querySelectorAll(".product-card-review").forEach((card) => {
    card.addEventListener("click", () => selectProduct(card));
  });
}

/**
 * Genera el HTML para una tarjeta de producto en la lista de selección.
 * @param {Object} product - Datos del producto.
 * @param {number} index - Índice para animación.
 * @returns {string} HTML de la tarjeta.
 */
function createProductHTML(product, index) {
  const purchaseDate = new Date(product.purchaseDate).toLocaleDateString(
    "es-ES"
  );
  const imageUrl = product.imageUrl
    ? `../${product.imageUrl}`
    : "../sources/img/logo_negro.png";

  return `
        <div class="product-card-review" data-product-id="${
          product.id
        }" style="animation-delay: ${index * 0.1}s">
            <div class="product-image" style="background-image: url('${imageUrl}')"></div>
            <div class="product-info">
                <h4>${product.name}</h4>
                <div class="product-meta">
                    <p><strong>Categoría:</strong> ${product.category}</p>
                    <p><strong>Comprado el:</strong> ${purchaseDate}</p>
                    <p><strong>Talla:</strong> ${
                      product.size || "No especificada"
                    }</p>
                </div>
                <div class="product-price">$${product.price.toFixed(
                  2
                )} MXN</div>
            </div>
        </div>
    `;
}

/**
 * Gestiona la selección de un producto para reseñar.
 * Cambia la vista del paso de selección al paso de formulario.
 * @param {HTMLElement} card - Elemento DOM de la tarjeta seleccionada.
 */
function selectProduct(card) {
  // Gestión visual de selección
  document.querySelectorAll(".product-card-review").forEach((c) => {
    c.classList.remove("selected");
  });
  card.classList.add("selected");

  const productId = card.dataset.productId;
  const productName = card.querySelector("h4").textContent;

  // Guardar selección en estado global
  selectedProduct = {
    id: productId,
    name: productName,
  };

  // Transición de vistas
  document.getElementById("product-selection-step").style.display = "none";
  document.getElementById("review-form-step").style.display = "block";

  // Actualizar encabezado del formulario
  document.getElementById("selected-product-name").textContent = productName;
  document.getElementById("selected-product-id").value = productId;
}

/**
 * Permite volver al paso de selección de productos.
 * Resetea el formulario actual.
 * @global
 */
function goBackToProducts() {
  document.getElementById("review-form-step").style.display = "none";
  document.getElementById("product-selection-step").style.display = "block";
  resetForm();
}

/**
 * Restablece todos los campos y variables del formulario de reseña.
 */
function resetForm() {
  selectedRating = 0;
  selectedSize = "";
  document.getElementById("rating-value").value = "";
  document.getElementById("size-value").value = "";
  document.getElementById("comment").value = "";
  document.getElementById("char-count").textContent = "0";

  updateRatingStars();
  updateSizeSelection();
}

/**
 * Actualiza visualmente las estrellas según la calificación seleccionada.
 */
function updateRatingStars() {
  document.querySelectorAll(".rating-star").forEach((star, index) => {
    const rating = index + 1;
    if (rating <= selectedRating) {
      star.classList.add("active");
    } else {
      star.classList.remove("active");
    }
  });
}

/**
 * Actualiza visualmente los botones de talla según la selección.
 */
function updateSizeSelection() {
  document.querySelectorAll(".size-option").forEach((option) => {
    if (option.dataset.size === selectedSize) {
      option.classList.add("selected");
    } else {
      option.classList.remove("selected");
    }
  });
}

/**
 * Maneja el envío del formulario de reseña al backend.
 * Realiza validaciones antes de enviar la petición POST.
 * @async
 * @param {Event} event - Evento submit del formulario.
 */
async function submitReview(event) {
  event.preventDefault();

  // Validaciones
  if (!selectedProduct) return alert("Por favor selecciona un producto");
  if (selectedRating === 0)
    return alert("Por favor selecciona una calificación");
  if (!selectedSize) return alert("Por favor selecciona una talla");

  const comment = document.getElementById("comment").value;
  if (!comment.trim()) return alert("Por favor escribe un comentario");

  const formData = {
    product: selectedProduct.id,
    rating: selectedRating,
    comment: comment,
    size: selectedSize,
  };

  try {
    const response = await fetch("http://localhost:8080/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok) {
      alert("¡Reseña creada exitosamente!");
      // Redirigir a la lista de "Mis Reseñas"
      window.location.href = "misreseñas.html";
    } else {
      alert("Error al crear reseña: " + result.error);
    }
  } catch (error) {
    console.error("Error al crear reseña:", error);
    alert("Error al crear reseña. Intenta de nuevo.");
  }
}

// Funciones globales expuestas
window.goBackToProducts = goBackToProducts;
