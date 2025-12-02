/**
 * @file js/scriptMain.js
 * @description Controlador principal de la página de inicio (Landing Page) y navegación global.
 * Gestiona la interactividad del menú móvil, la carga dinámica de productos destacados y categorías,
 * la personalización de la interfaz según el estado de sesión del usuario, y la inicialización de carruseles.
 */

/**
 * Inicializa la lógica principal cuando el DOM está listo.
 * Configura el menú hamburguesa, dropdowns, carga de productos y efectos visuales.
 * @listens document#DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", () => {
  const hamburgerMenu = document.querySelector(".hamburger-menu");
  const mobileMenu = document.querySelector(".mobile-menu");
  const menuOverlay = document.createElement("div");
  const menuLinks = document.querySelectorAll(
    ".mobile-nav-links a:not(.dropdown-toggle)"
  );
  const dropdownLinks = document.querySelectorAll(".dropdown-link");

  // Configuración del overlay para el menú móvil
  menuOverlay.className = "menu-overlay";
  document.body.appendChild(menuOverlay);

  /**
   * Alterna la visibilidad del menú móvil y bloquea el scroll del body.
   */
  function toggleMobileMenu() {
    const isActive = mobileMenu.classList.contains("active");
    if (isActive) {
      mobileMenu.classList.remove("active");
      menuOverlay.classList.remove("active");
      hamburgerMenu.classList.remove("active");
      document.body.style.overflow = "auto";
    } else {
      mobileMenu.classList.add("active");
      menuOverlay.classList.add("active");
      hamburgerMenu.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  // Listeners para el menú
  if (hamburgerMenu) hamburgerMenu.addEventListener("click", toggleMobileMenu);
  if (menuOverlay) menuOverlay.addEventListener("click", toggleMobileMenu);

  menuLinks.forEach((link) => {
    link.addEventListener("click", toggleMobileMenu);
  });

  dropdownLinks.forEach((link) => {
    link.addEventListener("click", toggleMobileMenu);
  });

  // Gestión de Dropdowns en móvil
  const dropdownToggles = document.querySelectorAll(".dropdown-toggle");
  dropdownToggles.forEach((toggle) => {
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dropdown = toggle.parentElement;
      dropdown.classList.toggle("active");
      // Cierra otros dropdowns abiertos
      dropdownToggles.forEach((otherToggle) => {
        if (otherToggle !== toggle) {
          otherToggle.parentElement.classList.remove("active");
        }
      });
    });
  });

  // Cerrar dropdowns al hacer clic fuera
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown")) {
      document.querySelectorAll(".dropdown").forEach((dropdown) => {
        dropdown.classList.remove("active");
      });
    }
  });

  // Carga condicional de secciones
  if (document.querySelector("#productos-hombre-container")) {
    loadProducts();
  }

  // Cargar categorías dinámicas desde la API
  loadDynamicCategories();

  // Configurar efectos de scroll y animaciones
  setupScrollEffects();
});

/**
 * Carga el contenido de "Términos y Condiciones" desde el backend y lo inyecta en el DOM.
 * @async
 */
const cargarTerminosUsuario = async () => {
  const container = document.getElementById("terminos-content-usuario");
  if (!container) return;

  try {
    const res = await fetch("http://localhost:8080/content/terms");
    const data = await res.json();

    if (res.ok) {
      container.innerHTML = data.htmlContent;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    container.innerHTML =
      "<p>No se pudieron cargar los términos y condiciones en este momento.</p>";
    console.error("Error fetching T&C:", error);
  }
};

// Ejecutar carga de términos si aplica
cargarTerminosUsuario();

/**
 * Actualiza la barra lateral para un usuario logueado.
 * Cambia las opciones de "Iniciar Sesión" / "Crear Cuenta" por "Ver Perfil" / "Cerrar Sesión".
 * @param {Object} user - El objeto de usuario devuelto por la API.
 */
function updateSidebarForLoggedInUser(user) {
  // 1. Buscamos el ícono de "Cuenta" dentro del menú móvil
  const cuentaDropdownIcon = document.querySelector(
    ".mobile-nav-links .dropdown-toggle i.fa-user"
  );

  if (cuentaDropdownIcon) {
    const dropdownLi = cuentaDropdownIcon.closest(".dropdown");

    if (dropdownLi) {
      const dropdownMenu = dropdownLi.querySelector(".dropdown-menu");

      if (dropdownMenu) {
        // Reemplazamos el HTML del menú de usuario
        dropdownMenu.innerHTML = `
                  <li>
                      <a href="html/orders.html" class="dropdown-link">
                          <i class="fas fa-user-circle"></i> Ver Perfil (Mis Compras)
                      </a>
                  </li>
                  <li>
                      <a href="html/login.html" id="sidebar-logout-btn" class="dropdown-link">
                          <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                      </a>
                  </li>
              `;
      }
    }
  }
}

/**
 * Verifica si el usuario tiene una sesión activa consultando al backend.
 * Si es exitoso, actualiza la interfaz de navegación.
 * @async
 */
const checkLoginStatus = async () => {
  try {
    const response = await fetch("http://localhost:8080/users/me", {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const user = await response.json();
      updateSidebarForLoggedInUser(user);
    }
  } catch (error) {
    // Fallo silencioso si no hay sesión
  }
};

// Ejecutar verificación de sesión al inicio
checkLoginStatus();

/**
 * Carga los productos destacados desde la API y los renderiza en los carruseles (Swiper).
 * Filtra por género (hombre/mujer) y asigna los productos a sus contenedores correspondientes.
 * @async
 */
async function loadProducts() {
  const menGrid = document.querySelector("#productos-hombre-container");
  const womenGrid = document.querySelector("#productos-mujer-container");

  if (!menGrid || !womenGrid) return;

  try {
    const response = await fetch("http://localhost:8080/products");
    if (!response.ok) {
      throw new Error("Error al cargar productos de la API");
    }

    const variants = await response.json();

    let menHTML = "";
    let womenHTML = "";

    variants.forEach((variant) => {
      const product = variant.product;
      if (!product) return;

      // Ajuste de ruta de imagen relativa
      const imageUrl = product.image_url || "sources/img/logo_negro.png";

      // Estructura para Swiper Slide
      const productCardHTML = `
        <div class="swiper-slide">
            <div class="product-card">
                <button class="wishlist-btn" data-variant-id="${
                  variant._id
                }" title="Añadir a lista de deseos">
                    <i class="far fa-heart"></i> 
                </button>
                
                <a href="html/producto.html?id=${variant._id}">
                  <div class="product-image" style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;">
                  </div>
                </a>
                
                <h3>${product.name.toUpperCase()} (${variant.size})</h3>
                <p>$${product.base_price.toFixed(2)} MXN</p>
                
                <button class="product-btn" data-variant-id="${variant._id}">
                    AGREGAR AL CARRITO
                </button>
            </div>
        </div>
      `;

      // Distribución por categoría
      if (product.category === "hombre") {
        menHTML += productCardHTML;
      } else if (product.category === "mujer") {
        womenHTML += productCardHTML;
      } else if (product.category === "unisex") {
        menHTML += productCardHTML;
        womenHTML += productCardHTML;
      }
    });

    menGrid.innerHTML = menHTML;
    womenGrid.innerHTML = womenHTML;

    // Inicializar componentes interactivos
    initializeCarousels();
    initializeProductButtons();
    initializeWishlistButtons();
  } catch (error) {
    console.error("Error cargando productos:", error);
    menGrid.innerHTML =
      "<p>No se pudieron cargar los productos. Intenta más tarde.</p>";
  }
}

/**
 * Carga los datos básicos del usuario para mostrarlos en el encabezado (ej. nombre).
 * @async
 */
async function loadUserData() {
  const userHeaderInfo = document.getElementById("user-header-info");
  const headerUsername = document.getElementById("header-username");

  try {
    const userResponse = await fetch("http://localhost:8080/users/me", {
      method: "GET",
      credentials: "include",
    });

    if (userResponse.status === 401) return; // No logueado

    if (!userResponse.ok) throw new Error("Error al obtener datos del usuario");

    const userData = await userResponse.json();

    if (userHeaderInfo && headerUsername) {
      userHeaderInfo.style.display = "flex";
      headerUsername.textContent = userData.username || "Cliente";
    }
  } catch (error) {
    console.error("Error al cargar datos del usuario:", error);
  }
}

// Cargar datos de usuario al inicio
document.addEventListener("DOMContentLoaded", () => {
  loadUserData();
});

/**
 * Carga las categorías dinámicas desde la API y las renderiza en la sección correspondiente.
 * @async
 */
async function loadDynamicCategories() {
  const dynamicContainer = document.getElementById(
    "dynamic-categories-container"
  );
  if (!dynamicContainer) return;

  try {
    const response = await fetch("http://localhost:8080/categories");
    if (!response.ok) throw new Error("Error al cargar categorías dinámicas");

    const categories = await response.json();

    if (categories.length === 0) return;

    let categoriesHTML = "";
    categories.forEach((category) => {
      let imageUrl = category.image_url || "sources/img/category_default.png";
      if (!imageUrl.startsWith("http") && !imageUrl.startsWith("/")) {
        imageUrl = "sources/img/" + imageUrl;
      }

      categoriesHTML += `
                <div class="category-card">
                    <div class="category-image">
                        <img src="${imageUrl}" alt="${category.name}" 
                             onerror="this.src='sources/img/category_default.png'">
                    </div>
                    <h3>${category.name.toUpperCase()}</h3>
                    <a href="html/categoria.html?tipo=${encodeURIComponent(
                      category.name.toLowerCase()
                    )}" 
                       class="category-link">
                        VER MÁS
                    </a>
                </div>
            `;
    });

    dynamicContainer.innerHTML = categoriesHTML;
  } catch (error) {
    console.error("Error cargando categorías dinámicas:", error);
  }
}

/**
 * Inicializa los listeners para los botones "AGREGAR AL CARRITO" en el home.
 * Maneja la petición a la API y el feedback visual.
 */
function initializeProductButtons() {
  document
    .querySelectorAll(".men-section .product-btn, .women-section .product-btn")
    .forEach((button) => {
      button.addEventListener("click", async function () {
        const variantId = this.dataset.variantId;
        if (!variantId) return;

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
              alert("Debes iniciar sesión para agregar productos al carrito.");
              window.location.href = "html/login.html";
            }
            throw new Error("Error al agregar");
          }
        } catch (error) {
          console.error(error);
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
 * Inicializa los listeners para los botones de lista de deseos (corazón).
 */
function initializeWishlistButtons() {
  document.querySelectorAll(".wishlist-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const variantId = this.dataset.variantId;
      if (!variantId) return;

      const icon = this.querySelector("i");
      const isWishlisted = icon.classList.contains("fas"); // 'fas' = lleno (ya está en lista)

      await toggleWishlistItem(variantId, this, isWishlisted);
    });
  });
}

/**
 * Añade o elimina un ítem de la lista de deseos.
 * @async
 * @param {string} variantId - ID del producto.
 * @param {HTMLButtonElement} button - Botón que disparó la acción.
 * @param {boolean} isWishlisted - Estado actual (true si ya está en la lista).
 */
async function toggleWishlistItem(variantId, button, isWishlisted) {
  const heartIcon = button.querySelector("i");

  if (isWishlisted) {
    // --- ELIMINAR ---
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
        heartIcon.classList.remove("fas");
        heartIcon.classList.add("far");
        button.title = "Añadir a lista de deseos";
      } else if (response.status === 401) {
        alert("Tu sesión ha expirado.");
        window.location.href = "html/login.html";
      }
    } catch (error) {
      console.error("Error en toggleWishlistItem (DELETE):", error);
    }
  } else {
    // --- AÑADIR ---
    try {
      const response = await fetch("http://localhost:8080/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ variantId }),
      });

      if (response.ok) {
        heartIcon.classList.remove("far");
        heartIcon.classList.add("fas");
        button.title = "Eliminar de la lista de deseos";
      } else if (response.status === 401) {
        alert("Debes iniciar sesión para añadir a tu lista de deseos.");
        window.location.href = "html/login.html";
      }
    } catch (error) {
      console.error("Error en toggleWishlistItem (POST):", error);
    }
  }
}

/**
 * Inicializa las instancias de Swiper para los carruseles de productos.
 * Define la configuración responsiva (breakpoints).
 */
function initializeCarousels() {
  const commonOptions = {
    loop: true,
    slidesPerView: 1, // Móvil
    spaceBetween: 30,
    pagination: {
      clickable: true,
    },
    breakpoints: {
      640: { slidesPerView: 2, spaceBetween: 20 },
      1024: { slidesPerView: 3, spaceBetween: 30 },
    },
  };

  new Swiper("#swiper-hombre", {
    ...commonOptions,
    pagination: { el: "#swiper-hombre .swiper-pagination", clickable: true },
    navigation: {
      nextEl: "#swiper-hombre .swiper-button-next",
      prevEl: "#swiper-hombre .swiper-button-prev",
    },
  });

  new Swiper("#swiper-mujer", {
    ...commonOptions,
    pagination: { el: "#swiper-mujer .swiper-pagination", clickable: true },
    navigation: {
      nextEl: "#swiper-mujer .swiper-button-next",
      prevEl: "#swiper-mujer .swiper-button-prev",
    },
  });
}

/**
 * Configura efectos visuales basados en el scroll.
 * - Desplazamiento suave para anclas.
 * - Animación de aparición (fade-in) para secciones.
 * - Cambio de fondo del header al hacer scroll.
 */
function setupScrollEffects() {
  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      if (this.getAttribute("href") !== "#") {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  });

  // Intersection Observer para animaciones
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
  );

  document
    .querySelectorAll(
      ".categories, .men-section, .women-section, .new-arrivals"
    )
    .forEach((section) => {
      section.style.opacity = "0";
      section.style.transform = "translateY(20px)";
      section.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      observer.observe(section);
    });

  // Header background on scroll
  window.addEventListener("scroll", () => {
    const header = document.querySelector(".header");
    if (header) {
      if (window.scrollY > 100) {
        header.style.background = "rgba(10, 10, 10, 0.98)";
      } else {
        header.style.background = "rgba(10, 10, 10, 0.95)";
      }
    }
  });
}
