class CategoryManager {
    constructor() {
        this.categories = [];
        this.currentCategoryId = null;
        this.currentImageFile = null;
        this.init();
    }

    async init() {
        console.log('🔧 CategoryManager inicializando...');
        try {
            await this.checkAuthAndPermissions();
            await this.loadCategories();
            this.setupEventListeners();
            console.log('✅ CategoryManager inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando CategoryManager:', error);
        }
    }

    async checkAuthAndPermissions() {
        try {
            console.log('🔐 Verificando autenticación...');
            const meResponse = await fetch("http://localhost:8080/users/me", {
                method: "GET",
                credentials: "include",
            });

            if (!meResponse.ok) {
                throw new Error("No autorizado. Redirigiendo al login.");
            }

            const userInfo = await meResponse.json();
            console.log('👤 Usuario autenticado:', userInfo);

            // SOLO ADMIN (permission_ring = 0)
            if (userInfo.role && userInfo.role.permission_ring === 0) {
                const usernameElement = document.getElementById('admin-username');
                if (usernameElement) {
                    usernameElement.textContent = userInfo.username || 'Admin';
                }
                console.log('✅ Permisos de administrador confirmados');
            } else {
                throw new Error("Acceso denegado. Solo los administradores pueden gestionar categorías.");
            }

        } catch (error) {
            console.error('❌ Error en autenticación:', error.message);
            
            const userConfirmed = confirm("Acceso denegado. Debes iniciar sesión como Administrador.\n\n¿Deseas ir al Login? (Cancelar para ir al Dashboard)");
            
            if (userConfirmed) {
                window.location.href = 'login.html';
            } else {
                window.location.href = 'admin.html';
            }
            throw error;
        }
    }

    async loadCategories() {
        try {
            console.log('📦 Cargando categorías...');
            const response = await fetch('http://localhost:8080/categories/admin/all', {
                credentials: 'include'
            });
            
            console.log('📡 Response status:', response.status);
            
            if (response.ok) {
                this.categories = await response.json();
                console.log(`✅ ${this.categories.length} categorías cargadas`);
                this.renderCategories();
            } else {
                throw new Error('Error al cargar categorías: ' + response.status);
            }
        } catch (error) {
            console.error('❌ Error cargando categorías:', error);
            this.showNotification('Error al cargar categorías: ' + error.message, 'error');
        }
    }

    async getActiveCategories() {
    try {
        const response = await fetch('http://localhost:8080/categories', {
            credentials: 'include'
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Error al cargar categorías activas');
        }
    } catch (error) {
        console.error('Error obteniendo categorías activas:', error);
        return [];
    }
}

    renderCategories() {
        const grid = document.getElementById('categories-grid');
        if (!grid) {
            console.error('No se encontró el elemento categories-grid');
            return;
        }
        
        grid.innerHTML = '';

        if (this.categories.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open fa-3x"></i>
                    <h3>No hay categorías registradas</h3>
                    <p>Comienza agregando tu primera categoría</p>
                </div>
            `;
            return;
        }

        this.categories.forEach(category => {
            const categoryCard = document.createElement('div');
            categoryCard.className = `category-card ${!category.isActive ? 'inactive' : ''}`;
            
            // Procesar URL de imagen
            let imageUrl = category.image_url || '/sources/img/category_default.png';
            if (!imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
            }
            if (imageUrl.startsWith('/sources/')) {
                imageUrl = '..' + imageUrl;
            }

            categoryCard.innerHTML = `
                <div class="category-image">
                    <img src="${imageUrl}" 
                         alt="${category.name}"
                         onerror="this.src='../sources/img/category_default.png'">
                    ${!category.isActive ? '<div class="inactive-badge">Inactiva</div>' : ''}
                </div>
                <div class="category-info">
                    <h3 class="category-name">${this.escapeHtml(category.name)}</h3>
                    <p class="category-description">${this.escapeHtml(category.description || 'Sin descripción')}</p>
                    <div class="category-meta">
                        <span class="category-status ${category.isActive ? 'active' : 'inactive'}">
                            <i class="fas fa-circle"></i>
                            ${category.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                        <span class="category-date">
                            Creada: ${new Date(category.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                <div class="category-actions">
                    <button class="btn btn-sm btn-edit" data-id="${category._id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm ${category.isActive ? 'btn-warning' : 'btn-success'}" 
                            data-id="${category._id}" 
                            data-action="toggle"
                            title="${category.isActive ? 'Desactivar' : 'Activar'}">
                        <i class="fas ${category.isActive ? 'fa-eye-slash' : 'fa-eye'}"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" data-id="${category._id}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            grid.appendChild(categoryCard);
        });

        this.addCardEventListeners();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupEventListeners() {
        console.log('🎯 Configurando event listeners...');
        
        // Botón agregar categoría
        const addBtn = document.getElementById('add-category-btn');
        console.log('🔘 Botón agregar categoría encontrado:', !!addBtn);
        
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                console.log('🎯 Botón agregar categoría clickeado');
                this.openCategoryModal();
            });
        } else {
            console.error('❌ NO SE ENCONTRÓ EL BOTÓN add-category-btn');
        }

        // Gestión de imágenes
        this.setupImageHandlers();

        // Modal de categoría
        this.setupModalHandlers();

        // Formulario de categoría
        const categoryForm = document.getElementById('category-form');
        console.log('📝 Formulario encontrado:', !!categoryForm);
        
        if (categoryForm) {
            categoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('📤 Formulario enviado');
                this.saveCategory();
            });
        }

        // Modal de eliminación
        this.setupDeleteModalHandlers();

        // Botón de cerrar sesión
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await fetch("http://localhost:8080/auth/logout", {
                        method: "POST",
                        credentials: "include",
                    });
                } catch (err) {
                    console.error("Error al cerrar sesión", err);
                } finally {
                    alert("Sesión cerrada.");
                    window.location.href = 'login.html';
                }
            });
        }

        console.log('✅ Event listeners configurados correctamente');
    }

    setupImageHandlers() {
        const selectImageBtn = document.getElementById('select-image-btn');
        const imageFileInput = document.getElementById('category-image-file');
        
        if (selectImageBtn && imageFileInput) {
            selectImageBtn.addEventListener('click', () => {
                console.log('🖼️ Botón seleccionar imagen clickeado');
                imageFileInput.click();
            });

            imageFileInput.addEventListener('change', (e) => {
                console.log('📁 Archivo seleccionado:', e.target.files?.[0]?.name);
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    
                    if (file.size > 5 * 1024 * 1024) {
                        this.showNotification('La imagen es muy grande. Máximo 5MB.', 'error');
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const previewImg = document.getElementById('preview-img');
                        const imagePreview = document.getElementById('image-preview');
                        if (previewImg && imagePreview) {
                            previewImg.src = e.target.result;
                            imagePreview.style.display = 'block';
                            const imageUrlInput = document.getElementById('category-image');
                            if (imageUrlInput) {
                                imageUrlInput.value = `Imagen seleccionada: ${file.name}`;
                            }
                            this.currentImageFile = file;
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        const imageUrlInput = document.getElementById('category-image');
        if (imageUrlInput) {
            imageUrlInput.addEventListener('input', (e) => {
                const url = e.target.value.trim();
                const previewImg = document.getElementById('preview-img');
                const imagePreview = document.getElementById('image-preview');
                
                if (url && (url.startsWith('http') || url.startsWith('/') || url.startsWith('../'))) {
                    if (previewImg) previewImg.src = url;
                    if (imagePreview) imagePreview.style.display = 'block';
                    this.currentImageFile = null;
                } else if (!url && imagePreview) {
                    imagePreview.style.display = 'none';
                }
            });
        }
    }

    setupModalHandlers() {
        const modal = document.getElementById('category-modal');
        console.log('📦 Modal encontrado:', !!modal);
        
        if (modal) {
            const closeBtn = modal.querySelector('.close');
            const cancelBtn = document.getElementById('cancel-btn');
            console.log('❌ Botones de cerrar modal:', {
                closeBtn: !!closeBtn,
                cancelBtn: !!cancelBtn
            });

            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    console.log('📦 Cerrando modal con X');
                    this.closeCategoryModal();
                });
            }
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    console.log('📦 Cerrando modal con Cancelar');
                    this.closeCategoryModal();
                });
            }
            
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    console.log('📦 Cerrando modal con click fuera');
                    this.closeCategoryModal();
                }
            });
        }
    }

    setupDeleteModalHandlers() {
        const deleteModal = document.getElementById('delete-modal');
        if (deleteModal) {
            const deleteCloseBtn = deleteModal.querySelector('.close');
            const cancelDeleteBtn = document.getElementById('cancel-delete');

            if (deleteCloseBtn) {
                deleteCloseBtn.addEventListener('click', () => this.closeDeleteModal());
            }
            if (cancelDeleteBtn) {
                cancelDeleteBtn.addEventListener('click', () => this.closeDeleteModal());
            }
            
            window.addEventListener('click', (e) => {
                if (e.target === deleteModal) {
                    this.closeDeleteModal();
                }
            });

            const confirmDeleteBtn = document.getElementById('confirm-delete');
            if (confirmDeleteBtn) {
                confirmDeleteBtn.addEventListener('click', () => {
                    this.deleteCategory();
                });
            }
        }
    }

    openCategoryModal(category = null) {
        console.log('🚀 Abriendo modal de categoría...');
        
        const modal = document.getElementById('category-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('category-form');
        
        console.log('🔍 Elementos del modal:', {
            modal: !!modal,
            title: !!title,
            form: !!form
        });

        if (!modal || !title || !form) {
            console.error('❌ Elementos del modal no encontrados');
            this.showNotification('Error: No se pudo abrir el formulario', 'error');
            return;
        }
        
        // Resetear formulario
        form.reset();
        this.currentImageFile = null;
        
        // Mostrar/ocultar toggle de activo
        const activeToggle = document.getElementById('active-toggle');
        const imagePreview = document.getElementById('image-preview');
        
        if (category) {
            console.log('✏️ Editando categoría:', category.name);
            title.textContent = 'Editar Categoría';
            this.currentCategoryId = category._id;
            this.fillCategoryForm(category);
            if (activeToggle) activeToggle.style.display = 'block';
        } else {
            console.log('🆕 Creando nueva categoría');
            title.textContent = 'Agregar Categoría';
            this.currentCategoryId = null;
            if (activeToggle) activeToggle.style.display = 'none';
            if (imagePreview) imagePreview.style.display = 'none';
        }
        
        // Mostrar modal
        modal.style.display = 'block';
        console.log('✅ Modal mostrado correctamente');
    }

    fillCategoryForm(category) {
        document.getElementById('category-id').value = category._id;
        document.getElementById('category-name').value = category.name;
        document.getElementById('category-description').value = category.description || '';
        document.getElementById('category-image').value = category.image_url || '';
        document.getElementById('category-active').checked = category.isActive !== false;

        const imageUrl = document.getElementById('category-image').value;
        const imagePreview = document.getElementById('image-preview');
        const previewImg = document.getElementById('preview-img');
        
        if (imageUrl && imagePreview && previewImg) {
            previewImg.src = imageUrl;
            imagePreview.style.display = 'block';
        }
    }

    closeCategoryModal() {
        const modal = document.getElementById('category-modal');
        if (modal) modal.style.display = 'none';
    }

    async saveCategory() {
        const formData = this.getFormData();
        
        if (!this.validateForm(formData)) {
            return;
        }

        try {
            const url = this.currentCategoryId ? 
                `http://localhost:8080/categories/admin/${this.currentCategoryId}` : 
                'http://localhost:8080/categories/admin';
            
            const method = this.currentCategoryId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.showNotification(
                    `Categoría ${this.currentCategoryId ? 'actualizada' : 'creada'} correctamente`, 
                    'success'
                );
                this.closeCategoryModal();
                await this.loadCategories();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error ${response.status}`);
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error al guardar la categoría: ' + error.message, 'error');
        }
    }

    getFormData() {
        const formData = {
            name: document.getElementById('category-name').value,
            description: document.getElementById('category-description').value,
            image_url: document.getElementById('category-image').value,
        };

        if (this.currentCategoryId) {
            formData.isActive = document.getElementById('category-active').checked;
        }
        if (formData.image_url) {
            // Si la imagen empieza con "sources/", asegurar que tenga "/" al inicio
            if (formData.image_url.startsWith('sources/') && !formData.image_url.startsWith('/sources/')) {
                formData.image_url = '/' + formData.image_url;
            }
            // Si es una ruta relativa sin "sources/", asumir que está en la carpeta sources/img/
            else if (!formData.image_url.startsWith('http') && !formData.image_url.startsWith('/') && !formData.image_url.includes('sources/')) {
                formData.image_url = '/sources/img/' + formData.image_url;
            }
        }

        // Si hay un archivo de imagen seleccionado
        if (this.currentImageFile) {
            // Para archivos subidos, usar ruta absoluta desde la raíz
            formData.image_url = `/sources/img/uploaded_${Date.now()}_${this.currentImageFile.name}`;
        }

        // Si no hay imagen, usar la predeterminada con ruta absoluta
        if (!formData.image_url || formData.image_url.trim() === '') {
            formData.image_url = '/sources/img/category_default.png';
        }

        console.log('URL de imagen a guardar:', formData.image_url); // DEBUG
        return formData;
    }

    validateForm(formData) {
        if (!formData.name.trim()) {
            this.showNotification('El nombre de la categoría es requerido', 'error');
            return false;
        }

        if (formData.name.trim().length < 2) {
            this.showNotification('El nombre debe tener al menos 2 caracteres', 'error');
            return false;
        }

        return true;
    }

    addCardEventListeners() {
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.getAttribute('data-id');
                this.editCategory(categoryId);
            });
        });

        document.querySelectorAll('.btn-danger').forEach(btn => {
            if (!btn.closest('.modal-footer')) {
                btn.addEventListener('click', (e) => {
                    const categoryId = e.currentTarget.getAttribute('data-id');
                    this.openDeleteModal(categoryId);
                });
            }
        });

        document.querySelectorAll('[data-action="toggle"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.getAttribute('data-id');
                this.toggleCategory(categoryId);
            });
        });
    }

    async editCategory(categoryId) {
        const category = this.categories.find(c => c._id === categoryId);
        if (category) {
            this.openCategoryModal(category);
        }
    }

    async toggleCategory(categoryId) {
        try {
            const response = await fetch(`http://localhost:8080/categories/admin/${categoryId}/toggle`, {
                method: 'PATCH',
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                this.showNotification(result.message, 'success');
                await this.loadCategories();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al cambiar estado');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error: ' + error.message, 'error');
        }
    }

    openDeleteModal(categoryId) {
        this.currentCategoryId = categoryId;
        const category = this.categories.find(c => c._id === categoryId);
        const modal = document.getElementById('delete-modal');
        const message = document.getElementById('delete-message');
        
        if (modal && message && category) {
            message.textContent = `¿Estás seguro de que quieres eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`;
            modal.style.display = 'block';
        }
    }

    closeDeleteModal() {
        const modal = document.getElementById('delete-modal');
        if (modal) modal.style.display = 'none';
        this.currentCategoryId = null;
    }

    async deleteCategory() {
        if (!this.currentCategoryId) return;

        try {
            const response = await fetch(`http://localhost:8080/categories/admin/${this.currentCategoryId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                this.showNotification('Categoría eliminada correctamente', 'success');
                this.closeDeleteModal();
                await this.loadCategories();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar la categoría');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error al eliminar la categoría: ' + error.message, 'error');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-width: 300px;
        `;

        document.body.appendChild(notification);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Remover al hacer click en la X
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            });
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM cargado, inicializando CategoryManager...');
    new CategoryManager();
});