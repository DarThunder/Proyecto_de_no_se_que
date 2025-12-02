/**
 * @file js/producto.js
 * @description Controlador para la página de detalle de producto individual.
 * Gestiona la carga de información del producto (variante), la visualización de precios y stock,
 * la funcionalidad de agregar al carrito y la carga/renderizado de reseñas de usuarios.
 */

/**
 * Listener inicial para configurar la página al cargar.
 * Obtiene el ID de la URL, carga los detalles básicos y configura el botón de compra.
 * @listens document#DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", () => {
  // 1. Leer el ID de la variante desde la URL
  const params = new URLSearchParams(window.location.search);
  const variantId = params.get("id");

  const addToCartBtn = document.getElementById("add-to-cart-btn");

  if (variantId) {
    // 2. Cargar los detalles del producto
    loadProductDetails(variantId);

    // 3. Configurar el botón de "Agregar al Carrito"
    addToCartBtn.addEventListener("click", async () => {
      const quantity = parseInt(
        document.getElementById("quantity-input").value
      );

      // Lógica visual del botón (Feedback de carga)
      addToCartBtn.textContent = "AGREGANDO...";
      addToCartBtn.classList.add("loading");
      addToCartBtn.disabled = true;

      try {
        // Llamada a la API para añadir al carrito
        const response = await fetch("http://localhost:8080/cart/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ variantId: variantId, quantity: quantity }),
        });

        if (response.ok) {
          addToCartBtn.textContent = "AGREGADO ✓";
          addToCartBtn.classList.remove("loading");
          addToCartBtn.classList.add("success");
        } else {
          if (response.status === 401 || response.status === 403) {
            alert("Debes iniciar sesión para agregar productos.");
            window.location.href = "login.html";
          }
          throw new Error("Error al agregar");
        }
      } catch (error) {
        addToCartBtn.textContent = "ERROR AL AGREGAR";
        addToCartBtn.classList.remove("loading");
      } finally {
        // Restaurar estado del botón después de 2 segundos
        setTimeout(() => {
          addToCartBtn.textContent = "AGREGAR AL CARRITO";
          addToCartBtn.classList.remove("success");
          addToCartBtn.disabled = false;
        }, 2000);
      }
    });
  } else {
    // Manejo de error si no hay ID en la URL
    document.getElementById("product-name").textContent =
      "Producto no encontrado";
  }
});

/**
 * Carga los detalles de una variante específica desde la API.
 * (Nota: Esta función parece ser una versión inicial, hay una versión actualizada más abajo en el archivo).
 * @async
 * @param {string} variantId - ID de la variante a cargar.
 */
async function loadProductDetails(variantId) {
  try {
    const response = await fetch(`http://localhost:8080/products/${variantId}`);

    if (!response.ok) {
      throw new Error("Producto no encontrado");
    }

    const variant = await response.json();
    const product = variant.product;

    // Llenar el DOM con los datos
    document.getElementById(
      "product-main-image"
    ).src = `../${product.image_url}`;
    document.getElementById("product-main-image").alt = product.name;
    document.getElementById("product-name").textContent = product.name;
    document.getElementById(
      "product-price"
    ).textContent = `$${product.base_price.toFixed(2)} MXN`;
    document.getElementById("product-size").textContent = variant.size;
    document.getElementById("product-description").textContent =
      product.description || "Este producto no tiene descripción.";

    // Configurar límite del input de cantidad según stock disponible
    document.getElementById("quantity-input").max = variant.stock;
  } catch (error) {
    console.error("Error al cargar el producto:", error);
    document.getElementById("product-name").textContent = "Error al cargar";
    document.getElementById("product-description").textContent = error.message;
  }
}

/**
 * Obtiene las reseñas asociadas al producto padre de la variante actual.
 * @async
 * @param {string} productId - ID del producto padre.
 */
async function loadProductReviews(productId) {
  try {
    const response = await fetch(
      `http://localhost:8080/reviews/product/${productId}`
    );

    if (!response.ok) {
      throw new Error("Error al cargar reseñas");
    }

    const reviews = await response.json();
    displayProductReviews(reviews);
  } catch (error) {
    console.error("Error al cargar reseñas:", error);
    document.getElementById("reviews-list").innerHTML =
      "<p>Error al cargar reseñas</p>";
  }
}

/**
 * Renderiza la lista de reseñas y calcula las estadísticas (promedio, total).
 * @param {Array<Object>} reviews - Lista de objetos reseña.
 */
function displayProductReviews(reviews) {
  const reviewsList = document.getElementById("reviews-list");
  const noReviewsMsg = document.getElementById("no-reviews-message");
  const averageRating = document.getElementById("average-rating");
  const reviewCount = document.getElementById("review-count");
  const averageStars = document.getElementById("average-stars");

  // Calcular promedio
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const avgRating =
    reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "0.0";

  // Actualizar estadísticas visuales
  averageRating.textContent = avgRating;
  reviewCount.textContent = `(${reviews.length} reseña${
    reviews.length !== 1 ? "s" : ""
  })`;

  // Mostrar estrellas del promedio
  averageStars.innerHTML = createStarsHTML(parseFloat(avgRating));

  if (reviews.length === 0) {
    reviewsList.style.display = "none";
    noReviewsMsg.style.display = "block";
    return;
  }

  noReviewsMsg.style.display = "none";
  reviewsList.innerHTML = "";

  // Renderizar cada reseña
  reviews.forEach((review) => {
    const reviewHTML = createReviewHTML(review);
    reviewsList.innerHTML += reviewHTML;
  });
}

/**
 * Genera el HTML para una tarjeta de reseña individual.
 * @param {Object} review - Datos de la reseña.
 * @returns {string} HTML de la tarjeta.
 */
function createReviewHTML(review) {
  const reviewDate = new Date(review.createdAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const starsHTML = createStarsHTML(review.rating);
  const userName = review.user?.username || "Cliente";

  return `
        <div class="review-item">
            <div class="review-header">
                <div class="reviewer-info">
                    <h4>${userName}</h4>
                    <div class="review-meta">${reviewDate}</div>
                </div>
                <div class="review-rating">
                    ${starsHTML}
                </div>
            </div>
            <div class="review-content">
                <p>${review.comment}</p>
            </div>
            <div class="review-size">
                Talla: ${review.size}
            </div>
        </div>
    `;
}

/**
 * Crea el HTML de estrellas (llenas, medias o vacías) basado en un valor numérico.
 * @param {number} rating - Valor de calificación (0-5).
 * @returns {string} HTML con iconos de FontAwesome.
 */
function createStarsHTML(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars += '<i class="fas fa-star"></i>'; // Estrella llena
    } else if (i - 0.5 <= rating) {
      stars += '<i class="fas fa-star-half-alt"></i>'; // Media estrella
    } else {
      stars += '<i class="far fa-star"></i>'; // Estrella vacía
    }
  }
  return stars;
}

/**
 * Versión ACTUALIZADA de loadProductDetails.
 * Esta función sobrescribe la anterior en tiempo de ejecución.
 * Además de cargar los detalles, inicia la carga de las reseñas asociadas.
 * @async
 * @param {string} variantId
 */
async function loadProductDetails(variantId) {
  try {
    const response = await fetch(`http://localhost:8080/products/${variantId}`);

    if (!response.ok) {
      throw new Error("Producto no encontrado");
    }

    const variant = await response.json();
    const product = variant.product;

    // Llenar datos del producto
    document.getElementById(
      "product-main-image"
    ).src = `../${product.image_url}`;
    document.getElementById("product-main-image").alt = product.name;
    document.getElementById("product-name").textContent = product.name;
    document.getElementById(
      "product-price"
    ).textContent = `$${product.base_price.toFixed(2)} MXN`;
    document.getElementById("product-size").textContent = variant.size;
    document.getElementById("product-description").textContent =
      product.description || "Este producto no tiene descripción.";
    document.getElementById("quantity-input").max = variant.stock;

    // CARGAR RESEÑAS DEL PRODUCTO (Nueva funcionalidad en esta versión)
    loadProductReviews(product._id);
  } catch (error) {
    console.error("Error al cargar el producto:", error);
    document.getElementById("product-name").textContent = "Error al cargar";
    document.getElementById("product-description").textContent = error.message;
  }
}

/**
 * Segundo Listener de inicialización.
 * Se encarga de configurar la interactividad de la sección de reseñas (botón mostrar/ocultar).
 * Nota: Se ejecuta adicionalmente al primer listener.
 * @listens document#DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const variantId = params.get("id");
  const viewReviewsBtn = document.getElementById("view-reviews-btn");

  if (variantId) {
    // La carga de detalles ya se llama en el primer listener o aquí,
    // pero como es la misma función, es redundante pero seguro.
    loadProductDetails(variantId);

    // Botón ver reseñas (Toggle de visibilidad)
    if (viewReviewsBtn) {
      viewReviewsBtn.addEventListener("click", () => {
        const reviewsContainer = document.getElementById("reviews-container");
        if (reviewsContainer.style.display === "none") {
          reviewsContainer.style.display = "block";
          viewReviewsBtn.innerHTML =
            '<i class="fas fa-eye-slash"></i> Ocultar Reseñas';
        } else {
          reviewsContainer.style.display = "none";
          viewReviewsBtn.innerHTML =
            '<i class="fas fa-comments"></i> Ver Reseñas';
        }
      });
    }
  }
});
