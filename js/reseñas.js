let currentProductId = null;
let currentUser = null;
let purchasedProducts = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('Reviews JS cargado');
    
    // SIEMPRE actualizar el usuario en el header primero
    updateUserInHeader();
    
    // Inicializar según la página
    if (window.location.pathname.includes('reseñaUser.html')) {
        initializeReviewPage();
    } else if (window.location.pathname.includes('misreseñas.html')) {
        initializeMyReviewsPage();
    }
});

// FUNCIÓN PRINCIPAL PARA ACTUALIZAR USUARIO EN HEADER
async function updateUserInHeader() {
    try {
        const userInfo = await getUserInfoMe();
        
        const userElement = document.getElementById('headerUserInfo');
        const usernameElement = document.getElementById('headerUsername');
        
        if (userInfo && userInfo.username) {
            currentUser = userInfo;
            
            if (userElement && usernameElement) {
                usernameElement.textContent = userInfo.username;
                userElement.style.display = 'flex';
                console.log("✅ Usuario actualizado en header:", userInfo.username);
            }
            
            return userInfo;
        } else {
            // Ocultar el elemento si no hay sesión
            if (userElement) {
                userElement.style.display = 'none';
            }
            console.log("⚠️ No hay sesión activa");
            return null;
        }
    } catch (error) {
        console.error("❌ Error actualizando usuario en header:", error);
        const userElement = document.getElementById('headerUserInfo');
        if (userElement) {
            userElement.style.display = 'none';
        }
        return null;
    }
}

// FUNCIÓN PARA OBTENER INFO DEL USUARIO
async function getUserInfoMe() {
    try {
        const response = await fetch("http://localhost:8080/users/me", {
            method: "GET",
            credentials: "include"
        });

        if (response.ok) {
            const userData = await response.json();
            console.log("✅ Datos del usuario recibidos:", userData);
            return userData;
        } else {
            console.warn("⚠️ No autorizado - Sesión expirada o no existe");
            return null;
        }
    } catch (error) {
        console.error("❌ Error en /users/me:", error);
        return null;
    }
}

// FUNCIONES PARA RESEÑAUSER.HTML - PRODUCTOS COMPRADOS

async function initializeReviewPage() {
    try {
        const userInfo = await updateUserInHeader();
        
        if (userInfo) {
            console.log("✅ Sesión activa:", userInfo.username);
            
            // Mostrar información de sesión en el contenido
            displayUserSessionInfo(userInfo);
            
            // Cargar productos comprados
            await loadPurchasedProducts();
            
            // Configurar el resto de la funcionalidad
            setupStarRatings();
            setupCharacterCounters();
            setupFileUpload();
            setupFormSubmission();
        } else {
            showLoginPrompt();
            return;
        }
    } catch (error) {
        console.error("❌ Error inicializando página de reseña:", error);
    }
}

function displayUserSessionInfo(userData) {
    const sessionInfo = document.getElementById('userSessionInfo');
    if (sessionInfo && userData.username) {
        sessionInfo.style.display = 'block';
        sessionInfo.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                margin-bottom: 20px;
                text-align: center;
                font-weight: bold;
                box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
                border: 2px solid #388E3C;
            ">
                <i class="fas fa-check-circle" style="margin-right: 8px;"></i> 
                Sesión activa: <span style="color: #FFEB3B;">${userData.username}</span>
                <span style="font-weight: normal; margin-left: 15px; font-size: 0.9em;">
                    <i class="fas fa-shield-alt"></i> ${userData.role?.name || 'Usuario'}
                </span>
            </div>
        `;
    }
}

// Función para cargar productos comprados
async function loadPurchasedProducts() {
    try {
        console.log('Cargando productos comprados...');
        
        // Llamar a tu API para obtener productos comprados
        const response = await fetch('http://localhost:8080/api/user/purchased-products', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const products = await response.json();
            purchasedProducts = products;
            displayPurchasedProducts(products);
        } else if (response.status === 401) {
            showLoginPrompt();
        } else {
            throw new Error('Error al cargar productos comprados');
        }
    } catch (error) {
        console.error('Error cargando productos comprados:', error);
        // Para desarrollo, usar datos de ejemplo
        loadMockPurchasedProducts();
    }
}

// Función para mostrar productos comprados
function displayPurchasedProducts(products) {
    const productsGrid = document.getElementById('purchasedProductsGrid');
    const noPurchasesMessage = document.getElementById('noPurchasesMessage');

    if (!products || products.length === 0) {
        productsGrid.style.display = 'none';
        noPurchasesMessage.style.display = 'block';
        return;
    }

    productsGrid.style.display = 'grid';
    noPurchasesMessage.style.display = 'none';

    // Generar HTML para cada producto
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-card-image">
                <img src="${product.imageUrl || '../sources/img/placeholder.jpg'}" alt="${product.name}" 
                     onerror="this.src='../sources/img/placeholder.jpg'">
                <div class="product-card-overlay">
                    <button class="select-product-btn" onclick="selectProductForReview('${product.id}')">
                        <i class="fas fa-edit"></i> Reseñar este Producto
                    </button>
                </div>
            </div>
            <div class="product-card-info">
                <h3>${product.name}</h3>
                <p class="product-card-category">${product.category || 'Categoría no disponible'}</p>
                <p class="product-card-price">$${(product.price || 0).toFixed(2)} MXN</p>
                <p class="product-card-purchase-date">Comprado el: ${formatDate(product.purchaseDate || new Date())}</p>
                ${product.size ? `<p class="product-card-details">Talla: ${product.size}</p>` : ''}
                ${product.color ? `<p class="product-card-details">Color: ${product.color}</p>` : ''}
            </div>
        </div>
    `).join('');
}

// Función para seleccionar un producto para reseñar
function selectProductForReview(productId) {
    const product = purchasedProducts.find(p => p.id === productId);
    
    if (product) {
        currentProductId = productId;
        showReviewForm();
        updateSelectedProductInfo(product);
        prefillUserInfo();
    } else {
        console.error('Producto no encontrado:', productId);
        showError('Error al cargar el producto seleccionado');
    }
}

// Función para mostrar el formulario de reseña
function showReviewForm() {
    document.getElementById('productSelectionSection').style.display = 'none';
    document.getElementById('reviewFormSection').style.display = 'block';
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Función para volver a la selección de productos
function showProductSelection() {
    document.getElementById('reviewFormSection').style.display = 'none';
    document.getElementById('productSelectionSection').style.display = 'block';
    resetForm();
    currentProductId = null;
}

// Función para actualizar la información del producto seleccionado
function updateSelectedProductInfo(product) {
    document.getElementById('selectedProductImage').src = product.imageUrl || '../sources/img/placeholder.jpg';
    document.getElementById('selectedProductImage').alt = product.name;
    document.getElementById('selectedProductName').textContent = product.name;
    document.getElementById('selectedProductCategory').textContent = 
        `${product.category || 'Categoría'} • ${product.collection || 'Colección'}`;
    document.getElementById('selectedProductPrice').textContent = 
        `$${(product.price || 0).toFixed(2)} MXN`;
    document.getElementById('selectedPurchaseDateValue').textContent = 
        formatDate(product.purchaseDate || new Date());
    
    // Actualizar campo oculto del producto
    document.getElementById('productId').value = product.id;
}

// Función para prellenar información del usuario
function prefillUserInfo() {
    if (currentUser) {
        const reviewerName = document.getElementById('reviewerName');
        if (reviewerName && !reviewerName.value) {
            reviewerName.value = currentUser.displayName || currentUser.username || '';
        }
        
        const reviewerLocation = document.getElementById('reviewerLocation');
        if (reviewerLocation && currentUser.location && !reviewerLocation.value) {
            reviewerLocation.value = currentUser.location;
        }
    }
}

// Función para resetear el formulario
function resetForm() {
    const form = document.getElementById('reviewForm');
    if (form) {
        form.reset();
    }
    
    const uploadedMedia = document.getElementById('uploadedMedia');
    if (uploadedMedia) {
        uploadedMedia.innerHTML = '';
    }
    
    // Resetear estrellas seleccionadas
    const starInputs = document.querySelectorAll('.star-rating input, .specific-stars input');
    starInputs.forEach(input => input.checked = false);
    
    // Resetear contadores de caracteres
    document.querySelectorAll('.char-count').forEach(span => {
        span.textContent = '0/' + (span.previousElementSibling.tagName === 'INPUT' ? '60' : '500') + ' caracteres';
    });
    
    // Resetear texto de calificación
    const ratingText = document.querySelector('.rating-text-selected');
    if (ratingText) {
        ratingText.textContent = 'Selecciona una calificación';
        ratingText.style.color = '';
    }
}

// Función para cancelar reseña
function cancelReview() {
    if (confirm('¿Estás seguro de que quieres cancelar? Se perderán los datos no guardados.')) {
        showProductSelection();
    }
}

// Función para mostrar prompt de login
function showLoginPrompt() {
    const productsGrid = document.getElementById('purchasedProductsGrid');
    const noPurchasesMessage = document.getElementById('noPurchasesMessage');
    
    productsGrid.style.display = 'none';
    noPurchasesMessage.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-user-lock fa-3x"></i>
            <h3>Inicia sesión para ver tus productos</h3>
            <p>Necesitas iniciar sesión para poder dejar reseñas de tus compras.</p>
            <a href="/html/login.html" class="btn-primary">Iniciar Sesión</a>
        </div>
    `;
    noPurchasesMessage.style.display = 'block';
}

// Función para formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('es-MX', options);
}

// Datos de ejemplo para desarrollo
function loadMockPurchasedProducts() {
    const mockProducts = [
        {
            id: 'prod-001',
            name: 'HOODIE BLACK SHADOW',
            category: 'Hoodies',
            collection: 'Colección Hombre',
            price: 899.00,
            imageUrl: '../sources/img/hoodie.jpg',
            purchaseDate: '2024-11-15',
            size: 'M',
            color: 'Negro'
        },
        {
            id: 'prod-002',
            name: 'T-SHIRT WHITE BASIC',
            category: 'Playeras',
            collection: 'Colección Unisex',
            price: 299.00,
            imageUrl: '../sources/img/tshirt.jpg',
            purchaseDate: '2024-11-10',
            size: 'L',
            color: 'Blanco'
        },
        {
            id: 'prod-003',
            name: 'JEANS DARK BLUE',
            category: 'Pantalones',
            collection: 'Colección Hombre',
            price: 1299.00,
            imageUrl: '../sources/img/jeans.jpg',
            purchaseDate: '2024-11-05',
            size: '32',
            color: 'Azul Oscuro'
        }
    ];

    purchasedProducts = mockProducts;
    displayPurchasedProducts(mockProducts);
}

// FUNCIONES EXISTENTES DEL FORMULARIO

function setupStarRatings() {
    // Calificación principal
    const starInputs = document.querySelectorAll('.star-rating input');
    const ratingText = document.querySelector('.rating-text-selected');
    
    starInputs.forEach(star => {
        star.addEventListener('change', function() {
            const rating = this.value;
            let ratingMessage = '';
            
            switch(rating) {
                case '5':
                    ratingMessage = 'Excelente - ¡Me encanta!';
                    break;
                case '4':
                    ratingMessage = 'Muy bueno - Me gusta';
                    break;
                case '3':
                    ratingMessage = 'Bueno - Está bien';
                    break;
                case '2':
                    ratingMessage = 'Regular - Podría mejorar';
                    break;
                case '1':
                    ratingMessage = 'Malo - No lo recomiendo';
                    break;
                default:
                    ratingMessage = 'Selecciona una calificación';
            }
            
            if (ratingText) {
                ratingText.textContent = ratingMessage;
                ratingText.style.color = '#ffd700';
            }
        });
    });

    // Calificaciones específicas
    const specificStars = document.querySelectorAll('.specific-stars input');
    specificStars.forEach(star => {
        star.addEventListener('change', function() {
            console.log('Calificación específica:', this.name, this.value);
        });
    });
}

function setupCharacterCounters() {
    const titleInput = document.getElementById('reviewTitle');
    const commentInput = document.getElementById('reviewComment');

    if (titleInput) {
        const titleCount = titleInput.nextElementSibling;
        titleInput.addEventListener('input', function() {
            const count = this.value.length;
            if (titleCount) {
                titleCount.textContent = `${count}/60 caracteres`;
                
                if (count > 60) {
                    titleCount.style.color = '#ff4444';
                } else if (count > 50) {
                    titleCount.style.color = '#ffa500';
                } else {
                    titleCount.style.color = '#888';
                }
            }
        });
    }

    if (commentInput) {
        const commentCount = commentInput.nextElementSibling;
        commentInput.addEventListener('input', function() {
            const count = this.value.length;
            if (commentCount) {
                commentCount.textContent = `${count}/500 caracteres`;
                
                if (count > 500) {
                    commentCount.style.color = '#ff4444';
                } else if (count > 400) {
                    commentCount.style.color = '#ffa500';
                } else {
                    commentCount.style.color = '#888';
                }
            }
        });
    }
}

function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('mediaUpload');
    const uploadedMedia = document.getElementById('uploadedMedia');

    if (!uploadArea || !fileInput) return;

    // Click en el área de upload
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = '#ffd700';
        this.style.background = 'rgba(255,215,0,0.1)';
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.style.borderColor = '#444';
        this.style.background = 'rgba(255,255,255,0.02)';
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = '#444';
        this.style.background = 'rgba(255,255,255,0.02)';
        
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    // Cambio en el input de archivo
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const mediaElement = document.createElement('div');
                    mediaElement.className = 'media-preview';
                    
                    if (file.type.startsWith('image/')) {
                        mediaElement.innerHTML = `
                            <img src="${e.target.result}" alt="Preview">
                            <button type="button" class="remove-media" onclick="removeMedia(this)">
                                <i class="fas fa-times"></i>
                            </button>
                        `;
                    } else {
                        mediaElement.innerHTML = `
                            <video controls>
                                <source src="${e.target.result}" type="${file.type}">
                            </video>
                            <button type="button" class="remove-media" onclick="removeMedia(this)">
                                <i class="fas fa-times"></i>
                            </button>
                        `;
                    }
                    
                    if (uploadedMedia) {
                        uploadedMedia.appendChild(mediaElement);
                    }
                };
                
                reader.readAsDataURL(file);
            } else {
                alert('Por favor, sube solo imágenes o videos.');
            }
        });
    }
}

// Función global para remover medios
function removeMedia(button) {
    button.closest('.media-preview').remove();
}

function setupFormSubmission() {
    const form = document.getElementById('reviewForm');
    if (!form) return;

    const submitBtn = form.querySelector('.submit-review-btn');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // VERIFICAR QUE HAY USUARIO LOGUEADO
        if (!currentUser) {
            alert('Debes iniciar sesión para publicar una reseña');
            window.location.href = 'login.html';
            return;
        }

        // VERIFICAR QUE HAY PRODUCTO SELECCIONADO
        if (!currentProductId) {
            alert('Error: No se ha seleccionado ningún producto. Por favor, selecciona un producto primero.');
            showProductSelection();
            return;
        }

        if (!validateForm()) {
            return;
        }

        // Deshabilitar botón
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';

        try {
            // Recopilar datos del formulario
            const formData = {
                product: currentProductId,
                rating: parseInt(form.querySelector('input[name="rating"]:checked').value),
                title: form.querySelector('#reviewTitle').value.trim(),
                comment: form.querySelector('#reviewComment').value.trim(),
                quality_rating: form.querySelector('input[name="quality"]:checked') ? parseInt(form.querySelector('input[name="quality"]:checked').value) : 0,
                comfort_rating: form.querySelector('input[name="comfort"]:checked') ? parseInt(form.querySelector('input[name="comfort"]:checked').value) : 0,
                value_rating: form.querySelector('input[name="value"]:checked') ? parseInt(form.querySelector('input[name="value"]:checked').value) : 0,
                reviewer_name: form.querySelector('#reviewerName').value.trim(),
                reviewer_location: form.querySelector('#reviewerLocation').value.trim(),
                media: []
            };

            console.log('Enviando reseña para producto:', currentProductId, formData);

            // Enviar al backend
            const response = await fetch('http://localhost:8080/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                alert('¡Reseña publicada con éxito!');
                window.location.href = 'misreseñas.html';
            } else {
                throw new Error(result.message || 'Error al publicar reseña');
            }

        } catch (error) {
            console.error('Error:', error);
            alert('Error: ' + error.message);
        } finally {
            // Rehabilitar botón
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publicar Reseña';
        }
    });

    function validateForm() {
        const rating = form.querySelector('input[name="rating"]:checked');
        const title = form.querySelector('#reviewTitle').value.trim();
        const comment = form.querySelector('#reviewComment').value.trim();
        const name = form.querySelector('#reviewerName').value.trim();

        if (!rating) {
            alert('Por favor, selecciona una calificación con estrellas.');
            return false;
        }

        if (!title) {
            alert('Por favor, escribe un título para tu reseña.');
            return false;
        }

        if (title.length > 60) {
            alert('El título no puede tener más de 60 caracteres.');
            return false;
        }

        if (!comment) {
            alert('Por favor, escribe tu reseña.');
            return false;
        }

        if (comment.length > 500) {
            alert('La reseña no puede tener más de 500 caracteres.');
            return false;
        }

        if (!name) {
            alert('Por favor, ingresa tu nombre público.');
            return false;
        }

        return true;
    }
}

// FUNCIONES PARA MISRESEÑAS.HTML

async function initializeMyReviewsPage() {
    try {
        const userInfo = await updateUserInHeader();
        
        if (userInfo) {
            console.log("✅ Sesión activa:", userInfo.username);
            await loadUserReviews();
        } else {
            displayNoSessionMessage();
        }
    } catch (error) {
        console.error("❌ Error inicializando mis reseñas:", error);
    }
}

function displayNoSessionMessage() {
    const reviewsList = document.getElementById('reviewsList');
    if (reviewsList) {
        reviewsList.innerHTML = `
            <div class="auth-required" style="text-align: center; padding: 40px 20px;">
                <i class="fas fa-exclamation-circle" style="font-size: 3em; color: #ff6b6b; margin-bottom: 20px;"></i>
                <h2 style="color: #333; margin-bottom: 15px;">Debes iniciar sesión</h2>
                <p style="color: #666; margin-bottom: 25px; font-size: 1.1em;">
                    Para ver y gestionar tus reseñas, necesitas iniciar sesión en tu cuenta.
                </p>
                <a href="login.html" class="cta-button" style="
                    background: #4CAF50;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: bold;
                    display: inline-block;
                    transition: background 0.3s;
                " onmouseover="this.style.background='#45a049'" onmouseout="this.style.background='#4CAF50'">
                    <i class="fas fa-sign-in-alt"></i> INICIAR SESIÓN
                </a>
            </div>
        `;
    }
}

async function loadUserReviews() {
    if (!currentUser) {
        return;
    }

    const reviewsList = document.getElementById('reviewsList');
    
    try {
        const response = await fetch('http://localhost:8080/reviews/user/my-reviews', {
            credentials: "include"
        });

        if (response.ok) {
            const reviews = await response.json();
            displayReviews(reviews);
        } else if (response.status === 401) {
            console.log('Sesión expirada');
            displayNoSessionMessage();
        } else {
            throw new Error('Error al cargar reseñas');
        }
    } catch (error) {
        console.error('Error:', error);
        if (reviewsList) {
            reviewsList.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Error al cargar las reseñas</h2>
                    <p>${error.message}</p>
                    <button onclick="loadUserReviews()" class="cta-button">Reintentar</button>
                </div>
            `;
        }
    }
}

function displayReviews(reviews) {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;
    
    if (!reviews || reviews.length === 0) {
        reviewsList.innerHTML = `
            <div class="empty-reviews" style="text-align: center; padding: 60px 20px;">
                <i class="far fa-star" style="font-size: 4em; color: #ccc; margin-bottom: 20px;"></i>
                <h2 style="color: #333; margin-bottom: 15px;">Aún no has escrito ninguna reseña</h2>
                <p style="color: #666; margin-bottom: 30px; font-size: 1.1em; max-width: 500px; margin-left: auto; margin-right: auto;">
                    Comparte tu experiencia con otros clientes sobre los productos que has comprado. 
                    Tu opinión ayuda a la comunidad a tomar mejores decisiones.
                </p>
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <a href="../index.html" class="cta-button" style="
                        background: #4CAF50;
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        display: inline-block;
                        transition: background 0.3s;
                    " onmouseover="this.style.background='#45a049'" onmouseout="this.style.background='#4CAF50'">
                        <i class="fas fa-shopping-bag"></i> IR DE COMPRAS
                    </a>
                    <a href="main.html" class="cta-button" style="
                        background: #2196F3;
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        display: inline-block;
                        transition: background 0.3s;
                    " onmouseover="this.style.background='#1976D2'" onmouseout="this.style.background='#2196F3'">
                        <i class="fas fa-th-large"></i> VER PRODUCTOS
                    </a>
                </div>
            </div>
        `;
        return;
    }

    reviewsList.innerHTML = reviews.map(review => `
        <div class="review-item" data-review-id="${review._id}">
            <div class="review-header">
                <div class="review-product">
                    <h3>${review.product?.name || 'Producto no disponible'}</h3>
                    <span class="review-date">${new Date(review.createdAt).toLocaleDateString('es-MX', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</span>
                </div>
                <div class="review-rating">
                    ${generateStars(review.rating)}
                    <span class="rating-number">${review.rating}.0</span>
                </div>
            </div>
            
            <div class="review-content">
                <h4>${review.title}</h4>
                <p>${review.comment}</p>
            </div>

            ${review.quality_rating > 0 || review.comfort_rating > 0 || review.value_rating > 0 ? `
            <div class="specific-ratings-display">
                ${review.quality_rating > 0 ? `
                <div class="specific-rating">
                    <span>Calidad:</span>
                    ${generateStars(review.quality_rating)}
                </div>
                ` : ''}
                ${review.comfort_rating > 0 ? `
                <div class="specific-rating">
                    <span>Comodidad:</span>
                    ${generateStars(review.comfort_rating)}
                </div>
                ` : ''}
                ${review.value_rating > 0 ? `
                <div class="specific-rating">
                    <span>Precio-Calidad:</span>
                    ${generateStars(review.value_rating)}
                </div>
                ` : ''}
            </div>
            ` : ''}

            <div class="review-actions">
                <button class="edit-btn" onclick="editReview('${review._id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="delete-btn" onclick="deleteReview('${review._id}')">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// FUNCIONES DE GESTIÓN DE RESEÑAS

function editReview(reviewId) {
    if (confirm('¿Quieres editar esta reseña?')) {
        alert('Funcionalidad de edición en desarrollo');
    }
}

async function deleteReview(reviewId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta reseña?')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/reviews/${reviewId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            alert('Reseña eliminada exitosamente');
            // Recargar la lista de reseñas
            if (window.location.pathname.includes('misreseñas.html')) {
                loadUserReviews();
            }
        } else {
            const result = await response.json();
            throw new Error(result.message || 'Error al eliminar reseña');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    }
}

// Función auxiliar para mostrar errores
function showError(message) {
    alert(message);
    console.error(message);
}