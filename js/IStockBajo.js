document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const statsCritical = document.querySelector('.stat-card:nth-child(1) h3');
    const statsWarning = document.querySelector('.stat-card:nth-child(2) h3');
    const statsNormal = document.querySelector('.stat-card:nth-child(3) h3');
    const alertBanner = document.querySelector('.alert-banner');
    const alertMessage = document.getElementById('alertMessage');
    const tableBody = document.querySelector('tbody');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const reorderForm = document.getElementById('reorderForm');
    const closeForm = document.getElementById('closeForm');
    const orderForm = document.getElementById('orderForm');
    const productNameInput = document.getElementById('productName');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userRole = document.getElementById('userRole');

    // Estado de la aplicación
    let allProducts = [];
    let filteredProducts = [];
    let currentFilter = 'all';

    // Configuración de stock
    const STOCK_LEVELS = {
        BAJO: 15,     // Bajo: 0-15 unidades
        MEDIO: 50,    // Medio: 16-49 unidades  
        NORMAL: 50    // Normal: 50+ unidades 
    };

    // Inicializar la aplicación
    async function init() {
        await loadUserInfo();
        await loadProducts();
        setupEventListeners();
    }

    // Cargar información del usuario
    async function loadUserInfo() {
        try {
            // En una aplicación real, esto vendría del sistema de autenticación
            const user = {
                name: 'Inventario',
                role: 'Encargado del Inventario',
                initials: 'I'
            };
            
            userAvatar.textContent = user.initials;
            userName.textContent = user.name;
            userRole.textContent = user.role;
        } catch (error) {
            console.error('Error cargando información del usuario:', error);
        }
    }
    
    // Cargar los productos
    async function loadProducts() {
    try {
        showLoadingState();
        
        console.log('Cargando productos desde API...');
        
        // URL DINÁMICA - funciona en cualquier entorno
        const baseUrl = window.location.origin.includes('5500') 
            ? 'http://localhost:8080' 
            : window.location.origin;
            
        const response = await fetch(`${baseUrl}/products`);
        
        console.log('URL utilizada:', `${baseUrl}/products`);
        console.log('Respuesta recibida:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const variants = await response.json();
        
        console.log('Datos recibidos:', variants.length, 'variantes');
        
        // Procesar los datos
        allProducts = processProductData(variants);
        
        console.log('Productos procesados:', allProducts.length);
        
        applyFilter('all');
        updateStats();
        updateAlertBanner();
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        showErrorState('Error al cargar los productos. Verifica la consola para más detalles.');
    }
}

    // Procesar datos de variantes a formato de inventario
    function processProductData(variants) {
        return variants.map(variant => {
            const product = variant.product;
            
            if (!product) {
                console.warn('Variante sin producto:', variant);
                return null;
            }
            
            const stockLevel = getStockLevel(variant.stock);
            
            // DEPURACIÓN: Verificar y corregir la URL de la imagen
            let imageUrl = product.image_url || '/sources/img/logo_negro.png';
            
            // Asegurar que la ruta empiece con /
            if (!imageUrl.startsWith('/')) {
                imageUrl = '/' + imageUrl;
            }
            
            console.log('🔍 Depuración de imagen:', {
                nombre: product.name,
                image_url_original: product.image_url,
                image_url_corregida: imageUrl,
                stock: variant.stock
            });
            
            return {
                id: variant._id,
                productId: product._id,
                name: product.name,
                category: product.category,
                size: variant.size,
                sku: variant.sku,
                stock: variant.stock,
                stockLevel: stockLevel,
                status: getStockStatus(stockLevel),
                minStock: STOCK_LEVELS.BAJO,
                image: imageUrl
            };
        }).filter(product => product !== null);
    }

    // Determinar nivel de stock CORREGIDO
    function getStockLevel(stock) {
    if (stock <= STOCK_LEVELS.BAJO) return 'bajo';        // 0-15
    if (stock < STOCK_LEVELS.NORMAL) return 'medio';      // 16-49
    return 'normal';                                      // 50+
    }

    // Obtener texto del estado CORREGIDO
    function getStockStatus(level) {
        const statusMap = {
            bajo: 'Bajo',
            medio: 'Medio',  
            normal: 'Normal'
        };
        return statusMap[level] || 'Desconocido';
    }

    // Aplicar filtro CORREGIDO
    function applyFilter(filter) {
        currentFilter = filter;
        
        switch(filter) {
            case 'bajo':
                filteredProducts = allProducts.filter(p => p.stockLevel === 'bajo');
                break;
            case 'medio':
                filteredProducts = allProducts.filter(p => p.stockLevel === 'medio');
                break;
            case 'normal':
                filteredProducts = allProducts.filter(p => p.stockLevel === 'normal');
                break;
            default:
                filteredProducts = allProducts; // "Todos" - muestra todos los productos
        }
        
        renderTable();
        updateFilterButtons();
    }

    // Renderizar tabla CORREGIDA
    function renderTable() {
        if (filteredProducts.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 10px; color: var(--success);"></i>
                        <br>
                        ${currentFilter === 'all' ? 'No hay productos con stock bajo' : 
                        currentFilter === 'critical' ? 'No hay productos con stock crítico' : 
                        'No hay productos con stock bajo'}
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = filteredProducts.map(product => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${product.image}" alt="${product.name}" 
                            style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                        <div>
                            <strong>${product.name}</strong>
                            <br>
                            <small style="color: #666;">Talla: ${product.size} | SKU: ${product.sku}</small>
                        </div>
                    </div>
                </td>
                <td>${product.category.charAt(0).toUpperCase() + product.category.slice(1)}</td>
                <td class="stock-${product.stockLevel}">${product.stock} unidades</td>
                <td>
                    <span class="stock-${product.stockLevel}">
                        ${product.status}
                        ${product.stockLevel === 'bajo' ? ' <i class="fas fa-exclamation-circle"></i>' : 
                        product.stockLevel === 'medio' ? ' <i class="fas fa-clock"></i>' : 
                        ' <i class="fas fa-check-circle"></i>'}
                    </span>
                </td>
                <td>
                    <button class="action-btn order-btn" 
                            onclick="openReorderForm('${product.id}', '${product.name} - ${product.size}')"
                            ${product.stockLevel === 'normal' ? 'disabled style="opacity: 0.5;"' : ''}>
                        <i class="fas fa-box"></i> Pedir
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Actualizar botones de filtro CORREGIDO
    function updateFilterButtons() {
        filterButtons.forEach(btn => {
            const filterType = btn.textContent.toLowerCase();
            btn.classList.toggle('active', 
                (filterType === 'todos' && currentFilter === 'all') ||
                (filterType === 'normal' && currentFilter === 'normal') ||
                (filterType === 'medio' && currentFilter === 'medio') ||
                (filterType === 'bajo' && currentFilter === 'bajo')
            );
        });
    }
    // Actualizar estadísticas CORREGIDA
    function updateStats() {
        const bajoCount = allProducts.filter(p => p.stockLevel === 'bajo').length;
        const medioCount = allProducts.filter(p => p.stockLevel === 'medio').length;
        const normalCount = allProducts.filter(p => p.stockLevel === 'normal').length;

        statsCritical.textContent = bajoCount;      // Productos con stock BAJO
        statsWarning.textContent = medioCount;      // Productos con stock MEDIO
        statsNormal.textContent = normalCount;      // Productos con stock NORMAL
    }

    // Actualizar banner de alerta
    function updateAlertBanner() {
        const criticalProducts = allProducts.filter(p => p.stockLevel === 'critical');
        
        if (criticalProducts.length > 0) {
            alertMessage.textContent = 
                `${criticalProducts.length} producto(s) tienen niveles de inventario por debajo del mínimo (${STOCK_LEVELS.CRITICAL} unidades). Se recomienda realizar pedidos de inmediato.`;
            alertBanner.style.display = 'flex';
        } else {
            alertBanner.style.display = 'none';
        }
    }

    // Mostrar estado de carga
    function showLoadingState() {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <br>
                    Cargando productos del inventario...
                </td>
            </tr>
        `;
    }

    // Mostrar estado de error
    function showErrorState(message) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--danger);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <br>
                    ${message}
                    <br>
                    <button onclick="location.reload()" class="action-btn order-btn" style="margin-top: 10px;">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </td>
            </tr>
        `;
    }

    // Configurar event listeners
    function setupEventListeners() {
    // Filtros
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.textContent.toLowerCase();
            const filterMap = {
                'todos': 'all',
                'normal': 'normal',
                'medio': 'medio',
                'bajo': 'bajo'
            };
            applyFilter(filterMap[filter] || 'all');
        });
    });

        // Formulario de pedido
        closeForm.addEventListener('click', closeReorderForm);
        
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitReorderForm();
        });

        // Cerrar formulario al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (reorderForm.style.display === 'block' && 
                !reorderForm.contains(e.target) && 
                !e.target.classList.contains('order-btn')) {
                closeReorderForm();
            }
        });
    }

    // Inicializar la aplicación
    init();
});

// Funciones globales para los botones
function openReorderForm(productId, productName) {
    const form = document.getElementById('reorderForm');
    const productInput = document.getElementById('productName');
    
    productInput.value = productName;
    form.style.display = 'block';
    
    // Almacenar el ID del producto en el formulario
    form.dataset.productId = productId;
}

function closeReorderForm() {
    document.getElementById('reorderForm').style.display = 'none';
    document.getElementById('orderForm').reset();
}

async function submitReorderForm() {
    const form = document.getElementById('reorderForm');
    const productId = form.dataset.productId;
    const productName = document.getElementById('productName').value;
    const supplier = document.getElementById('supplier').value;
    const quantity = document.getElementById('quantity').value;
    const urgency = document.getElementById('urgency').value;

    if (!supplier) {
        alert('Por favor selecciona un proveedor');
        return;
    }

    try {
        // Simular envío del pedido (en una app real, harías una petición a tu API)
        console.log('Realizando pedido:', {
            productId,
            productName,
            supplier,
            quantity,
            urgency
        });

        // Mostrar confirmación
        alert(`¡Pedido realizado exitosamente!\n\nProducto: ${productName}\nCantidad: ${quantity}\nProveedor: ${document.getElementById('supplier').options[document.getElementById('supplier').selectedIndex].text}\nUrgencia: ${urgency}`);
        
        // Cerrar formulario
        closeReorderForm();
        
        // Recargar los datos (opcional)
        // await loadProducts();
        
    } catch (error) {
        console.error('Error realizando pedido:', error);
        alert('Error al realizar el pedido: ' + error.message);
    }
}