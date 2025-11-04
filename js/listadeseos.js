// wishlist.js

document.addEventListener('DOMContentLoaded', function() {
    // Eliminar producto de la lista
    const removeButtons = document.querySelectorAll('.remove-wishlist');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const wishlistItem = this.closest('.wishlist-item');
            wishlistItem.style.animation = 'fadeOut 0.3s ease';
            
            setTimeout(() => {
                wishlistItem.remove();
                updateWishlistSummary();
                checkEmptyWishlist();
            }, 300);
        });
    });

    // Mover al carrito
    const moveToCartButtons = document.querySelectorAll('.move-to-cart');
    moveToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productName = this.closest('.item-details').querySelector('h3').textContent;
            alert(`¡${productName} agregado al carrito!`);
            // Aquí iría la lógica para agregar al carrito
        });
    });

    // Comprar ahora
    const buyNowButtons = document.querySelectorAll('.buy-now');
    buyNowButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productName = this.closest('.item-details').querySelector('h3').textContent;
            alert(`Redirigiendo a compra de: ${productName}`);
            // Aquí iría la lógica para comprar directamente
        });
    });

    // Limpiar toda la lista
    const clearAllButton = document.querySelector('.clear-all');
    if (clearAllButton) {
        clearAllButton.addEventListener('click', function() {
            if (confirm('¿Estás seguro de que quieres limpiar toda tu lista de deseos?')) {
                const wishlistItems = document.querySelector('.wishlist-items');
                wishlistItems.style.animation = 'fadeOut 0.5s ease';
                
                setTimeout(() => {
                    wishlistItems.innerHTML = '';
                    updateWishlistSummary();
                    checkEmptyWishlist();
                }, 500);
            }
        });
    }

    // Seguir comprando
    const continueShoppingButton = document.querySelector('.continue-shopping');
    if (continueShoppingButton) {
        continueShoppingButton.addEventListener('click', function() {
            window.location.href = 'main.html';
        });
    }

    // Actualizar resumen
    function updateWishlistSummary() {
        const itemCount = document.querySelectorAll('.wishlist-item').length;
        const summaryCount = document.querySelector('.summary-item:first-child span:last-child');
        const summaryTotal = document.querySelector('.summary-item:last-child span:last-child');
        
        if (summaryCount) {
            summaryCount.textContent = itemCount;
        }
        
        // Calcular total (esto es un ejemplo, deberías tener los precios reales)
        let total = 0;
        document.querySelectorAll('.wishlist-item').forEach(item => {
            const priceText = item.querySelector('.item-price').textContent;
            const price = parseFloat(priceText.replace('$', '').replace(' MXN', '').replace(',', ''));
            total += price;
        });
        
        if (summaryTotal) {
            summaryTotal.textContent = `$${total.toFixed(2)} MXN`;
        }
    }

    // Verificar si la lista está vacía
    function checkEmptyWishlist() {
        const wishlistItems = document.querySelector('.wishlist-items');
        const emptyWishlist = document.querySelector('.empty-wishlist');
        const wishlistContent = document.querySelector('.wishlist-content');
        
        if (wishlistItems.children.length === 0) {
            wishlistContent.style.display = 'none';
            emptyWishlist.style.display = 'block';
        } else {
            wishlistContent.style.display = 'grid';
            emptyWishlist.style.display = 'none';
        }
    }

    // Inicializar
    updateWishlistSummary();
    checkEmptyWishlist();
});

// Animación CSS para fadeOut
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(-100px); }
    }
`;
document.head.appendChild(style);