// js/categoria.js

// --- 1. Variables Globales ---
let allCategoryProducts = [];
const productGrid = document.getElementById('category-product-grid');

document.addEventListener("DOMContentLoaded", () => {
    // 1. OBTENER LA CATEGORÍA DE LA URL
    const params = new URLSearchParams(window.location.search);
    const categoria = params.get('tipo'); // ej. "pantalones"

    if (categoria) {
        // 2. ACTUALIZAR EL TÍTULO DE LA PÁGINA
        const titleElement = document.getElementById('category-title');
        titleElement.textContent = categoria.toUpperCase(); // "PANTALONES"
        
        // 3. CARGAR LOS PRODUCTOS INICIALES
        loadCategoryProducts(categoria.toLowerCase());
    } else {
        // Manejar el caso de que no haya categoría
        productGrid.innerHTML = "<p>No se especificó una categoría.</p>";
        document.getElementById('category-title').textContent = "ERROR";
    }

    // --- 4. AÑADIR EVENT LISTENERS A LOS FILTROS ---
    setupFilterListeners();
});

async function loadCategoryProducts(categoria) {
    if (!productGrid) {
        console.error("No se encontró el contenedor de productos '#category-product-grid'.");
        return;
    }

    try {
        const response = await fetch("http://localhost:8080/products");
        if (!response.ok) {
            throw new Error("Error al cargar productos de la API");
        }

        const variants = await response.json();
        
        // Filtramos por el 'productType' (ej. "pantalones")
        allCategoryProducts = variants.filter(variant => 
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
        productGrid.innerHTML = "<p>No se pudieron cargar los productos. Intenta más tarde.</p>";
    }
}

// --- 7. Función para configurar los listeners de filtros ---
function setupFilterListeners() {
    // Esta función ahora escucha CUALQUIER botón de filtro y CUALQUIER slider
    // y simplemente llama a applyFilters()
    
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            button.classList.toggle('active');
            applyFilters();
        });
    });

    const priceSlider = document.querySelector('.filter-price-slider');
    const priceDisplay = document.querySelector('.price-range-display span:last-child');
    if (priceSlider && priceDisplay) {
        priceSlider.addEventListener('input', () => {
            priceDisplay.textContent = `$${priceSlider.value}`;
            applyFilters();
        });
    }
}

// --- 8. FUNCIÓN applyFilters() ACTUALIZADA ---
// Ahora lee de los IDs específicos
function applyFilters() {
    
    // A. Leer filtro de Talla
    const selectedSizes = Array.from(document.querySelectorAll('#filter-group-size .filter-btn.active'))
                                .map(btn => btn.textContent.toUpperCase());

    // B. Leer filtro de Género
    const selectedGenders = Array.from(document.querySelectorAll('#filter-group-gender .filter-btn.active'))
                                 .map(btn => btn.dataset.filter); // 'hombre', 'mujer', 'unisex'

    // C. Leer filtro de Precio
    const maxPrice = parseFloat(document.querySelector('#filter-group-price .filter-price-slider').value);

    // Empezamos con todos los productos de la categoría
    let filteredProducts = allCategoryProducts;

    // Aplicar filtro de Talla
    if (selectedSizes.length > 0) {
        filteredProducts = filteredProducts.filter(variant => 
            selectedSizes.includes(variant.size.toUpperCase())
        );
    }

    // Aplicar filtro de Género
    if (selectedGenders.length > 0) {
        filteredProducts = filteredProducts.filter(variant =>
            variant.product.category && 
            selectedGenders.includes(variant.product.category.toLowerCase())
        );
    }

    // Aplicar filtro de Precio
    filteredProducts = filteredProducts.filter(variant => 
        variant.product.base_price <= maxPrice
    );

    // 9. RENDERIZAMOS LA LISTA YA FILTRADA
    renderProducts(filteredProducts);
}


// --- 10. Función de renderizado (con la corrección de 'class') ---
function renderProducts(productsToRender) {
    productGrid.innerHTML = ""; // Limpiamos el grid

    if (productsToRender.length === 0) {
        productGrid.innerHTML = "<p>No se encontraron productos con estos filtros.</p>";
        return;
    }

    productsToRender.forEach((variant) => {
        const product = variant.product;
        
        // Ruta de imagen corregida para estar en /html/categoria.html
        const imageUrl = product.image_url ? `../${product.image_url}` : '../sources/img/logo_negro.png';

        const productCardHTML = `
            <div class="product-card">
                <button class="wishlist-btn" data-variant-id="${variant._id}" title="Añadir a lista de deseos">
                    <i class="far fa-heart"></i> </button>
                
                <div class="product-image" style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;">
                </div>
                
                <h3>${product.name.toUpperCase()} (${variant.size})</h3>
                <p>$${product.base_price.toFixed(2)} MXN</p>
                
                <button class="product-btn" data-variant-id="${variant._id}">
                    AGREGAR AL CARRITO
                </button>
            </div>
        `;
        productGrid.innerHTML += productCardHTML;
    });

    // --- ¡CAMBIO IMPORTANTE! ---
    // Llamamos a las NUEVAS funciones renombradas
    initializeCatProductButtons();
    initializeCatWishlistButtons();
}


// --- (Funciones de botones RENOMBRADAS) ---

// Renombrada de initializeProductButtons -> initializeCatProductButtons
function initializeCatProductButtons() {
    document.querySelectorAll(".product-grid .product-btn").forEach((button) => {
        // Previene que se añadan múltiples listeners
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
                        window.location.href = "login.html"; // Ruta relativa desde /html/
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

// Renombrada de initializeWishlistButtons -> initializeCatWishlistButtons
function initializeCatWishlistButtons() {
    document.querySelectorAll(".product-grid .wishlist-btn").forEach((button) => {
        if (button.dataset.listenerAttached) return;
        button.dataset.listenerAttached = true;
        
        button.addEventListener("click", async function () {
            const variantId = this.dataset.variantId;
            // Llamamos a la nueva función renombrada
            await addToWishlistCat(variantId, this);
        });
    });
}

// Renombrada de addToWishlist -> addToWishlistCat
async function addToWishlistCat(variantId, button) {
    try {
        const response = await fetch("http://localhost:8080/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ variantId }),
        });

        if (response.ok) {
            button.innerHTML = '<i class="fas fa-heart"></i>';
            button.title = "Añadido a lista de deseos";
        } else if (response.status === 401 || response.status === 403) {
            alert("Debes iniciar sesión para añadir a tu lista de deseos.");
            window.location.href = "login.html"; // Ruta relativa desde /html/
        } else if (response.status === 400) {
            // El producto ya está en la lista (error 400 'amigable')
            button.innerHTML = '<i class="fas fa-heart"></i>';
            button.title = "Ya está en tu lista";
        } else {
            throw new Error("Error al añadir a la lista de deseos");
        }
    } catch (error) {
        console.error("Error en addToWishlistCat:", error);
    }
}