document.addEventListener("DOMContentLoaded", () => {
  const hamburgerMenu = document.querySelector(".hamburger-menu");
  const mobileMenu = document.querySelector(".mobile-menu");
  const menuOverlay = document.createElement("div");
  const menuLinks = document.querySelectorAll(
    ".mobile-nav-links a:not(.dropdown-toggle)"
  );
  const dropdownLinks = document.querySelectorAll(".dropdown-link");

  menuOverlay.className = "menu-overlay";
  document.body.appendChild(menuOverlay);

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

  hamburgerMenu.addEventListener("click", toggleMobileMenu);
  menuOverlay.addEventListener("click", toggleMobileMenu);

  menuLinks.forEach((link) => {
    link.addEventListener("click", toggleMobileMenu);
  });

  dropdownLinks.forEach((link) => {
    link.addEventListener("click", toggleMobileMenu);
  });

  const dropdownToggles = document.querySelectorAll(".dropdown-toggle");
  dropdownToggles.forEach((toggle) => {
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dropdown = toggle.parentElement;
      dropdown.classList.toggle("active");
      dropdownToggles.forEach((otherToggle) => {
        if (otherToggle !== toggle) {
          otherToggle.parentElement.classList.remove("active");
        }
      });
    });
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown")) {
      document.querySelectorAll(".dropdown").forEach((dropdown) => {
        dropdown.classList.remove("active");
      });
    }
  });
  
  if (document.querySelector("#productos-hombre-container")) {
      loadProducts();
    }
    
    setupScrollEffects();
  });

  // CARGAR TERMINOS Y CONDICIONES EN EL INDEX
    const cargarTerminosUsuario = async () => {
        const container = document.getElementById('terminos-content-usuario');
        if (!container) return; // Salir si el elemento no existe en esta página

        try {
            const res = await fetch('http://localhost:8080/content/terms'); // Llama a la ruta pública
            const data = await res.json();
            
            if (res.ok) {
                container.innerHTML = data.htmlContent; // Inserta el HTML directamente
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            container.innerHTML = '<p>No se pudieron cargar los términos y condiciones en este momento.</p>';
            console.error('Error fetching T&C:', error);
        }
    };

    cargarTerminosUsuario();


async function loadProducts() {
  // 1. APUNTAMOS A LOS NUEVOS CONTENEDORES (swiper-wrapper)
  const menGrid = document.querySelector("#productos-hombre-container");
  const womenGrid = document.querySelector("#productos-mujer-container");

  if (!menGrid || !womenGrid) {
    console.error("No se encontraron los contenedores de productos.");
    return;
  }

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
      if (!product) return; // Si un producto se borró pero la variante no

      const imageUrl = product.image_url || 'sources/img/logo_negro.png';

      // 2. ENVOLVEMOS LA TARJETA EN <div class="swiper-slide">
      const productCardHTML = `
        <div class="swiper-slide">
            <div class="product-card">
                <button class="wishlist-btn" data-variant-id="${variant._id}" title="Añadir a lista de deseos">
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

    // 3. INICIALIZAMOS LOS CARRUSELES DESPUÉS DE CARGAR EL HTML
    initializeCarousels();

    initializeProductButtons();
    initializeWishlistButtons(); // <-- LLAMADA A LA NUEVA FUNCIÓN

  } catch (error) {
    console.error("Error cargando productos:", error);
    menGrid.innerHTML =
      "<p>No se pudieron cargar los productos. Intenta más tarde.</p>";
  }
}

function initializeProductButtons() {
  document
    .querySelectorAll(".men-section .product-btn, .women-section .product-btn")
    .forEach((button) => {
      button.addEventListener("click", async function () {
        const variantId = this.dataset.variantId;
        if (!variantId) {
          console.error(
            "El producto no tiene un ID de variante (data-variant-id)."
          );
          return;
        }

        this.textContent = "AGREGANDO...";
        this.disabled = true;

        try {
          const response = await fetch("http://localhost:8080/cart/items", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              variantId: variantId,
              quantity: 1,
            }),
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

// --- NUEVA FUNCIÓN PARA LA LISTA DE DESEOS ---
function initializeWishlistButtons() {
  document.querySelectorAll(".wishlist-btn").forEach((button) => {
    button.addEventListener("click", async function () {
      const variantId = this.dataset.variantId;
      if (!variantId) {
        console.error("El producto no tiene un ID de variante (data-variant-id).");
        return;
      }
      
      // Verificamos si el corazón está lleno ('fas') o vacío ('far')
      const icon = this.querySelector('i');
      const isWishlisted = icon.classList.contains('fas');

      // Llamamos a la nueva función
      await toggleWishlistItem(variantId, this, isWishlisted);
    });
  });
}

async function toggleWishlistItem(variantId, button, isWishlisted) {
  const heartIcon = button.querySelector('i');
  
  if (isWishlisted) {
    // --- LÓGICA PARA ELIMINAR (DELETE) ---
    try {
      const response = await fetch(`http://localhost:8080/wishlist/${variantId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        // Éxito: Cambia el ícono a "vacío"
        heartIcon.classList.remove('fas');
        heartIcon.classList.add('far');
        button.title = "Añadir a lista de deseos";
      } else if (response.status === 401 || response.status === 403) {
        alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        window.location.href = "html/login.html";
      } else {
        throw new Error("Error al eliminar de la lista de deseos");
      }
    } catch (error) {
      console.error("Error en toggleWishlistItem (DELETE):", error);
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
        heartIcon.classList.remove('far');
        heartIcon.classList.add('fas');
        button.title = "Eliminar de la lista de deseos";
      } else if (response.status === 401 || response.status === 403) {
        alert("Debes iniciar sesión para añadir a tu lista de deseos.");
        window.location.href = "html/login.html";
      } else if (response.status === 400) {
        // El producto ya estaba (por si acaso), solo marca el corazón
        heartIcon.classList.remove('far');
        heartIcon.classList.add('fas');
        button.title = "Ya está en tu lista";
      } else {
        throw new Error("Error al añadir a la lista de deseos");
      }
    } catch (error) {
      console.error("Error en toggleWishlistItem (POST):", error);
    }
  }
}


// 4. NUEVA FUNCIÓN PARA INICIALIZAR LOS CARRUSELES
function initializeCarousels() {
  const swiperHombre = new Swiper('#swiper-hombre', {
    loop: true,
    slidesPerView: 1, // 1 slide en móvil
    spaceBetween: 30,
    pagination: {
      el: '#swiper-hombre .swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '#swiper-hombre .swiper-button-next',
      prevEl: '#swiper-hombre .swiper-button-prev',
    },
    breakpoints: {
      // > 640px
      640: {
        slidesPerView: 2,
        spaceBetween: 20,
      },
      // > 1024px
      1024: {
        slidesPerView: 3,
        spaceBetween: 30,
      },
    }
  });
  
  const swiperMujer = new Swiper('#swiper-mujer', {
    loop: true,
    slidesPerView: 1, // 1 slide en móvil
    spaceBetween: 30,
    pagination: {
      el: '#swiper-mujer .swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '#swiper-mujer .swiper-button-next',
      prevEl: '#swiper-mujer .swiper-button-prev',
    },
    breakpoints: {
      640: {
        slidesPerView: 2,
        spaceBetween: 20,
      },
      1024: {
        slidesPerView: 3,
        spaceBetween: 30,
      },
    }
  });
}




function setupScrollEffects() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      if (this.getAttribute("href") !== "#") {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    });
  });

  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

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

  window.addEventListener("scroll", () => {
    const header = document.querySelector(".header");
    if (window.scrollY > 100) {
      header.style.background = "rgba(10, 10, 10, 0.98)";
    } else {
      header.style.background = "rgba(10, 10, 10, 0.95)";
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      // mobileMenu.classList.remove('active');
      // menuOverlay.classList.remove('active');
      // hamburgerMenu.classList.remove('active');
      // document.body.style.overflow = 'auto';
    }
  });
}