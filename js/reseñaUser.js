document.addEventListener("DOMContentLoaded", () => {
    loadUserDataAndProducts();
    setupEventListeners();
});

let selectedProduct = null;
let selectedRating = 0;
let selectedSize = '';

async function loadUserDataAndProducts() {
    const loadingMsg = document.getElementById("loading-message");
    const loginRequiredMsg = document.getElementById("login-required-message");
    const noProductsMsg = document.getElementById("no-products-message");
    const productSelectionStep = document.getElementById("product-selection-step");
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
        
        // MOSTRAR NOMBRE EN EL HEADER
        userHeaderInfo.style.display = "flex";
        headerUsername.textContent = userData.username || 'Cliente';

        // SEGUNDO: Obtener productos comprados
        const productsResponse = await fetch("http://localhost:8080/orders/user/purchased-products", {
            method: "GET",
            credentials: "include",
        });

        if (!productsResponse.ok) {
            throw new Error("Error del servidor al cargar productos");
        }

        const products = await productsResponse.json();
        loadingMsg.style.display = "none";

        if (products.length === 0) {
            noProductsMsg.style.display = "block";
            return;
        }

        // Mostrar productos para reseñar
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

function setupEventListeners() {
    // Event listeners para estrellas de rating
    document.querySelectorAll('.rating-star').forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.rating);
            updateRatingStars();
            document.getElementById('rating-value').value = selectedRating;
        });
    });

    // Event listeners para tallas
    document.querySelectorAll('.size-option').forEach(option => {
        option.addEventListener('click', () => {
            selectedSize = option.dataset.size;
            updateSizeSelection();
            document.getElementById('size-value').value = selectedSize;
        });
    });

    // Contador de caracteres
    document.getElementById('comment').addEventListener('input', (e) => {
        document.getElementById('char-count').textContent = e.target.value.length;
    });

    // Form submit
    document.getElementById('review-form').addEventListener('submit', submitReview);
}

function displayProducts(products) {
    const productsGrid = document.getElementById("products-grid");
    
    products.forEach((product, index) => {
        const productHTML = createProductHTML(product, index);
        productsGrid.innerHTML += productHTML;
    });

    // Agregar event listeners a las tarjetas de producto
    document.querySelectorAll('.product-card-review').forEach(card => {
        card.addEventListener('click', () => selectProduct(card));
    });
}

function createProductHTML(product, index) {
    const purchaseDate = new Date(product.purchaseDate).toLocaleDateString("es-ES");
    const imageUrl = product.imageUrl ? `../${product.imageUrl}` : '../sources/img/logo_negro.png';

    return `
        <div class="product-card-review" data-product-id="${product.id}" style="animation-delay: ${index * 0.1}s">
            <div class="product-image" style="background-image: url('${imageUrl}')"></div>
            <div class="product-info">
                <h4>${product.name}</h4>
                <div class="product-meta">
                    <p><strong>Categoría:</strong> ${product.category}</p>
                    <p><strong>Comprado el:</strong> ${purchaseDate}</p>
                    <p><strong>Talla:</strong> ${product.size || 'No especificada'}</p>
                </div>
                <div class="product-price">$${product.price.toFixed(2)} MXN</div>
            </div>
        </div>
    `;
}

function selectProduct(card) {
    // Remover selección anterior
    document.querySelectorAll('.product-card-review').forEach(c => {
        c.classList.remove('selected');
    });

    // Agregar selección actual
    card.classList.add('selected');

    const productId = card.dataset.productId;
    const productName = card.querySelector('h4').textContent;

    selectedProduct = {
        id: productId,
        name: productName
    };

    // Mostrar formulario de reseña
    document.getElementById('product-selection-step').style.display = 'none';
    document.getElementById('review-form-step').style.display = 'block';
    document.getElementById('selected-product-name').textContent = productName;
    document.getElementById('selected-product-id').value = productId;
}

function goBackToProducts() {
    document.getElementById('review-form-step').style.display = 'none';
    document.getElementById('product-selection-step').style.display = 'block';
    
    // Resetear formulario
    resetForm();
}

function resetForm() {
    selectedRating = 0;
    selectedSize = '';
    document.getElementById('rating-value').value = '';
    document.getElementById('size-value').value = '';
    document.getElementById('comment').value = '';
    document.getElementById('char-count').textContent = '0';
    
    updateRatingStars();
    updateSizeSelection();
}

function updateRatingStars() {
    document.querySelectorAll('.rating-star').forEach((star, index) => {
        const rating = index + 1;
        if (rating <= selectedRating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function updateSizeSelection() {
    document.querySelectorAll('.size-option').forEach(option => {
        if (option.dataset.size === selectedSize) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

async function submitReview(event) {
    event.preventDefault();

    if (!selectedProduct) {
        alert('Por favor selecciona un producto');
        return;
    }

    if (selectedRating === 0) {
        alert('Por favor selecciona una calificación');
        return;
    }

    if (!selectedSize) {
        alert('Por favor selecciona una talla');
        return;
    }

    const comment = document.getElementById('comment').value;
    if (!comment.trim()) {
        alert('Por favor escribe un comentario');
        return;
    }

    const formData = {
        product: selectedProduct.id,
        rating: selectedRating,
        comment: comment,
        size: selectedSize
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
            alert('¡Reseña creada exitosamente!');
            window.location.href = 'misreseñas.html';
        } else {
            alert('Error al crear reseña: ' + result.error);
        }

    } catch (error) {
        console.error("Error al crear reseña:", error);
        alert('Error al crear reseña. Intenta de nuevo.');
    }
}

// Función para mostrar notificaciones (opcional)
function showNotification(message, type = 'info') {
    // Puedes implementar un sistema de notificaciones bonito aquí
    // Por ahora usamos alert simple
    if (type === 'error') {
        alert('❌ ' + message);
    } else if (type === 'warning') {
        alert('⚠️ ' + message);
    } else {
        alert('ℹ️ ' + message);
    }
}

// Función para validar formulario antes de enviar
function validateForm() {
    const errors = [];
    
    if (!selectedProduct) {
        errors.push('Debes seleccionar un producto');
    }
    
    if (selectedRating === 0) {
        errors.push('Debes seleccionar una calificación');
    }
    
    if (!selectedSize) {
        errors.push('Debes seleccionar una talla');
    }
    
    const comment = document.getElementById('comment').value;
    if (!comment.trim()) {
        errors.push('Debes escribir un comentario');
    } else if (comment.trim().length < 10) {
        errors.push('El comentario debe tener al menos 10 caracteres');
    }
    
    return errors;
}