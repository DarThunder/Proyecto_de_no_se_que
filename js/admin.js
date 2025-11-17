document.addEventListener('DOMContentLoaded', async () => {
    // ------------------------------------------------------
    // 1. VERIFICACIÓN DE SEGURIDAD Y MENÚ (Se ejecuta en TODAS las páginas)
    // ------------------------------------------------------
    try {
        const meResponse = await fetch("http://localhost:8080/users/me", {
            method: "GET",
            credentials: "include",
        });

        if (!meResponse.ok) throw new Error("No autorizado");

        const userInfo = await meResponse.json();

        // A) Verificación básica de acceso (Admin o Gerente)
        if (!userInfo.role || userInfo.role.permission_ring > 1) {
             throw new Error("Acceso denegado");
        }

        // B) Mostrar nombre de usuario (Existe en todas las páginas)
        const usernameDisplay = document.getElementById('admin-username');
        if (usernameDisplay) {
            usernameDisplay.textContent = userInfo.username || 'Usuario';
        }

        // C) LÓGICA DE RESTRICCIÓN DE MENÚ (Aquí ocultamos las opciones)
        // Si NO es Admin Supremo (Ring 0), ocultamos las opciones críticas
        if (userInfo.role.permission_ring !== 0) {
            const restrictedPages = [
                "GestionProduc.html",      // Gestión Productos
                "gestion_usuarios.html",   // Gestión Usuarios
                "GestionCategorias.html"   // Gestión Categorías
            ];

            restrictedPages.forEach(page => {
                // Busamos cualquier enlace que apunte a estas páginas
                const linkElement = document.querySelector(`a[href="${page}"]`);
                if (linkElement) {
                    // Ocultamos el <li> completo que contiene el enlace
                    linkElement.parentElement.style.display = 'none';
                }
            });
            
            // OPCIONAL: Si el usuario intenta entrar directamente por URL a una página prohibida, lo sacamos
            // Obtenemos el nombre del archivo actual (ej: "GestionProduc.html")
            const path = window.location.pathname;
            const currentPage = path.substring(path.lastIndexOf('/') + 1);
            
            if (restrictedPages.includes(currentPage)) {
                alert("No tienes permisos para acceder a esta sección.");
                window.location.href = 'admin.html'; // De vuelta al dashboard
            }
        }

        // ------------------------------------------------------
        // 2. CARGA DE ELEMENTOS ESPECÍFICOS (Solo si existen en la página)
        // ------------------------------------------------------
        
        // Solo cargamos estadísticas si estamos en el Dashboard (buscando un elemento único del dashboard)
        if (document.getElementById('stats-online-revenue')) {
            await loadDashboardStats();
        }

        // Solo cargamos lógica de Términos y Condiciones si existe el editor
        if (document.getElementById('terminos-textarea')) {
            // Aquí llamas a tu lógica de cargar términos (puedes encapsularla en una función si quieres)
            // o dejar el código que ya tenías, pero asegurándote de que verifique `if (textarea)` como ya hacías.
        }

    } catch (error) {
        console.error("Error de autenticación:", error);
        alert("Sesión no válida o permisos insuficientes.");
        window.location.href = 'login.html';
    }

    // ------------------------------------------------------
    // 3. LOGOUT Y OTRAS UTILIDADES
    // ------------------------------------------------------
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch("http://localhost:8080/auth/logout", { method: "POST", credentials: "include" });
            } catch (err) { console.error(err); }
            finally { window.location.href = 'login.html'; }
        });
    }

    // Inicializar modal de códigos de barras (función ya existente al final de tu archivo)
    initializeBarcodesModal();
});

/**
 * Carga las estadísticas del dashboard (HU 27)
 */
async function loadDashboardStats() {
    try {
        const response = await fetch("http://localhost:8080/reports/sales-by-channel", {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('No se pudieron cargar las estadísticas');
        }

        const stats = await response.json(); // { online: {...}, pos: {...} }

        // Función para formatear a moneda
        const formatCurrency = (amount) => new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount || 0);

        // Actualizar el HTML
        document.getElementById('stats-online-revenue').textContent = formatCurrency(stats.online.revenue);
        document.getElementById('stats-online-sales').textContent = stats.online.salesCount;
        document.getElementById('stats-pos-revenue').textContent = formatCurrency(stats.pos.revenue);
        document.getElementById('stats-pos-sales').textContent = stats.pos.salesCount;

    } catch (error) {
        console.error(error.message);
        // Si falla, los stats se quedan en 0, pero la app no se rompe.
    }
}


// Agregar esta función al final del admin.js existente

function initializeBarcodesModal() {
    const barcodesModal = document.getElementById('barcodes-modal');
    const barcodesMenuBtn = document.getElementById('barcodes-menu-btn');
    const closeBtn = barcodesModal.querySelector('.close');
    
    // Elementos del modal de códigos
    const productSelect = document.getElementById('productSelect');
    const generateBtn = document.getElementById('generateBtn');
    const printBtn = document.getElementById('printBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const barcodeResult = document.getElementById('barcodeResult');
    const productDisplay = document.getElementById('productDisplay');
    const productDetails = document.getElementById('productDetails');
    const barcodeText = document.getElementById('barcodeText');
    const loadingSection = document.getElementById('loadingSection');
    const barcodeSvg = document.getElementById('barcode');
    
    let products = [];
    let selectedProduct = null;

    // Abrir modal
    if (barcodesMenuBtn) {
        barcodesMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            barcodesModal.style.display = 'block';
            loadProducts();
        });
    }

    // Cerrar modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            barcodesModal.style.display = 'none';
        });
    }

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === barcodesModal) {
            barcodesModal.style.display = 'none';
        }
    });

    // Cargar productos
    async function loadProducts() {
        showLoading(true);
        try {
            const response = await fetch('http://localhost:8080/products');
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const variants = await response.json();
            
            products = variants.map(variant => ({
                id: variant._id,
                name: variant.product?.name || 'Producto sin nombre',
                base_price: variant.product?.base_price || 0,
                description: variant.product?.description || '',
                category: variant.product?.category || 'unisex',
                size: variant.size,
                sku: variant.sku,
                stock: variant.stock,
                image_url: variant.product?.image_url || 'sources/img/logo_negro.png'
            }));
            
            updateProductSelect();
            
        } catch (error) {
            console.error('Error cargando productos:', error);
            showNotification('Error al cargar los productos: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }

    function updateProductSelect() {
        productSelect.innerHTML = '<option value="">-- Selecciona un producto --</option>';
        
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} - ${product.size} (SKU: ${product.sku}) - $${product.base_price.toFixed(2)}`;
            productSelect.appendChild(option);
        });
    }

    function stringToConsistentNumber(str) {
        str = str.toLowerCase();
        
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        hash = Math.abs(hash);
        
        let numericString = hash.toString();
        while (numericString.length < 8) {
            numericString = '0' + numericString;
        }
        
        return numericString.substring(0, 12);
    }

    function generateBarcode(product) {
        if (!product) {
            showNotification('Por favor, selecciona un producto', 'warning');
            return;
        }

        const barcodeValue = stringToConsistentNumber(product.name + product.sku);
        
        productDisplay.textContent = product.name;
        productDetails.innerHTML = `
            <div class="product-info-detail">
                <strong>SKU:</strong> ${product.sku} | 
                <strong>Talla:</strong> ${product.size} | 
                <strong>Precio:</strong> $${product.base_price.toFixed(2)} | 
                <strong>Stock:</strong> ${product.stock}
            </div>
        `;
        
        barcodeSvg.innerHTML = '';
        
        JsBarcode("#barcode", barcodeValue, {
            format: "CODE128",
            lineColor: "#000000",
            width: 2,
            height: 100,
            displayValue: true,
            fontSize: 16,
            margin: 10,
            background: "#ffffff"
        });
        
        barcodeSvg.setAttribute('style', 'display: block; background: white;');
        barcodeText.textContent = `Código: ${barcodeValue}`;
        barcodeResult.classList.remove('hidden');
    }

    function showLoading(show) {
        if (show) {
            loadingSection.classList.remove('hidden');
        } else {
            loadingSection.classList.add('hidden');
        }
    }

    function applyPrintStyles() {
        const paths = barcodeSvg.querySelectorAll('path');
        const rects = barcodeSvg.querySelectorAll('rect');
        const texts = barcodeSvg.querySelectorAll('text');
        
        barcodeSvg.style.background = 'white';
        barcodeSvg.style.border = '1px solid #ccc';
        barcodeSvg.style.padding = '10px';
        
        paths.forEach(path => {
            if (path.getAttribute('fill') !== '#ffffff') {
                path.style.fill = '#000000';
                path.style.stroke = '#000000';
            }
        });
        
        rects.forEach(rect => {
            if (rect.getAttribute('fill') === '#ffffff') {
                rect.style.fill = '#ffffff';
                rect.style.stroke = '#ffffff';
            }
        });
        
        texts.forEach(text => {
            text.style.fill = '#000000';
            text.style.stroke = 'none';
        });
    }

    function restoreNormalStyles() {
        barcodeSvg.style.background = '';
        barcodeSvg.style.border = '';
        barcodeSvg.style.padding = '';
    }

    // Event listeners
    generateBtn.addEventListener('click', function() {
        if (productSelect.value) {
            const product = products.find(p => p.id === productSelect.value);
            if (product) {
                generateBarcode(product);
            }
        } else {
            showNotification('Por favor, selecciona un producto de la lista', 'warning');
        }
    });

    productSelect.addEventListener('change', function() {
        if (this.value) {
            const product = products.find(p => p.id === this.value);
            if (product) {
                selectedProduct = product;
                generateBarcode(product);
            }
        } else {
            selectedProduct = null;
            barcodeResult.classList.add('hidden');
        }
    });

    printBtn.addEventListener('click', function() {
        if (!selectedProduct) {
            showNotification('No hay ningún producto seleccionado para imprimir', 'warning');
            return;
        }
        
        applyPrintStyles();
        setTimeout(() => {
            window.print();
            setTimeout(restoreNormalStyles, 500);
        }, 100);
    });

    refreshBtn.addEventListener('click', function() {
        loadProducts();
    });
}

// Llamar la función de inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // ... código existente del admin.js ...
    
    // Inicializar el modal de códigos de barras
    initializeBarcodesModal();
});