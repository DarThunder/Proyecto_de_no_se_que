// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    initializeInventorySystem();
});

function initializeInventorySystem() {
    // Inicializar filtros
    initializeFilters();
    
    // Inicializar botones de pedido
    initializeOrderButtons();
    
    // Inicializar formulario
    initializeOrderForm();
    
    // Cargar productos desde el backend
    loadProductsFromBackend();
    
    // Simular actualizaciones en tiempo real
    startRealTimeUpdates();
}

// Cargar productos desde el backend
async function loadProductsFromBackend() {
    try {
        console.log('Cargando variantes de productos desde el backend...');
        const response = await fetch("http://localhost:8080/products", {
            method: "GET",
            credentials: "include",
        });

        if (response.ok) {
            const variants = await response.json();
            console.log('Variantes cargadas:', variants);
            updateInventoryWithRealData(variants);
        } else {
            console.error("Error al cargar productos:", response.status);
            showError("Error al cargar los productos del inventario");
        }
    } catch (error) {
        console.error("Error cargando productos:", error);
        showError("Error de conexión con el servidor");
    }
}

// Actualizar la interfaz con datos reales del backend
function updateInventoryWithRealData(variants) {
    console.log('Actualizando interfaz con variantes:', variants);
    
    // Filtrar variantes con stock bajo
    const lowStockVariants = variants.filter(variant => {
        const criticalThreshold = 5;  // Stock crítico
        const warningThreshold = 15;  // Stock bajo
        
        return variant.stock <= warningThreshold;
    });

    const criticalVariants = lowStockVariants.filter(v => v.stock <= criticalThreshold);
    const warningVariants = lowStockVariants.filter(v => v.stock > criticalThreshold && v.stock <= warningThreshold);
    
    // Contar productos únicos con stock bajo (no variantes)
    const uniqueLowStockProducts = new Set(lowStockVariants.map(v => v.product._id)).size;
    const uniqueCriticalProducts = new Set(criticalVariants.map(v => v.product._id)).size;
    const uniqueWarningProducts = new Set(warningVariants.map(v => v.product._id)).size;
    const totalProducts = new Set(variants.map(v => v.product._id)).size;
    const normalProductsCount = totalProducts - uniqueLowStockProducts;

    console.log(`Estadísticas - Productos críticos: ${uniqueCriticalProducts}, Productos bajos: ${uniqueWarningProducts}, Productos normales: ${normalProductsCount}`);

    // Actualizar estadísticas
    updateStats(uniqueCriticalProducts, uniqueWarningProducts, normalProductsCount);
    
    // Actualizar tabla con variantes
    updateTable(lowStockVariants);
    
    // Actualizar banner de alerta
    updateAlertBanner(uniqueCriticalProducts);
}

// Actualizar las tarjetas de estadísticas
function updateStats(criticalCount, warningCount, normalCount) {
    const criticalElement = document.querySelector('.stat-card:nth-child(1) h3');
    const warningElement = document.querySelector('.stat-card:nth-child(2) h3');
    const normalElement = document.querySelector('.stat-card:nth-child(3) h3');

    if (criticalElement) {
        criticalElement.textContent = criticalCount;
    }
    if (warningElement) {
        warningElement.textContent = warningCount;
    }
    if (normalElement) {
        normalElement.textContent = normalCount;
    }
}

// Actualizar la tabla con variantes reales
function updateTable(variants) {
    const tbody = document.querySelector('.inventory-table tbody');
    if (!tbody) {
        console.error('No se encontró el tbody de la tabla');
        return;
    }
    
    tbody.innerHTML = ''; // Limpiar tabla existente

    if (variants.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
                🎉 ¡Excelente! No hay productos con stock bajo en este momento
            </td>
        `;
        tbody.appendChild(emptyRow);
        return;
    }

    variants.forEach(variant => {
        // Determinar estado basado en stock
        let statusClass, statusText;
        if (variant.stock <= 5) {
            statusClass = 'stock-low';
            statusText = 'Crítico';
        } else if (variant.stock <= 15) {
            statusClass = 'stock-warning';
            statusText = 'Bajo';
        } else {
            statusClass = 'stock-normal';
            statusText = 'Normal';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${variant.product?.name || 'Nombre no disponible'} (Talla ${variant.size})</td>
            <td>${getCategoryFromProduct(variant.product)}</td>
            <td class="${statusClass}">${variant.stock}</td>
            <td>${getMinimumStock(variant)}</td>
            <td><span class="${statusClass}">${statusText}</span></td>
            <td><button class="action-btn order-btn" data-product="${variant.product?.name || ''} - Talla ${variant.size}" data-id="${variant._id}">Realizar Pedido</button></td>
        `;
        tbody.appendChild(row);
    });

    console.log(`Tabla actualizada con ${variants.length} variantes de productos`);
    
    // Re-inicializar botones de pedido para los nuevos elementos
    initializeOrderButtons();
}

// Función auxiliar para determinar categoría
function getCategoryFromProduct(product) {
    if (product?.name) {
        const name = product.name.toLowerCase();
        if (name.includes('hoodie') || name.includes('sudadera')) return 'Hoodies';
        if (name.includes('jean') || name.includes('pantalón')) return 'Pantalones';
        if (name.includes('shirt') || name.includes('camisa') || name.includes('tshirt') || name.includes('t-shirt')) return 'Camisas';
        if (name.includes('short')) return 'Shorts';
        if (name.includes('crop')) return 'Tops';
    }
    return "Ropa";
}

// Función auxiliar para determinar stock mínimo
function getMinimumStock(variant) {
    const category = getCategoryFromProduct(variant.product);
    const minStockLevels = {
        'Hoodies': 15,
        'Pantalones': 20,
        'Camisas': 30,
        'Shorts': 25,
        'Tops': 15,
        'Ropa': 20
    };
    
    return minStockLevels[category] || 20;
}

// Funcionalidad de filtros
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover clase active de todos los botones
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Agregar clase active al botón clickeado
            this.classList.add('active');
            
            // Aplicar filtro a la tabla
            applyTableFilter(this.textContent);
        });
    });
}

function applyTableFilter(filterType) {
    const tableRows = document.querySelectorAll('tbody tr');
    
    tableRows.forEach(row => {
        const statusElement = row.querySelector('td:nth-child(5) span');
        if (!statusElement) return;
        
        const status = statusElement.textContent.toLowerCase();
        
        switch(filterType) {
            case 'Todos':
                row.style.display = '';
                break;
            case 'Crítico':
                row.style.display = status === 'crítico' ? '' : 'none';
                break;
            case 'Bajo':
                row.style.display = status === 'bajo' ? '' : 'none';
                break;
        }
    });
}

// Funcionalidad de botones de pedido
function initializeOrderButtons() {
    const orderButtons = document.querySelectorAll('.order-btn');
    
    orderButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productName = this.getAttribute('data-product');
            const variantId = this.getAttribute('data-id');
            openReorderForm(productName, variantId);
        });
    });
}

// Funcionalidad del formulario de pedido
function initializeOrderForm() {
    const closeFormBtn = document.getElementById('closeForm');
    const orderForm = document.getElementById('orderForm');
    
    if (closeFormBtn) {
        closeFormBtn.addEventListener('click', closeReorderForm);
    }
    
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitOrderForm();
        });
    }
}

function openReorderForm(productName, variantId) {
    const productNameInput = document.getElementById('productName');
    const reorderForm = document.getElementById('reorderForm');
    
    if (!productNameInput || !reorderForm) {
        console.error('Elementos del formulario no encontrados');
        return;
    }
    
    productNameInput.value = productName;
    reorderForm.style.display = 'block';
    
    // Guardar el ID de la variante en el formulario
    reorderForm.dataset.variantId = variantId;

    // Auto-seleccionar urgencia basada en el stock
    const stockCell = document.querySelector(`[data-id="${variantId}"]`)?.closest('tr')?.querySelector('td:nth-child(3)');
    if (stockCell) {
        const stockValue = parseInt(stockCell.textContent);
        const urgencySelect = document.getElementById('urgency');
        
        if (urgencySelect) {
            if (stockValue <= 3) {
                urgencySelect.value = 'critical';
            } else if (stockValue <= 10) {
                urgencySelect.value = 'urgent';
            } else {
                urgencySelect.value = 'normal';
            }
        }
    }
    
    reorderForm.scrollIntoView({ behavior: 'smooth' });
}

function closeReorderForm() {
    const reorderForm = document.getElementById('reorderForm');
    const orderForm = document.getElementById('orderForm');
    
    if (reorderForm) {
        reorderForm.style.display = 'none';
    }
    
    if (orderForm) {
        orderForm.reset();
    }
}

// Enviar formulario de pedido
async function submitOrderForm() {
    const productName = document.getElementById('productName').value;
    const variantId = document.getElementById('reorderForm').dataset.variantId;
    const supplierSelect = document.getElementById('supplier');
    const quantityInput = document.getElementById('quantity');
    const urgencySelect = document.getElementById('urgency');
    
    if (!supplierSelect || !quantityInput || !urgencySelect) {
        alert('Error: Formulario incompleto');
        return;
    }
    
    const supplier = supplierSelect.value;
    const quantity = quantityInput.value;
    const urgency = urgencySelect.value;
    
    // Validaciones
    if (!supplier) {
        alert('Por favor selecciona un proveedor');
        return;
    }
    
    if (quantity < 1) {
        alert('La cantidad debe ser mayor a 0');
        return;
    }
    
    try {
        // Enviar pedido al backend
        const response = await fetch("http://localhost:8080/orders", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                variantId: variantId,
                supplier: supplier,
                quantity: parseInt(quantity),
                urgency: urgency
            })
        });

        if (response.ok) {
            const orderData = await response.json();
            showOrderConfirmation({
                product: productName,
                supplier: supplierSelect.options[supplierSelect.selectedIndex].text,
                quantity: quantity,
                urgency: urgency,
                orderId: orderData.orderId || 'N/A'
            });
            
            // Recargar productos para actualizar estadísticas
            await loadProductsFromBackend();
        } else {
            const errorText = await response.text();
            alert('Error al realizar el pedido: ' + errorText);
        }
        
    } catch (error) {
        console.error('Error enviando pedido:', error);
        alert('Error de conexión al realizar el pedido');
    }
    
    closeReorderForm();
}

function showOrderConfirmation(orderDetails) {
    const urgencyLabels = {
        'normal': 'Normal',
        'urgent': 'Urgente',
        'critical': 'Crítico'
    };
    
    const message = `
        ✅ Pedido confirmado:
        
        Producto: ${orderDetails.product}
        Proveedor: ${orderDetails.supplier}
        Cantidad: ${orderDetails.quantity} unidades
        Urgencia: ${urgencyLabels[orderDetails.urgency]}
        ID de Pedido: ${orderDetails.orderId}
        
        El pedido ha sido registrado en el sistema.
    `;
    
    alert(message);
}

// Simular actualizaciones en tiempo real
function startRealTimeUpdates() {
    // Actualizar cada 30 segundos
    setInterval(async () => {
        await loadProductsFromBackend();
    }, 30000);
}

function updateAlertBanner(criticalCount) {
    const alertBanner = document.querySelector('.alert-banner');
    if (!alertBanner) return;
    
    const alertMessage = alertBanner.querySelector('div p');
    if (alertMessage) {
        if (criticalCount > 0) {
            alertMessage.textContent = `${criticalCount} productos tienen niveles de inventario por debajo del mínimo. Se recomienda realizar pedidos de inmediato.`;
            alertBanner.style.display = 'flex';
        } else {
            alertBanner.style.display = 'none';
        }
    }
}

// Mostrar error
function showError(message) {
    const tbody = document.querySelector('.inventory-table tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px; color: #dc2626;">
                    ❌ ${message}
                </td>
            </tr>
        `;
    }
}

// Funcionalidad adicional para navegación
document.querySelectorAll('.nav-links li').forEach(item => {
    item.addEventListener('click', function() {
        // Remover clase active de todos los items
        document.querySelectorAll('.nav-links li').forEach(li => {
            li.classList.remove('active');
        });
        
        // Agregar clase active al item clickeado
        this.classList.add('active');
    });
});