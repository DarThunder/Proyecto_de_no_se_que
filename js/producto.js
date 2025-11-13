// js/producto.js

document.addEventListener("DOMContentLoaded", () => {
    // 1. Leer el ID de la variante desde la URL
    const params = new URLSearchParams(window.location.search);
    const variantId = params.get('id');

    const addToCartBtn = document.getElementById('add-to-cart-btn');

    if (variantId) {
        // 2. Cargar los detalles del producto
        loadProductDetails(variantId);

        // 3. Configurar el botón de "Agregar al Carrito"
        addToCartBtn.addEventListener('click', async () => {
            const quantity = parseInt(document.getElementById('quantity-input').value);
            
            // Lógica visual del botón
            addToCartBtn.textContent = 'AGREGANDO...';
            addToCartBtn.classList.add('loading');
            addToCartBtn.disabled = true;

            try {
                // Llamada a la API (idéntica a la de categoria.js)
                const response = await fetch("http://localhost:8080/cart/items", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ variantId: variantId, quantity: quantity }),
                });

                if (response.ok) {
                    addToCartBtn.textContent = 'AGREGADO ✓';
                    addToCartBtn.classList.remove('loading');
                    addToCartBtn.classList.add('success');
                } else {
                    if (response.status === 401 || response.status === 403) {
                        alert("Debes iniciar sesión para agregar productos.");
                        window.location.href = "login.html"; 
                    }
                    throw new Error("Error al agregar");
                }
            } catch (error) {
                addToCartBtn.textContent = "ERROR AL AGREGAR";
                addToCartBtn.classList.remove('loading');
            } finally {
                setTimeout(() => {
                    addToCartBtn.textContent = 'AGREGAR AL CARRITO';
                    addToCartBtn.classList.remove('success');
                    addToCartBtn.disabled = false;
                }, 2000);
            }
        });

    } else {
        // No se encontró ID
        document.getElementById('product-name').textContent = "Producto no encontrado";
    }
});

async function loadProductDetails(variantId) {
    try {
        // 4. Llamamos al endpoint de la API que busca por ID
        // (Este endpoint ya existe en tu productRoutes.js)
        const response = await fetch(`http://localhost:8080/products/${variantId}`);
        
        if (!response.ok) {
            throw new Error('Producto no encontrado');
        }

        const variant = await response.json();
        const product = variant.product;

        // 5. Llenamos el HTML con los datos
        document.getElementById('product-main-image').src = `../${product.image_url}`;
        document.getElementById('product-main-image').alt = product.name;
        document.getElementById('product-name').textContent = product.name;
        document.getElementById('product-price').textContent = `$${product.base_price.toFixed(2)} MXN`;
        document.getElementById('product-size').textContent = variant.size;
        document.getElementById('product-description').textContent = product.description || "Este producto no tiene descripción.";
        
        // Actualizamos el 'max' del input de cantidad según el stock
        document.getElementById('quantity-input').max = variant.stock;

    } catch (error) {
        console.error('Error al cargar el producto:', error);
        document.getElementById('product-name').textContent = "Error al cargar";
        document.getElementById('product-description').textContent = error.message;
    }
}