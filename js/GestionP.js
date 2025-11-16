class ProductManager {
    constructor() {
        this.products = [];
        this.currentProductId = null;
        this.currentImageFile = null;
        this.init();
    }

    async init() {
        await this.checkAuthAndPermissions();
        await this.loadProducts();
        this.setupEventListeners();
    }

    async checkAuthAndPermissions() {
        try {
            const meResponse = await fetch("http://localhost:8080/users/me", {
                method: "GET",
                credentials: "include",
            });

            if (!meResponse.ok) {
                throw new Error("No autorizado. Redirigiendo al login.");
            }

            const userInfo = await meResponse.json();

            // SOLO ADMIN (permission_ring = 0)
            if (userInfo.role && userInfo.role.permission_ring === 0) {
                document.getElementById('admin-username').textContent = userInfo.username || 'Admin';
            } else {
                throw new Error("Acceso denegado. Solo los administradores pueden gestionar productos.");
            }

        } catch (error) {
            console.error(error.message);
            
            const userConfirmed = confirm("Acceso denegado. Debes iniciar sesión como Administrador.\n\n¿Deseas ir al Login? (Cancelar para ir al Dashboard)");
            
            if (userConfirmed) {
                window.location.href = 'login.html';
            } else {
                window.location.href = 'admin.html';
            }
            throw error;
        }
    }

    async loadProducts() {
        try {
            const response = await fetch('http://localhost:8080/products/admin/all', {
                credentials: 'include'
            });
            
            if (response.ok) {
                this.products = await response.json();
                this.renderProducts();
            } else {
                throw new Error('Error al cargar productos: ' + response.status);
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error al cargar productos: ' + error.message, 'error');
        }
    }

    renderProducts() {
        const tbody = document.getElementById('products-table-body');
        if (!tbody) {
            console.error('No se encontró el elemento products-table-body');
            return;
        }
        
        tbody.innerHTML = '';

        if (this.products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem;">
                        No hay productos registrados
                    </td>
                </tr>
            `;
            return;
        }

        this.products.forEach(product => {
            const row = document.createElement('tr');
            
            const totalStock = product.variants ? 
                product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0) : 0;

            // Información de variantes para mostrar
            const variantsInfo = product.variants && product.variants.length > 0 ? 
                product.variants.map(v => `${v.size}: ${v.stock}`).join(', ') : 'Sin variantes';

            let imageUrl = product.image_url || '/sources/img/logo_negro.png';
            if (!imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
            }
            if (imageUrl.startsWith('/sources/')) {
                imageUrl = '..' + imageUrl;
            }

            row.innerHTML = `
                <td>
                    <img src="${imageUrl}" 
                         alt="${product.name}" 
                         class="product-thumbnail"
                         onerror="this.src='../sources/img/logo_negro.png'">
                </td>
                <td>${this.escapeHtml(product.name)}</td>
                <td>$${(product.base_price || 0).toFixed(2)}</td>
                <td>${this.capitalizeFirstLetter(product.category)}</td>
                <td>${this.escapeHtml(product.productType)}</td>
                <td>${totalStock}</td>
                <td>
                    <small>${variantsInfo}</small>
                    <br>
                    <button class="btn btn-sm btn-info manage-stock-btn" data-id="${product._id}">
                        <i class="fas fa-warehouse"></i> Gestionar Stock
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-edit" data-id="${product._id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" data-id="${product._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });

        this.addTableEventListeners();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    capitalizeFirstLetter(string) {
        return string ? string.charAt(0).toUpperCase() + string.slice(1) : '';
    }

    setupEventListeners() {
        // Botón agregar producto
        const addBtn = document.getElementById('add-product-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.openProductModal();
            });
        }

        // Botón para seleccionar imagen
        const selectImageBtn = document.getElementById('select-image-btn');
        const imageFileInput = document.getElementById('product-image-file');
        const imageUrlInput = document.getElementById('product-image');
        const imagePreview = document.getElementById('image-preview');
        const previewImg = document.getElementById('preview-img');

        if (selectImageBtn && imageFileInput) {
            selectImageBtn.addEventListener('click', () => {
                imageFileInput.click();
            });

            imageFileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    
                    if (file.size > 5 * 1024 * 1024) {
                        this.showNotification('La imagen es muy grande. Máximo 5MB.', 'error');
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        previewImg.src = e.target.result;
                        imagePreview.style.display = 'block';
                        imageUrlInput.value = `Imagen seleccionada: ${file.name}`;
                        this.currentImageFile = file;
                    };
                    reader.readAsDataURL(file);
                }
            });

            imageUrlInput.addEventListener('input', (e) => {
                const url = e.target.value.trim();
                if (url && (url.startsWith('http') || url.startsWith('/') || url.startsWith('../'))) {
                    previewImg.src = url;
                    imagePreview.style.display = 'block';
                    this.currentImageFile = null;
                } else if (!url) {
                    imagePreview.style.display = 'none';
                }
            });
        }

        // Modal de producto
        const modal = document.getElementById('product-modal');
        if (modal) {
            const closeBtn = modal.querySelector('.close');
            const cancelBtn = document.getElementById('cancel-btn');

            if (closeBtn) closeBtn.addEventListener('click', () => this.closeProductModal());
            if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeProductModal());
            
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeProductModal();
                }
            });
        }

        // Formulario de producto
        const productForm = document.getElementById('product-form');
        if (productForm) {
            productForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProduct();
            });
        }

        // Botón agregar variante
        const addVariantBtn = document.getElementById('add-variant-btn');
        if (addVariantBtn) {
            addVariantBtn.addEventListener('click', () => {
                this.addVariantField();
            });
        }

        // Modal de eliminación
        const deleteModal = document.getElementById('delete-modal');
        if (deleteModal) {
            const deleteCloseBtn = deleteModal.querySelector('.close');
            const cancelDeleteBtn = document.getElementById('cancel-delete');

            if (deleteCloseBtn) deleteCloseBtn.addEventListener('click', () => this.closeDeleteModal());
            if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', () => this.closeDeleteModal());
            
            window.addEventListener('click', (e) => {
                if (e.target === deleteModal) {
                    this.closeDeleteModal();
                }
            });

            const confirmDeleteBtn = document.getElementById('confirm-delete');
            if (confirmDeleteBtn) {
                confirmDeleteBtn.addEventListener('click', () => {
                    this.deleteProduct();
                });
            }
        }

        // Modal de gestión de stock
        const stockModal = document.getElementById('stock-modal');
        if (stockModal) {
            const stockCloseBtn = stockModal.querySelector('.close');
            const cancelStockBtn = document.getElementById('cancel-stock-btn');
            const saveStockBtn = document.getElementById('save-stock-btn');

            if (stockCloseBtn) stockCloseBtn.addEventListener('click', () => this.closeStockModal());
            if (cancelStockBtn) cancelStockBtn.addEventListener('click', () => this.closeStockModal());
            if (saveStockBtn) saveStockBtn.addEventListener('click', () => this.saveStockChanges());
            
            window.addEventListener('click', (e) => {
                if (e.target === stockModal) {
                    this.closeStockModal();
                }
            });
        }

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
    }

    addTableEventListeners() {
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.getAttribute('data-id');
                this.editProduct(productId);
            });
        });

        document.querySelectorAll('.btn-danger').forEach(btn => {
            if (!btn.closest('.modal-footer') && !btn.classList.contains('remove-variant')) {
                btn.addEventListener('click', (e) => {
                    const productId = e.currentTarget.getAttribute('data-id');
                    this.openDeleteModal(productId);
                });
            }
        });

        document.querySelectorAll('.manage-stock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.getAttribute('data-id');
                this.openStockModal(productId);
            });
        });
    }

    openProductModal(product = null) {
        const modal = document.getElementById('product-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('product-form');
        const imagePreview = document.getElementById('image-preview');
        
        if (!modal || !title || !form) {
            console.error('Elementos del modal no encontrados');
            return;
        }
        
        form.reset();
        document.getElementById('variants-container').innerHTML = '';
        if (imagePreview) imagePreview.style.display = 'none';
        this.currentImageFile = null;
        
        if (product) {
            title.textContent = 'Editar Producto';
            this.currentProductId = product._id;
            this.fillProductForm(product);
        } else {
            title.textContent = 'Agregar Producto';
            this.currentProductId = null;
            this.addVariantField();
        }
        
        modal.style.display = 'block';
    }

    fillProductForm(product) {
        document.getElementById('product-id').value = product._id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.base_price;
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-image').value = product.image_url || '';
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-type').value = product.productType;

        const imageUrl = document.getElementById('product-image').value;
        const imagePreview = document.getElementById('image-preview');
        const previewImg = document.getElementById('preview-img');
        
        if (imageUrl && imagePreview && previewImg) {
            previewImg.src = imageUrl;
            imagePreview.style.display = 'block';
        }

        const variantsContainer = document.getElementById('variants-container');
        variantsContainer.innerHTML = '';
        
        if (product.variants && product.variants.length > 0) {
            product.variants.forEach(variant => {
                this.addVariantField(variant);
            });
        } else {
            this.addVariantField();
        }
    }

    addVariantField(variant = null) {
        const container = document.getElementById('variants-container');
        if (!container) return;
        
        const variantId = Date.now() + Math.random();
        
        const variantHtml = `
            <div class="variant-row" data-id="${variantId}">
                <div class="variant-fields">
                    <select class="variant-size" required>
                        <option value="">Talla</option>
                        <option value="XS" ${variant?.size === 'XS' ? 'selected' : ''}>XS</option>
                        <option value="S" ${variant?.size === 'S' ? 'selected' : ''}>S</option>
                        <option value="M" ${variant?.size === 'M' ? 'selected' : ''}>M</option>
                        <option value="L" ${variant?.size === 'L' ? 'selected' : ''}>L</option>
                        <option value="XL" ${variant?.size === 'XL' ? 'selected' : ''}>XL</option>
                    </select>
                    <input type="text" class="variant-sku" placeholder="SKU" value="${variant?.sku || ''}" required>
                    <input type="number" class="variant-stock" placeholder="Stock" value="${variant?.stock || 0}" min="0" required>
                    <button type="button" class="btn btn-sm btn-danger remove-variant">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', variantHtml);

        const newRow = container.querySelector(`[data-id="${variantId}"]`);
        const removeBtn = newRow.querySelector('.remove-variant');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                newRow.remove();
            });
        }
    }

    closeProductModal() {
        const modal = document.getElementById('product-modal');
        if (modal) modal.style.display = 'none';
    }

    async saveProduct() {
        const formData = this.getFormData();
        
        if (!this.validateForm(formData)) {
            return;
        }

        try {
            const url = this.currentProductId ? 
                `http://localhost:8080/products/admin/${this.currentProductId}` : 'http://localhost:8080/products/admin';
            
            const method = this.currentProductId ? 'PUT' : 'POST';

            console.log('Enviando datos a:', url, formData);

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
                    `Producto ${this.currentProductId ? 'actualizado' : 'creado'} correctamente`, 
                    'success'
                );
                this.closeProductModal();
                await this.loadProducts();
            } else {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Error ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error al guardar el producto: ' + error.message, 'error');
        }
    }

    getFormData() {
        const variants = [];
        const variantRows = document.querySelectorAll('.variant-row');
        
        variantRows.forEach(row => {
            const size = row.querySelector('.variant-size').value;
            const sku = row.querySelector('.variant-sku').value;
            const stock = parseInt(row.querySelector('.variant-stock').value);
            
            if (size && sku) {
                variants.push({
                    size,
                    sku,
                    stock: stock || 0
                });
            }
        });

        const formData = {
            name: document.getElementById('product-name').value,
            base_price: parseFloat(document.getElementById('product-price').value),
            description: document.getElementById('product-description').value,
            image_url: document.getElementById('product-image').value,
            category: document.getElementById('product-category').value,
            productType: document.getElementById('product-type').value,
            variants: variants
        };

        if (this.currentImageFile) {
            formData.image_url = `uploaded_${Date.now()}_${this.currentImageFile.name}`;
        }

        return formData;
    }

    validateForm(formData) {
        if (!formData.name.trim()) {
            this.showNotification('El nombre del producto es requerido', 'error');
            return false;
        }

        if (!formData.base_price || formData.base_price <= 0) {
            this.showNotification('El precio debe ser mayor a 0', 'error');
            return false;
        }

        if (!formData.category) {
            this.showNotification('La categoría es requerida', 'error');
            return false;
        }

        if (!formData.productType.trim()) {
            this.showNotification('El tipo de producto es requerido', 'error');
            return false;
        }

        if (formData.variants.length === 0) {
            this.showNotification('Debe agregar al menos una variante', 'error');
            return false;
        }

        const skus = formData.variants.map(v => v.sku);
        const uniqueSkus = new Set(skus);
        if (skus.length !== uniqueSkus.size) {
            this.showNotification('Los SKUs deben ser únicos', 'error');
            return false;
        }

        return true;
    }

    async editProduct(productId) {
        const product = this.products.find(p => p._id === productId);
        if (product) {
            try {
                const response = await fetch(`http://localhost:8080/products/${productId}/variants`, {
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const variants = await response.json();
                    product.variants = variants;
                }
            } catch (error) {
                console.error('Error al cargar variantes:', error);
            }
            
            this.openProductModal(product);
        }
    }

    // FUNCIONES CORREGIDAS PARA GESTIÓN DE STOCK
    async openStockModal(productId) {
        const product = this.products.find(p => p._id === productId);
        if (!product) {
            this.showNotification('Producto no encontrado', 'error');
            return;
        }

        try {
            // Cargar las variantes actualizadas del producto
            const response = await fetch(`http://localhost:8080/products/${productId}/variants`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const variants = await response.json();
                product.variants = variants;
            } else {
                throw new Error('Error al cargar variantes');
            }
        } catch (error) {
            console.error('Error al cargar variantes:', error);
            this.showNotification('Error al cargar las variantes del producto', 'error');
            return;
        }

        this.currentProductId = productId;
        this.currentProductVariants = product.variants; // Guardar las variantes actuales
        document.getElementById('stock-product-name').textContent = product.name;
        
        this.renderStockForm(product);
        document.getElementById('stock-modal').style.display = 'block';
    }

    renderStockForm(product) {
        const container = document.getElementById('variants-stock-list');
        if (!container) return;

        container.innerHTML = '';

        if (!product.variants || product.variants.length === 0) {
            container.innerHTML = '<p class="no-variants">No hay variantes para este producto.</p>';
            return;
        }

        // Usar la misma lógica que en el modal de productos
        product.variants.forEach(variant => {
            const variantHtml = `
                <div class="variant-stock-item" data-variant-id="${variant._id}">
                    <div class="variant-info">
                        <div class="variant-header">
                            <strong>Talla: ${variant.size}</strong>
                            <span class="variant-sku">SKU: ${variant.sku}</span>
                        </div>
                        <div class="stock-info">
                            <span>Stock actual: <strong class="current-stock">${variant.stock}</strong></span>
                        </div>
                    </div>
                    <div class="stock-controls">
                        <label for="stock-${variant._id}">Nuevo Stock:</label>
                        <input type="number" 
                               id="stock-${variant._id}"
                               class="stock-input" 
                               value="${variant.stock}" 
                               min="0" 
                               required
                               onchange="this.style.borderColor = this.value != ${variant.stock} ? '#3498db' : '#34495e'">
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', variantHtml);

            // Agregar event listener para el input
            const input = container.querySelector(`#stock-${variant._id}`);
            if (input) {
                input.addEventListener('change', function() {
                    this.style.borderColor = this.value != variant.stock ? '#3498db' : '#34495e';
                });
            }
        });
    }

    async saveStockChanges() {
        if (!this.currentProductId || !this.currentProductVariants) {
            this.showNotification('No hay producto seleccionado', 'error');
            return;
        }

        const stockInputs = document.querySelectorAll('.stock-input');
        const updatedVariants = [];
        let hasChanges = false;

        // Recopilar todos los cambios usando la misma estructura que en saveProduct
        stockInputs.forEach(input => {
            const variantId = input.closest('.variant-stock-item').getAttribute('data-variant-id');
            const newStock = parseInt(input.value);
            const originalVariant = this.currentProductVariants.find(v => v._id === variantId);

            if (!originalVariant) {
                this.showNotification(`Variante no encontrada: ${variantId}`, 'error');
                return;
            }

            if (!isNaN(newStock) && newStock >= 0 && newStock !== originalVariant.stock) {
                updatedVariants.push({
                    ...originalVariant,
                    stock: newStock
                });
                hasChanges = true;
            }
        });

        if (!hasChanges) {
            this.showNotification('No hay cambios para guardar', 'warning');
            return;
        }

        try {
            this.showNotification('Actualizando stock...', 'info');

            // Usar el mismo endpoint que se usa para editar el producto completo
            // Esto actualiza todas las variantes a la vez
            const response = await fetch(`http://localhost:8080/products/admin/${this.currentProductId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    variants: updatedVariants
                    // Mantener los otros campos del producto sin cambios
                })
            });

            if (response.ok) {
                this.showNotification('Stock actualizado correctamente', 'success');
                this.closeStockModal();
                await this.loadProducts(); // Recargar la lista para mostrar cambios
            } else {
                const errorText = await response.text();
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error al actualizar el stock: ' + error.message, 'error');
        }
    }

    closeStockModal() {
        const modal = document.getElementById('stock-modal');
        if (modal) modal.style.display = 'none';
        this.currentProductId = null;
        this.currentProductVariants = null;
    }

    openDeleteModal(productId) {
        this.currentProductId = productId;
        const modal = document.getElementById('delete-modal');
        if (modal) modal.style.display = 'block';
    }

    closeDeleteModal() {
        const modal = document.getElementById('delete-modal');
        if (modal) modal.style.display = 'none';
        this.currentProductId = null;
    }

    async deleteProduct() {
        if (!this.currentProductId) return;

        try {
            const response = await fetch(`http://localhost:8080/products/admin/${this.currentProductId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                this.showNotification('Producto eliminado correctamente', 'success');
                this.closeDeleteModal();
                await this.loadProducts();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al eliminar el producto');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error al eliminar el producto: ' + error.message, 'error');
        }
    }

    showNotification(message, type = 'info') {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });

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
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
            color: white;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-width: 300px;
            max-width: 500px;
            animation: slideIn 0.3s ease-out;
        `;

        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        const autoRemove = setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);

        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(autoRemove);
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new ProductManager();
});