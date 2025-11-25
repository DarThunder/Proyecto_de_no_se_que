document.addEventListener('DOMContentLoaded', () => {
    // admin.js ya verifica la sesión aquí
    loadWebOrders();
    setupModal();
});

async function loadWebOrders() {
    const tableBody = document.getElementById('orders-table-body');
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Cargando pedidos...</td></tr>';

    try {
        const response = await fetch('http://localhost:8080/orders/web-orders/all', {
            credentials: 'include'
        });

        if (!response.ok) throw new Error("Error al cargar pedidos");

        const orders = await response.json();

        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No hay pedidos online registrados.</td></tr>';
            return;
        }

        tableBody.innerHTML = '';

        orders.forEach(order => {
            // Formateo de datos
            const date = new Date(order.createdAt).toLocaleDateString('es-MX', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'
            });
            const user = order.user ? order.user.username : 'Usuario eliminado';
            const addressObj = order.shipping_address || {};
            const address = `${addressObj.address}, ${addressObj.city}, ${addressObj.state}`;
            const total = `$${order.total.toFixed(2)}`;
            const tracking = order.tracking_number || 'N/A';
            
            // Clases para badges
            let statusClass = 'bg-processing';
            let statusText = 'Procesando';
            
            if (order.shipping_status === 'Shipped') {
                statusClass = 'bg-shipped';
                statusText = 'Enviado';
            } else if (order.shipping_status === 'Delivered') {
                statusClass = 'bg-delivered';
                statusText = 'Entregado';
            } else if (order.shipping_status === 'Cancelled') {
                statusClass = 'bg-cancelled';
                statusText = 'Cancelado';
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${date}</td>
                <td><small>${order._id.slice(-6).toUpperCase()}</small></td>
                <td>${user}</td>
                <td title="${address}" style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${address}</td>
                <td>${total}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>${tracking}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openShippingModal('${order._id}', '${order.shipping_status}', '${order.tracking_number || ''}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error(error);
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: var(--danger);">Error de conexión con el servidor.</td></tr>';
    }
}

function setupModal() {
    const modal = document.getElementById('shipping-modal');
    const closeBtn = modal.querySelector('.close');
    const cancelBtn = document.getElementById('cancel-modal-btn');
    const form = document.getElementById('shipping-form');
    const statusSelect = document.getElementById('shipping-status');
    const trackingGroup = document.getElementById('tracking-group');

    // Mostrar input de tracking solo si se selecciona "Enviado"
    statusSelect.addEventListener('change', (e) => {
        if (e.target.value === 'Shipped') {
            trackingGroup.style.display = 'block';
            document.getElementById('tracking-number').required = true;
        } else {
            trackingGroup.style.display = 'none';
            document.getElementById('tracking-number').required = false;
        }
    });

    const closeModal = () => { modal.style.display = 'none'; };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });

    // Manejar envío del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const orderId = document.getElementById('order-id').value;
        const status = document.getElementById('shipping-status').value;
        const tracking = document.getElementById('tracking-number').value;

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "Guardando...";

        try {
            const response = await fetch(`http://localhost:8080/orders/${orderId}/shipping-status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    status: status, 
                    tracking_number: tracking 
                })
            });

            if (!response.ok) throw new Error("Error actualizando estado");

            alert(`Estado actualizado a: ${status}. ${status === 'Shipped' ? '\n⚠️ El sistema marcará el pedido como "Entregado" automáticamente en 1 minuto.' : ''}`);
            
            closeModal();
            loadWebOrders(); // Recargar tabla

        } catch (error) {
            console.error(error);
            alert("Error al guardar los cambios.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Guardar Cambios";
        }
    });
}

// Función global para abrir modal
window.openShippingModal = function(id, currentStatus, currentTracking) {
    document.getElementById('order-id').value = id;
    const statusSelect = document.getElementById('shipping-status');
    statusSelect.value = currentStatus;
    document.getElementById('tracking-number').value = currentTracking;

    // Disparar evento change para mostrar/ocultar campo tracking
    statusSelect.dispatchEvent(new Event('change'));

    document.getElementById('shipping-modal').style.display = 'block';
}