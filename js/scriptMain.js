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

  loadProducts();
  setupScrollEffects();
});

async function loadProducts() {
  const menGrid = document.querySelector(".men-section .products-grid");
  const womenGrid = document.querySelector(".women-section .products-grid");

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

    menGrid.innerHTML = "";
    womenGrid.innerHTML = "";

    variants.forEach((variant) => {
      const product = variant.product;

      // Si por alguna razón el producto no vino populado, sáltalo.
      if (!product) {
        console.warn("Variante sin producto adjunto:", variant._id);
        return;
      }
      
      // --- CORRECCIÓN DE IMAGEN ---
      // Se añade la imagen del producto como fondo del div.
      const productCardHTML = `
        <div class="product-card">
            <div class="product-image" style="background-image: url('${product.image_url || 'sources/img/logo_negro.png'}'); background-size: cover; background-position: center;">
            </div>
            <h3>${product.name.toUpperCase()} (${variant.size})</h3>
            <p>$${product.base_price.toFixed(2)} MXN</p>
            
            <button class="product-btn" data-variant-id="${variant._id}">
                AGREGAR AL CARRITO
            </button>
        </div>
      `;

      // --- CORRECCIÓN DE CATEGORÍA ---
      // Se añade la lógica para separar por 'product.category'
      if (product.category === "hombre") {
        menGrid.innerHTML += productCardHTML;
      } else if (product.category === "mujer") {
        womenGrid.innerHTML += productCardHTML;
      } else if (product.category === "unisex") {
        menGrid.innerHTML += productCardHTML;
        womenGrid.innerHTML += productCardHTML;
      }
    });

    // Mueve esta función para que se llame DESPUÉS de crear los botones
    initializeProductButtons(); 
    
  } catch (error) {
    console.error("Error cargando productos:", error);
    menGrid.innerHTML =
      "<p>No se pudieron cargar los productos. Intenta más tarde.</p>";
    womenGrid.innerHTML =
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
