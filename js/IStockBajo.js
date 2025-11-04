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
    
    // Simular actualizaciones en tiempo real
    startRealTimeUpdates();
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
            openReorderForm(productName);
        });
    });
}

// Funcionalidad del formulario de pedido
function initializeOrderForm() {
    const closeFormBtn = document.getElementById('closeForm');
    const orderForm = document.getElementById('orderForm');
    
    // Cerrar formulario
    closeFormBtn.addEventListener('click', closeReorderForm);
    
    // Enviar formulario
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        submitOrderForm();
    });
}

function openReorderForm(productName) {
    document.getElementById('productName').value = productName;
    document.getElementById('reorderForm').style.display = 'block';
    
    // Auto-seleccionar urgencia basada en el stock
    const stockCell = document.querySelector(`[data-product="${productName}"]`).closest('tr').querySelector('td:nth-child(3)');
    const stockValue = parseInt(stockCell.textContent);
    
    const urgencySelect = document.getElementById('urgency');
    if (stockValue <= 3) {
        urgencySelect.value = 'critical';
    } else if (stockValue <= 10) {
        urgencySelect.value = 'urgent';
    } else {
        urgencySelect.value = 'normal';
    }
    
    // Scroll suave al formulario
    document.getElementById('reorderForm').scrollIntoView({ behavior: 'smooth' });
}

function closeReorderForm() {
    document.getElementById('reorderForm').style.display = 'none';
    document.getElementById('orderForm').reset();
}

function submitOrderForm() {
    const productName = document.getElementById('productName').value;
    const supplier = document.getElementById('supplier').options[document.getElementById('supplier').selectedIndex].text;
    const quantity = document.getElementById('quantity').value;
    const urgency = document.getElementById('urgency').value;
    
    // Validaciones
    if (!supplier) {
        alert('Por favor selecciona un proveedor');
        return;
    }
    
    if (quantity < 1) {
        alert('La cantidad debe ser mayor a 0');
        return;
    }
    
    // En una aplicación real, aquí enviaríamos los datos al servidor
    console.log('Pedido realizado:', {
        product: productName,
        supplier: supplier,
        quantity: quantity,
        urgency: urgency,
        date: new Date().toLocaleString()
    });
    
    // Mostrar confirmación
    showOrderConfirmation({
        product: productName,
        supplier: supplier,
        quantity: quantity,
        urgency: urgency
    });
    
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
        
        El pedido ha sido registrado en el sistema.
    `;
    
    alert(message);
}

// Simular actualizaciones en tiempo real
function startRealTimeUpdates() {
    setInterval(() => {
        updateStockNumbers();
    }, 15000); // Actualizar cada 15 segundos
}

function updateStockNumbers() {
    // Simular cambios aleatorios en el stock
    const lowStockElement = document.querySelector('.stat-card:nth-child(1) h3');
    const warningStockElement = document.querySelector('.stat-card:nth-child(2) h3');
    
    const currentLow = parseInt(lowStockElement.textContent);
    const currentWarning = parseInt(warningStockElement.textContent);
    
    // Pequeñas variaciones aleatorias
    const newLow = Math.max(5, currentLow + (Math.random() > 0.5 ? 1 : -1));
    const newWarning = Math.max(8, currentWarning + (Math.random() > 0.5 ? 1 : -1));
    
    lowStockElement.textContent = newLow;
    warningStockElement.textContent = newWarning;
    
    // Actualizar el mensaje de alerta
    updateAlertBanner(newLow);
}

function updateAlertBanner(criticalCount) {
    const alertBanner = document.querySelector('.alert-banner');
    const alertMessage = alertBanner.querySelector('div p');
    
    alertMessage.textContent = `${criticalCount} productos tienen niveles de inventario por debajo del mínimo. Se recomienda realizar pedidos de inmediato.`;
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
        
        // En una aplicación real, aquí cargaríamos el contenido correspondiente
        const sectionName = this.querySelector('a').textContent;
        console.log(`Navegando a: ${sectionName}`);
    });
});