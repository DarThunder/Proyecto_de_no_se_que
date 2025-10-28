// reviews.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Reviews JS cargado');

    // Sistema de calificación con estrellas
    setupStarRatings();
    
    // Contadores de caracteres
    setupCharacterCounters();
    
    // Sistema de subida de archivos
    setupFileUpload();
    
    // Envío del formulario
    setupFormSubmission();
});

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
            
            ratingText.textContent = ratingMessage;
            ratingText.style.color = '#ffd700';
        });
    });

    // Calificaciones específicas
    const specificStars = document.querySelectorAll('.specific-stars input');
    specificStars.forEach(star => {
        star.addEventListener('change', function() {
            // Aquí puedes agregar lógica adicional si es necesario
            console.log('Calificación específica:', this.name, this.value);
        });
    });
}

function setupCharacterCounters() {
    const titleInput = document.getElementById('reviewTitle');
    const commentInput = document.getElementById('reviewComment');
    const titleCount = titleInput.nextElementSibling;
    const commentCount = commentInput.nextElementSibling;

    titleInput.addEventListener('input', function() {
        const count = this.value.length;
        titleCount.textContent = `${count}/60 caracteres`;
        
        if (count > 60) {
            titleCount.style.color = '#ff4444';
        } else if (count > 50) {
            titleCount.style.color = '#ffa500';
        } else {
            titleCount.style.color = '#888';
        }
    });

    commentInput.addEventListener('input', function() {
        const count = this.value.length;
        commentCount.textContent = `${count}/500 caracteres`;
        
        if (count > 500) {
            commentCount.style.color = '#ff4444';
        } else if (count > 400) {
            commentCount.style.color = '#ffa500';
        } else {
            commentCount.style.color = '#888';
        }
    });
}

function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('mediaUpload');
    const uploadedMedia = document.getElementById('uploadedMedia');

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
                    
                    uploadedMedia.appendChild(mediaElement);
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
    const submitBtn = form.querySelector('.submit-review-btn');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validaciones
        if (!validateForm()) {
            return;
        }

        // Deshabilitar botón
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';

        // Simular envío (en una app real, aquí iría una petición AJAX)
        setTimeout(() => {
            alert('¡Reseña publicada con éxito! Gracias por compartir tu experiencia.');
            window.location.href = 'my-reviews.html'; // Redirigir a mis reseñas
        }, 2000);
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