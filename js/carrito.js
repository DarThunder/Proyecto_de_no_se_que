document.addEventListener("DOMContentLoaded", () => {
    // Apenas cargue la página, busca los items del carrito
    loadCartItems();
});

async function loadCartItems() {
    const token = localStorage.getItem('jwt_token');
    const cartItemsContainer = document.querySelector(".cart-items");
    
    // Si no hay token, no podemos pedir nada.
    if (!token) {
        cartItemsContainer.innerHTML = "<h3 style='text-align: center; color: white;'>Debes iniciar sesión para ver tu carrito.</h3>";
        return;
    }

    try {
        // Hacemos la petición GET a la ruta /cart que creamos
        const response = await fetch("http://localhost:8080/cart", {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("No se pudo cargar el carrito.");
        }
        
        const cart = await response.json();

        // Si el carrito está vacío
        if (!cart || cart.items.length === 0) {
            cartItemsContainer.innerHTML = "<h3 style='text-align: center; color: white;'>Tu carrito está vacío.</h3>";
            updateSummary(0); // Actualiza el resumen a $0
            return;
        }

        // Limpia los items estáticos que están en el HTML
        cartItemsContainer.innerHTML = ""; 
        let subtotal = 0;

        // Itera y construye el HTML para cada item
        cart.items.forEach(item => {
            const variant = item.variant;
            const product = variant.product; // El producto base poblado
            
            // Usamos el precio base del producto
            const itemPrice = product.base_price; 
            const itemTotal = itemPrice * item.quantity;
            subtotal += itemTotal;

            const cartItemHTML = `
                <div class="cart-item" data-variant-id="${variant._id}">
                    <img src="../sources/img/camisa.jpg" alt="${product.name}"> <div class="item-details">
                        <h3>${product.name.toUpperCase()} (${variant.size})</h3>
                        <p class="item-price">$${itemPrice.toFixed(2)} MXN</p>
                    </div>
                    <div class="item-quantity">
                        <label for="qty-${variant._id}" class="sr-only">Cantidad</label>
                        <input type="number" id="qty-${variant._id}" value="${item.quantity}" min="1" max="10">
                    </div>
                    <button class="item-remove" title="Eliminar producto">&times;</button>
                </div>
            `;
            cartItemsContainer.innerHTML += cartItemHTML;
        });

        // Actualiza el resumen de compra
        updateSummary(subtotal);

    } catch (error) {
        console.error(error);
        cartItemsContainer.innerHTML = "<h3 style='text-align: center; color: red;'>Error al cargar el carrito.</h3>";
    }
}

// Función para actualizar el resumen de compra
function updateSummary(subtotal) {
    const cartSummary = document.querySelector(".cart-summary");
    
    // Si no hay subtotal, el envío es 0
    const envio = (subtotal > 0) ? 99.00 : 0; 
    const total = subtotal + envio;

    // Actualiza los campos en el HTML
    const subtotalEl = cartSummary.querySelector(".summary-row:nth-child(2) span:last-child");
    const envioEl = cartSummary.querySelector(".summary-row:nth-child(3) span:last-child");
    const totalEl = cartSummary.querySelector(".summary-total span:last-child");

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (envioEl) envioEl.textContent = `$${envio.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}