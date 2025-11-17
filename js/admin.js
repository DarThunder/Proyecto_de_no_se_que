document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar la autenticación y permisos
    try {
        const meResponse = await fetch("http://localhost:8080/users/me", {
            method: "GET",
            credentials: "include", // Envía la cookie de sesión
        });

        if (!meResponse.ok) {
            // Si la sesión no es válida (ej. 401 Unauthorized)
            throw new Error("No autorizado. Redirigiendo al login.");
        }

        const userInfo = await meResponse.json();

        // Verificamos el rol (Admin=0, Gerente=1)
        if (userInfo.role && userInfo.role.permission_ring <= 1) {
            // El usuario es Admin o Gerente, cargamos sus datos
            document.getElementById('admin-username').textContent = userInfo.username || 'Admin';
            
            // --- ¡NUEVO! ---
            // Una vez autenticado, carga las estadísticas del dashboard
            await loadDashboardStats();

        } else {
            // No es Admin ni Gerente
            throw new Error("Acceso denegado. Redirigiendo al login.");
        }

    } catch (error) {
        console.error(error.message);
        // Si falla la autenticación, lo sacamos al login
        alert("Acceso denegado. Debes iniciar sesión como Gerente o Administrador.");
        window.location.href = 'login.html';
    }

    // 2. Lógica del botón de Cerrar Sesión
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
                console.error("Error al cerrar sesión (quizás el servidor ya te desconectó)", err);
            } finally {
                // Siempre redirigir al login
                alert("Sesión cerrada.");
                window.location.href = 'login.html';
            }
        });
    }

    // --- Cargar Términos y Condiciones del Usuario ---
    
    // 1. MOSTRAR TERMINOS Y CONDICIONES
    // 1. Seleccionamos los elementos del DOM que acabamos de crear
    const textarea = document.getElementById('terminos-textarea');
    const saveBtn = document.getElementById('guardar-terminos-btn');
    const feedback = document.getElementById('terminos-feedback');

    // 2. Función para CARGAR el contenido actual
    const cargarTerminos = async () => {
        // Si el textarea no existe en esta página, no hacemos nada.
        if (!textarea) return; 
        
        try {
            // Hacemos una petición GET a la ruta pública (no necesita token)
            const res = await fetch('http://localhost:8080/content/terms'); 
            const data = await res.json();
            
            if (res.ok) {
                // Si todo va bien, ponemos el texto de la BD en el textarea
                textarea.value = data.htmlContent;
            } else {
                // Si la API devuelve un error, lo mostramos
                throw new Error(data.message);
            }
        } catch (error) {
            feedback.textContent = `Error al cargar: ${error.message}`;
            feedback.style.color = 'red';
        }
    };

    // 3. Función para GUARDAR los cambios
    const guardarTerminos = async () => {
        // Damos feedback visual al admin
        feedback.textContent = 'Guardando...';
        feedback.style.color = 'blue';

        try {
            // Hacemos una petición PUT a la ruta protegida
            const res = await fetch('http://localhost:8080/content/terms', { 
                method: 'PUT', // Usamos el método PUT
                headers: {
                    'Content-Type': 'application/json',
                },

                credentials: "include",
                // Enviamos el contenido actual del textarea en el body, como JSON
                body: JSON.stringify({ htmlContent: textarea.value })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                // Si todo va bien, mostramos mensaje de éxito
                feedback.textContent = '¡Guardado exitosamente!';
                feedback.style.color = 'green';
            } else {
                // Si la API devuelve un error (ej. "sin permisos"), lo mostramos
                throw new Error(data.message || 'Error del servidor');
            }
        } catch (error) {
            feedback.textContent = `Error al guardar: ${error.message}`;
            feedback.style.color = 'red';
        }
    };
    
    // 4. Asignamos los eventos
    // Solo asignamos el evento si el botón existe en la página actual
    if (saveBtn) {
        saveBtn.addEventListener('click', guardarTerminos);
    }
    if (textarea) {
        // Si 'textarea' existe, cargamos el contenido
        cargarTerminos();
    }
});



// --- ========= FUNCIÓN NUEVA PARA HU 27 ========= ---

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