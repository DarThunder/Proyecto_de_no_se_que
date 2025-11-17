document.addEventListener("DOMContentLoaded", () => {
    loadUserReviews();
});

async function loadUserReviews() {
    const container = document.getElementById("reviews-list");
    const loadingMsg = document.getElementById("loading-message");
    const loginRequiredMsg = document.getElementById("login-required-message");
    const emptyMsg = document.getElementById("empty-reviews-message");
    const userHeaderInfo = document.getElementById("user-header-info");
    const headerUsername = document.getElementById("header-username");

    try {
        // Obtener datos del usuario
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

        // Obtener las reseñas
        const reviewsResponse = await fetch("http://localhost:8080/reviews/my-reviews", {
            method: "GET",
            credentials: "include",
        });

        if (!reviewsResponse.ok) {
            throw new Error("Error del servidor al cargar reseñas");
        }

        const reviews = await reviewsResponse.json();
        loadingMsg.style.display = "none";

        if (reviews.length === 0) {
            emptyMsg.style.display = "block";
            return;
        }

        // Mostrar lista de reseñas
        container.style.display = "block";
        reviews.forEach((review, index) => {
            const reviewHTML = createReviewHTML(review, index);
            container.innerHTML += reviewHTML;
        });

    } catch (error) {
        console.error("Error al cargar reseñas:", error);
        loadingMsg.style.display = "none";
        loginRequiredMsg.innerHTML = `
            <div class="login-icon"><i class="fas fa-exclamation-triangle"></i></div>
            <h2>Error al cargar</h2>
            <p>No se pudo conectar con el servidor. Intenta de nuevo más tarde.</p>`;
        loginRequiredMsg.style.display = "block";
    }
}

function createReviewHTML(review, index) {
    const reviewDate = new Date(review.createdAt).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    // Crear estrellas
    const starsHTML = createStarsHTML(review.rating);

    // Ruta de imagen corregida
    const imageUrl = review.product.image_url ? `../${review.product.image_url}` : '../sources/img/logo_negro.png';

    // OBTENER NOMBRE DEL USUARIO - AGREGAR ESTAS LÍNEAS
    const userName = review.user?.username || 'Cliente';

    return `
        <div class="review-card" style="animation-delay: ${index * 0.1}s">
            <div class="review-card-header">
                <div class="review-product-info">
                    <div class="review-product-img" style="background-image: url('${imageUrl}')"></div>
                    <div class="review-product-details">
                        <h4>${review.product.name}</h4>
                        <div class="review-product-meta">
                            <span><strong>Por:</strong> ${userName}</span>  <!-- AGREGAR ESTA LÍNEA -->
                            <span>Categoría: ${review.product.category}</span>
                            <span> • Talla: ${review.size}</span>
                        </div>
                    </div>
                </div>
                <div class="review-rating">
                    ${starsHTML}
                </div>
            </div>
            <div class="review-content">
                <p class="review-comment">${review.comment}</p>
            </div>
            <div class="review-meta">
                <span>Reseñado el ${reviewDate}</span>
                <div class="review-actions">
                    <button class="btn-edit" onclick="editReview('${review._id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-delete" onclick="deleteReview('${review._id}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        </div>
    `;
}

function createStarsHTML(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star star"></i>';
        } else {
            stars += '<i class="far fa-star star empty"></i>';
        }
    }
    return stars;
}

async function deleteReview(reviewId) {
    if (!confirm("¿Estás seguro de que quieres eliminar esta reseña?")) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/reviews/${reviewId}`, {
            method: "DELETE",
            credentials: "include",
        });

        if (response.ok) {
            alert("Reseña eliminada exitosamente");
            location.reload();
        } else {
            const error = await response.json();
            alert("Error al eliminar reseña: " + error.error);
        }
    } catch (error) {
        console.error("Error al eliminar reseña:", error);
        alert("Error al eliminar reseña");
    }
}

let editingReviewId = null;

function editReview(reviewId) {
    editingReviewId = reviewId;
    
    // Buscar la reseña en la lista actual
    const reviewCard = document.querySelector(`[onclick="editReview('${reviewId}')"]`).closest('.review-card');
    const currentRating = parseInt(reviewCard.querySelector('.review-rating .fa-star').length);
    const currentComment = reviewCard.querySelector('.review-comment').textContent;
    const currentSize = reviewCard.querySelector('.review-product-meta span:last-child').textContent.replace('Talla: ', '').trim();

    // Crear modal de edición
    createEditModal(currentRating, currentComment, currentSize);
}

function createEditModal(currentRating, currentComment, currentSize) {
    // Crear overlay del modal
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    // Crear contenido del modal
    modalOverlay.innerHTML = `
        <div class="edit-modal" style="
            background: #1a1a1a;
            padding: 2rem;
            border-radius: 10px;
            width: 90%;
            max-width: 500px;
            border: 2px solid #333;
        ">
            <h3 style="color: white; margin-bottom: 1.5rem; text-align: center;">
                <i class="fas fa-edit"></i> Editar Reseña
            </h3>
            
            <div class="form-group">
                <label style="color: white; display: block; margin-bottom: 0.5rem;">Calificación:</label>
                <div class="rating-selector" id="edit-rating-selector" style="margin-bottom: 1rem;">
                    ${Array.from({length: 5}, (_, i) => `
                        <i class="fas fa-star rating-star ${i < currentRating ? 'active' : ''}" 
                           data-rating="${i + 1}"
                           style="color: ${i < currentRating ? '#ffd700' : '#666'}; cursor: pointer; font-size: 1.5rem; margin: 0 0.2rem;">
                        </i>
                    `).join('')}
                </div>
                <input type="hidden" id="edit-rating-value" value="${currentRating}">
            </div>

            <div class="form-group">
                <label style="color: white; display: block; margin-bottom: 0.5rem;">Talla:</label>
                <div class="size-selector" id="edit-size-selector" style="margin-bottom: 1rem;">
                    ${['XS', 'S', 'M', 'L', 'XL'].map(size => `
                        <span class="size-option ${size === currentSize ? 'selected' : ''}" 
                              data-size="${size}"
                              style="display: inline-block; padding: 0.5rem 1rem; margin: 0.2rem; border: 1px solid #333; border-radius: 5px; cursor: pointer; color: ${size === currentSize ? 'white' : '#666'}; background: ${size === currentSize ? '#333' : 'transparent'};">
                            ${size}
                        </span>
                    `).join('')}
                </div>
                <input type="hidden" id="edit-size-value" value="${currentSize}">
            </div>

            <div class="form-group">
                <label style="color: white; display: block; margin-bottom: 0.5rem;">Tu reseña:</label>
                <textarea id="edit-comment" 
                          style="width: 100%; height: 120px; padding: 0.8rem; background: #2a2a2a; border: 1px solid #333; border-radius: 5px; color: white; resize: vertical;"
                          maxlength="500">${currentComment}</textarea>
                <small style="color: #ccc; display: block; text-align: right;">
                    <span id="edit-char-count">${currentComment.length}</span>/500 caracteres
                </small>
            </div>

            <div style="text-align: center; margin-top: 1.5rem;">
                <button type="button" onclick="closeEditModal()" 
                        style="margin-right: 1rem; padding: 0.8rem 1.5rem; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                <button type="button" onclick="submitEditReview()" 
                        style="padding: 0.8rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-save"></i> Guardar Cambios
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    // Agregar event listeners
    setupEditModalListeners();
}

function setupEditModalListeners() {
    // Estrellas de rating
    document.querySelectorAll('#edit-rating-selector .rating-star').forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            document.getElementById('edit-rating-value').value = rating;
            
            // Actualizar visualización de estrellas
            document.querySelectorAll('#edit-rating-selector .rating-star').forEach((s, i) => {
                s.style.color = i < rating ? '#ffd700' : '#666';
            });
        });
    });

    // Selector de tallas
    document.querySelectorAll('#edit-size-selector .size-option').forEach(option => {
        option.addEventListener('click', () => {
            const size = option.dataset.size;
            document.getElementById('edit-size-value').value = size;
            
            // Actualizar visualización de tallas
            document.querySelectorAll('#edit-size-selector .size-option').forEach(opt => {
                opt.style.color = opt.dataset.size === size ? 'white' : '#666';
                opt.style.background = opt.dataset.size === size ? '#333' : 'transparent';
            });
        });
    });

    // Contador de caracteres
    document.getElementById('edit-comment').addEventListener('input', (e) => {
        document.getElementById('edit-char-count').textContent = e.target.value.length;
    });
}

function closeEditModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
    editingReviewId = null;
}

async function submitEditReview() {
    const rating = parseInt(document.getElementById('edit-rating-value').value);
    const size = document.getElementById('edit-size-value').value;
    const comment = document.getElementById('edit-comment').value.trim();

    if (!rating || !size || !comment) {
        alert('Por favor completa todos los campos');
        return;
    }

    if (comment.length < 10) {
        alert('El comentario debe tener al menos 10 caracteres');
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/reviews/${editingReviewId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                rating: rating,
                comment: comment,
                size: size
            }),
        });

        const result = await response.json();

        if (response.ok) {
            alert('¡Reseña actualizada exitosamente!');
            closeEditModal();
            location.reload(); // Recargar para ver los cambios
        } else {
            alert('Error al actualizar reseña: ' + result.error);
        }

    } catch (error) {
        console.error("Error al editar reseña:", error);
        alert('Error al editar reseña. Intenta de nuevo.');
    }
}