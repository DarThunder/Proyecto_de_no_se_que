/**
 * @file js/categoria.js
 * @description Controla la página de visualización de productos por categoría.
 * Obtiene el tipo de categoría de la URL, carga los productos desde la API,
 * gestiona los filtros dinámicos (talla, género, precio) y renderiza la cuadrícula de productos.
 */

// --- 1. Variables Globales ---

/**
 * Almacena todos los productos (variantes) cargados inicialmente para la categoría actual.
 * Se utiliza como base para aplicar los filtros sin volver a consultar la API.
 * @type {Array<Object>}
 */
let allCategoryProducts = [];

/**
 * Referencia al contenedor del DOM donde se renderizarán las tarjetas de productos.
 * @type {HTMLElement}
 */
const productGrid = document.getElementById("category-product-grid");

/**
 * Inicializa la lógica de la página al cargar el DOM.
 * 1. Extrae el parámetro 'tipo' de la URL.
 * 2. Actualiza el título de la página.
 * 3. Inicia la carga de productos o muestra error si no hay categoría.
 * 4. Configura los listeners para los filtros laterales.
 * @listens document#DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", () => {
  // 1. OBTENER LA CATEGORÍA DE LA URL
  const params = new URLSearchParams(window.location.search);
  const categoria = params.get("tipo"); // ej. "pantalones"

  if (categoria) {
    // 2. ACTUALIZAR EL TÍTULO DE LA PÁGINA
    const titleElement = document.getElementById("category-title");
    titleElement.textContent = categoria.toUpperCase(); // "PANTALONES"

    // 3. CARGAR LOS PRODUCTOS INICIALES
    loadCategoryProducts(categoria.toLowerCase());
  } else {
    // Manejar el caso de que no haya categoría
    if (productGrid) {
      productGrid.innerHTML = "<p>No se especificó una categoría.</p>";
    }
    const titleElement = document.getElementById("category-title");
    if (titleElement) titleElement.textContent = "ERROR";
  }

  // --- 4. AÑADIR EVENT LISTENERS A LOS FILTROS ---
  setupFilterListeners();
});

/**
 * Carga los productos desde la API y filtra aquellos que coinciden con la categoría solicitada.
 * @async
 * @param {string} categoria - El tipo de producto a cargar (ej. "pantalones").
 */
async function loadCategoryProducts(categoria) {
  if (!productGrid) {
    console.error(
      "No se encontró el contenedor de productos '#category-product-grid'."
    );
    return;
  }

  try {
    const response = await fetch("http://localhost:8080/products");
    if (!response.ok) {
      throw new Error("Error al cargar productos de la API");
    }

    const variants = await response.json();

    // Filtramos por el 'productType' (ej. "pantalones")
    allCategoryProducts = variants.filter(
      (variant) =>
        variant.product &&
        variant.product.productType &&
        variant.product.productType.toLowerCase() === categoria
    );

    if (allCategoryProducts.length === 0) {
      productGrid.innerHTML = `<p>No se encontraron productos para "${categoria}".</p>`;
      return;
    }

    // 6. RENDERIZAR LOS PRODUCTOS
    renderProducts(allCategoryProducts);
  } catch (error) {
    console.error("Error cargando productos:", error);
    productGrid.innerHTML =
      "<p>No se pudieron cargar los productos. Intenta más tarde.</p>";
  }
}

/**
 * Configura los event listeners para los botones de filtro y el slider de precio.
 * Cualquier cambio dispara la función `applyFilters()`.
 */
function setupFilterListeners() {
  // Escucha botones de filtro (Talla, Género)
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.toggle("active");
      applyFilters();
    });
  });

  // Escucha el slider de precio
  const priceSlider = document.querySelector(".filter-price-slider");
  const priceDisplay = document.querySelector(
    ".price-range-display span:last-child"
  );
  if (priceSlider && priceDisplay) {
    priceSlider.addEventListener("input", () => {
      priceDisplay.textContent = `$${priceSlider.value}`;
      applyFilters();
    });
  }
}

/**
 * Lee el estado actual de los filtros (botones activos y valor del slider)
 * y filtra el array `allCategoryProducts`. Luego renderiza los resultados.
 */
function applyFilters() {
  // A. Leer filtro de Talla
  const selectedSizes = Array.from(
    document.querySelectorAll("#filter-group-size .filter-btn.active")
  ).map((btn) => btn.textContent.toUpperCase());

  // B. Leer filtro de Género
  const selectedGenders = Array.from(
    document.querySelectorAll("#filter-group-gender .filter-btn.active")
  ).map((btn) => btn.dataset.filter); // 'hombre', 'mujer', 'unisex'

  // C. Leer filtro de Precio
  const maxPrice = parseFloat(
    document.querySelector("#filter-group-price .filter-price-slider").value
  );

  // Empezamos con todos los productos de la categoría
  let filteredProducts = allCategoryProducts;

  // Aplicar filtro de Talla
  if (selectedSizes.length > 0) {
    filteredProducts = filteredProducts.filter((variant) =>
      selectedSizes.includes(variant.size.toUpperCase())
    );
  }

  // Aplicar filtro de Género
  if (selectedGenders.length > 0) {
    filteredProducts = filteredProducts.filter(
      (variant) =>
        variant.product.category &&
        selectedGenders.includes(variant.product.category.toLowerCase())
    );
  }

  // Aplicar filtro de Precio
  filteredProducts = filteredProducts.filter(
    (variant) => variant.product.base_price <= maxPrice
  );

  // 9. RENDERIZAMOS LA LISTA YA FILTRADA
  renderProducts(filteredProducts);
}

/**
 * Genera el HTML de las tarjetas de producto y las inserta en el contenedor.
 * También reinicializa los listeners de los botones de acción (carrito/wishlist).
 * @param {Array<Object>} productsToRender - Lista de variantes a mostrar.
 */
function renderProducts(productsToRender) {
  productGrid.innerHTML = ""; // Limpiamos el grid

  if (productsToRender.length === 0) {
    productGrid.innerHTML =
      "<p>No se encontraron productos con estos filtros.</p>";
    return;
  }

  productsToRender.forEach((variant) => {
    const product = variant.product;

    // Ruta de imagen corregida para estar en /html/categoria.html
    const imageUrl = product.image_url
      ? `../${product.image_url}`
      : "../sources/img/logo_negro.png";

    const productCardHTML = `
            <div class="product-card">
                <button class="wishlist-btn" data-variant-id="${
                  variant._id
                }" title="Añadir a lista de deseos">
                    <i class="far fa-heart"></i> </button>
                
                <a href="producto.html?id=${variant._id}">
                  <div class="product-image" style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;">
                  </div>
                </a>
                
                <h3>${product.name.toUpperCase()} (${variant.size})</h3>
                <p>$${product.base_price.toFixed(2)} MXN</p>
                
                <button class="product-btn" data-variant-id="${variant._id}">
                    AGREGAR AL CARRITO
                </button>
            </div>
        `;
    productGrid.innerHTML += productCardHTML;
  });

  // Inicializamos los botones de las nuevas tarjetas
  initializeCatProductButtons();
  initializeCatWishlistButtons();
}

/**
 * Añade listeners a los botones "AGREGAR AL CARRITO" de la lista de categoría.
 * Gestiona el estado de carga y las alertas de sesión.
 */
function initializeCatProductButtons() {
  document.querySelectorAll(".product-grid .product-btn").forEach((button) => {
    // Previene que se añadan múltiples listeners al mismo botón
    if (button.dataset.listenerAttached) return;
    button.dataset.listenerAttached = true;

    button.addEventListener("click", async function () {
      const variantId = this.dataset.variantId;
      this.textContent = "AGREGANDO...";
      this.disabled = true;

      try {
        const response = await fetch("http://localhost:8080/cart/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ variantId: variantId, quantity: 1 }),
        });

        if (response.ok) {
          this.textContent = "AGREGADO ✓";
          this.style.background = "#4CAF50";
        } else {
          if (response.status === 401 || response.status === 403) {
            alert("Debes iniciar sesión para agregar productos.");
            window.location.href = "login.html";
          }
          throw new Error("Error al agregar");
        }
      } catch (error) {
        this.textContent = "ERROR";
        this.style.background = "#e74c3c";
      } finally {
        setTimeout(() => {
          this.textContent = "AGREGAR AL CARRITO";
          this.style.background = "#fff";
          this.style.color = "#000";
          this.disabled = false;
        }, 2000);
      }
    });
  });
}

/**
 * Añade listeners a los botones de "Lista de Deseos" (corazón).
 * Detecta si el producto ya está en la lista (clase 'fas') o no ('far').
 */
function initializeCatWishlistButtons() {
  document.querySelectorAll(".product-grid .wishlist-btn").forEach((button) => {
    if (button.dataset.listenerAttached) return;
    button.dataset.listenerAttached = true;

    button.addEventListener("click", async function () {
      const variantId = this.dataset.variantId;
      if (!variantId) {
        console.error(
          "El producto no tiene un ID de variante (data-variant-id)."
        );
        return;
      }

      // Verificamos si el corazón está lleno ('fas') o vacío ('far')
      const icon = this.querySelector("i");
      const isWishlisted = icon.classList.contains("fas");

      await toggleWishlistItemCat(variantId, this, isWishlisted);
    });
  });
}

/**
 * Realiza la petición a la API para añadir o eliminar un producto de la wishlist.
 * @async
 * @param {string} variantId - ID de la variante.
 * @param {HTMLButtonElement} button - Botón que disparó el evento.
 * @param {boolean} isWishlisted - Estado actual (true = ya está en la lista, se eliminará).
 */
async function toggleWishlistItemCat(variantId, button, isWishlisted) {
  const heartIcon = button.querySelector("i");

  if (isWishlisted) {
    // --- LÓGICA PARA ELIMINAR (DELETE) ---
    try {
      const response = await fetch(
        `http://localhost:8080/wishlist/${variantId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (response.ok) {
        // Éxito: Cambia el ícono a "vacío"
        heartIcon.classList.remove("fas");
        heartIcon.classList.add("far");
        button.title = "Añadir a lista de deseos";
      } else if (response.status === 401 || response.status === 403) {
        alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        window.location.href = "login.html";
      } else {
        throw new Error("Error al eliminar de la lista de deseos");
      }
    } catch (error) {
      console.error("Error en toggleWishlistItemCat (DELETE):", error);
    }
  } else {
    // --- LÓGICA PARA AÑADIR (POST) ---
    try {
      const response = await fetch("http://localhost:8080/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ variantId }),
      });

      if (response.ok) {
        // Éxito: Cambia el ícono a "lleno"
        heartIcon.classList.remove("far");
        heartIcon.classList.add("fas");
        button.title = "Eliminar de la lista de deseos";
      } else if (response.status === 401 || response.status === 403) {
        alert("Debes iniciar sesión para añadir a tu lista de deseos.");
        window.location.href = "login.html";
      } else if (response.status === 400) {
        // El producto ya estaba (por si acaso), solo marca el corazón
        heartIcon.classList.remove("far");
        heartIcon.classList.add("fas");
        button.title = "Ya está en tu lista";
      } else {
        throw new Error("Error al añadir a la lista de deseos");
      }
    } catch (error) {
      console.error("Error en toggleWishlistItemCat (POST):", error);
    }
  }
}
