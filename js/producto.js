// js/producto.js

document.addEventListener("DOMContentLoaded", () => {
    // 1. Leer el ID de la variante desde la URL
    const params = new URLSearchParams(window.location.search);
    const variantId = params.get('id');

    const addToCartBtn = document.getElementById('add-to-cart-btn');

    if (variantId) {
        // 2. Cargar los detalles del producto
        loadProductDetails(variantId);

        // 3. Configurar el botón de "Agregar al Carrito"
        addToCartBtn.addEventListener('click', async () => {
            const quantity = parseInt(document.getElementById('quantity-input').value);
            
            // Lógica visual del botón
            addToCartBtn.textContent = 'AGREGANDO...';
            addToCartBtn.classList.add('loading');
            addToCartBtn.disabled = true;

            try {
                // Llamada a la API (idéntica a la de categoria.js)
                const response = await fetch("http://localhost:8080/cart/items", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ variantId: variantId, quantity: quantity }),
                });

                if (response.ok) {
                    addToCartBtn.textContent = 'AGREGADO ✓';
                    addToCartBtn.classList.remove('loading');
                    addToCartBtn.classList.add('success');
                } else {
                    if (response.status === 401 || response.status === 403) {
                        alert("Debes iniciar sesión para agregar productos.");
                        window.location.href = "login.html"; 
                    }
                    throw new Error("Error al agregar");
                }
            } catch (error) {
                addToCartBtn.textContent = "ERROR AL AGREGAR";
                addToCartBtn.classList.remove('loading');
            } finally {
                setTimeout(() => {
                    addToCartBtn.textContent = 'AGREGAR AL CARRITO';
                    addToCartBtn.classList.remove('success');
                    addToCartBtn.disabled = false;
                }, 2000);
            }
        });

    } else {
        // No se encontró ID
        document.getElementById('product-name').textContent = "Producto no encontrado";
    }
});

async function loadProductDetails(variantId) {
    try {
        // 4. Llamamos al endpoint de la API que busca por ID
        // (Este endpoint ya existe en tu productRoutes.js)
        const response = await fetch(`http://localhost:8080/products/${variantId}`);
        
        if (!response.ok) {
            throw new Error('Producto no encontrado');
        }

        const variant = await response.json();
        const product = variant.product;

        // 5. Llenamos el HTML con los datos
        document.getElementById('product-main-image').src = `../${product.image_url}`;
        document.getElementById('product-main-image').alt = product.name;
        document.getElementById('product-name').textContent = product.name;
        document.getElementById('product-price').textContent = `$${product.base_price.toFixed(2)} MXN`;
        document.getElementById('product-size').textContent = variant.size;
        document.getElementById('product-description').textContent = product.description || "Este producto no tiene descripción.";
        
        // Actualizamos el 'max' del input de cantidad según el stock
        document.getElementById('quantity-input').max = variant.stock;

    } catch (error) {
        console.error('Error al cargar el producto:', error);
        document.getElementById('product-name').textContent = "Error al cargar";
        document.getElementById('product-description').textContent = error.message;
    }
}


// Función para cargar reseñas del producto
async function loadProductReviews(productId) {
    try {
        const response = await fetch(`http://localhost:8080/reviews/product/${productId}`);
        
        if (!response.ok) {
            throw new Error('Error al cargar reseñas');
        }

        const reviews = await response.json();
        displayProductReviews(reviews);
        
    } catch (error) {
        console.error('Error al cargar reseñas:', error);
        document.getElementById('reviews-list').innerHTML = '<p>Error al cargar reseñas</p>';
    }
}

// Función para mostrar las reseñas
function displayProductReviews(reviews) {
    const reviewsList = document.getElementById('reviews-list');
    const noReviewsMsg = document.getElementById('no-reviews-message');
    const averageRating = document.getElementById('average-rating');
    const reviewCount = document.getElementById('review-count');
    const averageStars = document.getElementById('average-stars');
    
    // Calcular promedio
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : '0.0';
    
    // Actualizar estadísticas
    averageRating.textContent = avgRating;
    reviewCount.textContent = `(${reviews.length} reseña${reviews.length !== 1 ? 's' : ''})`;
    
    // Mostrar estrellas del promedio
    averageStars.innerHTML = createStarsHTML(parseFloat(avgRating));
    
    if (reviews.length === 0) {
        reviewsList.style.display = 'none';
        noReviewsMsg.style.display = 'block';
        return;
    }
    
    noReviewsMsg.style.display = 'none';
    reviewsList.innerHTML = '';
    
    reviews.forEach(review => {
        const reviewHTML = createReviewHTML(review);
        reviewsList.innerHTML += reviewHTML;
    });
}

// Función para crear HTML de una reseña
function createReviewHTML(review) {
    const reviewDate = new Date(review.createdAt).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long", 
        year: "numeric"
    });
    
    const starsHTML = createStarsHTML(review.rating);
    const userName = review.user?.username || 'Cliente';
    
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

// Función para crear estrellas
function createStarsHTML(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// Función para cargar detalles del producto (ACTUALIZADA)
async function loadProductDetails(variantId) {
    try {
        const response = await fetch(`http://localhost:8080/products/${variantId}`);
        
        if (!response.ok) {
            throw new Error('Producto no encontrado');
        }

        const variant = await response.json();
        const product = variant.product;

        // Llenar datos del producto
        document.getElementById('product-main-image').src = `../${product.image_url}`;
        document.getElementById('product-main-image').alt = product.name;
        document.getElementById('product-name').textContent = product.name;
        document.getElementById('product-price').textContent = `$${product.base_price.toFixed(2)} MXN`;
        document.getElementById('product-size').textContent = variant.size;
        document.getElementById('product-description').textContent = product.description || "Este producto no tiene descripción.";
        document.getElementById('quantity-input').max = variant.stock;

        // CARGAR RESEÑAS DEL PRODUCTO
        loadProductReviews(product._id);

    } catch (error) {
        console.error('Error al cargar el producto:', error);
        document.getElementById('product-name').textContent = "Error al cargar";
        document.getElementById('product-description').textContent = error.message;
    }
}

// Event listener para el botón de ver reseñas
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const variantId = params.get('id');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const viewReviewsBtn = document.getElementById('view-reviews-btn');

    if (variantId) {
        loadProductDetails(variantId);

        // Botón agregar al carrito (código existente)
        addToCartBtn.addEventListener('click', async () => {
            // ... tu código existente ...
        });

        // Botón ver reseñas (NUEVO)
        viewReviewsBtn.addEventListener('click', () => {
            const reviewsContainer = document.getElementById('reviews-container');
            if (reviewsContainer.style.display === 'none') {
                reviewsContainer.style.display = 'block';
                viewReviewsBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Ocultar Reseñas';
            } else {
                reviewsContainer.style.display = 'none';
                viewReviewsBtn.innerHTML = '<i class="fas fa-comments"></i> Ver Reseñas';
            }
        });
    }
});