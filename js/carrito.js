// js/carrito.js
document.addEventListener("DOMContentLoaded", () => {
    loadCartItems();
});

async function loadCartItems() {
    const token = localStorage.getItem('jwt_token');
    const cartItemsContainer = document.querySelector(".cart-items");
    const cartSummary = document.querySelector(".cart-summary");

    if (!token) {
        cartItemsContainer.innerHTML = "<h1>Debes iniciar sesión para ver tu carrito</h1>";
        return;
    }

    try {
        const response = await fetch("http://localhost:8080/cart", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error("No se pudo cargar el carrito.");

        const cart = await response.json();

        if (cart.items.length === 0) {
            cartItemsContainer.innerHTML = "<h1>Tu carrito está vacío</h1>";
            return;
        }

        // Limpia los items estáticos
        cartItemsContainer.innerHTML = ""; 
        let subtotal = 0;

        // Renderiza los items
        cart.items.forEach(item => {
            const variant = item.variant;
            const product = variant.product;
            const itemPrice = product.base_price; // O el precio de la variante si lo tienes
            const itemTotal = itemPrice * item.quantity;
            subtotal += itemTotal;

            const cartItemHTML = `
                <div class="cart-item" data-variant-id="${variant._id}">
                    <img src="../sources/img/hoodie.jpg" alt="${product.name}"> <div class="item-details">
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

        // Actualiza el resumen
        const envio = 99.00; // O calcularlo
        const total = subtotal + envio;
        
        cartSummary.querySelector(".summary-row:nth-child(2) span:last-child").textContent = `$${subtotal.toFixed(2)}`;
        cartSummary.querySelector(".summary-row:nth-child(3) span:last-child").textContent = `$${envio.toFixed(2)}`;
        cartSummary.querySelector(".summary-total span:last-child").textContent = `$${total.toFixed(2)}`;

        // (Aquí deberías agregar los event listeners para los botones de eliminar y cambiar cantidad)

    } catch (error) {
        console.error(error);
        cartItemsContainer.innerHTML = "<h1>Error al cargar el carrito.</h1>";
    }
}