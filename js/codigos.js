document.addEventListener('DOMContentLoaded', function() {
    const productSelect = document.getElementById('productSelect');
    const generateBtn = document.getElementById('generateBtn');
    const printBtn = document.getElementById('printBtn');
    const backBtn = document.getElementById('backBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const barcodeResult = document.getElementById('barcodeResult');
    const productDisplay = document.getElementById('productDisplay');
    const productDetails = document.getElementById('productDetails');
    const barcodeText = document.getElementById('barcodeText');
    const loadingSection = document.getElementById('loadingSection');
    const barcodeSvg = document.getElementById('barcode');
    
    let products = [];
    let selectedProduct = null;

    // Cargar productos al iniciar
    loadProducts();

    // Función para cargar productos desde la API
    async function loadProducts() {
        showLoading(true);
        try {
            const response = await fetch('http://localhost:8080/products');
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const variants = await response.json();
            
            // Procesar las variantes de productos
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
            alert('Error al cargar los productos: ' + error.message);
        } finally {
            showLoading(false);
        }
    }

    // Actualizar el select de productos
    function updateProductSelect() {
        productSelect.innerHTML = '<option value="">-- Selecciona un producto --</option>';
        
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} - ${product.size} (SKU: ${product.sku}) - $${product.base_price.toFixed(2)}`;
            productSelect.appendChild(option);
        });
    }

    // Seleccionar producto
    function selectProduct(product) {
        selectedProduct = product;
        productSelect.value = product.id;
        generateBarcode(product);
    }

    // Función hash simple para convertir texto a valor numérico consistente
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

    // Función para generar el código de barras
    function generateBarcode(product) {
        if (!product) {
            alert('Por favor, selecciona un producto');
            return;
        }

        // Convertir el nombre del producto a un código numérico consistente
        const barcodeValue = stringToConsistentNumber(product.name + product.sku);
        
        // Mostrar información del producto
        productDisplay.textContent = product.name;
        productDetails.innerHTML = `
            <div class="product-info-detail">
                <strong>SKU:</strong> ${product.sku} | 
                <strong>Talla:</strong> ${product.size} | 
                <strong>Precio:</strong> $${product.base_price.toFixed(2)} | 
                <strong>Stock:</strong> ${product.stock}
            </div>
        `;
        
        // Limpiar SVG anterior
        barcodeSvg.innerHTML = '';
        
        // Generar el código de barras
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

    // Mostrar/ocultar loading
    function showLoading(show) {
        if (show) {
            loadingSection.classList.remove('hidden');
        } else {
            loadingSection.classList.add('hidden');
        }
    }

    // Event Listeners
    generateBtn.addEventListener('click', function() {
        if (productSelect.value) {
            const product = products.find(p => p.id === productSelect.value);
            if (product) {
                generateBarcode(product);
            }
        } else {
            alert('Por favor, selecciona un producto de la lista');
        }
    });

    productSelect.addEventListener('change', function() {
        if (this.value) {
            const product = products.find(p => p.id === this.value);
            if (product) {
                selectProduct(product);
            }
        } else {
            selectedProduct = null;
            barcodeResult.classList.add('hidden');
        }
    });

    printBtn.addEventListener('click', function() {
        if (!selectedProduct) {
            alert('No hay ningún producto seleccionado para imprimir');
            return;
        }
        
        applyPrintStyles();
        setTimeout(() => {
            window.print();
            setTimeout(restoreNormalStyles, 500);
        }, 100);
    });

    function applyPrintStyles() {
        const barcodeSvg = document.getElementById('barcode');
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
        const barcodeSvg = document.getElementById('barcode');
        barcodeSvg.style.background = '';
        barcodeSvg.style.border = '';
        barcodeSvg.style.padding = '';
    }
    
    backBtn.addEventListener('click', function() {
        window.location.href = 'admin.html';
    });

    refreshBtn.addEventListener('click', function() {
        loadProducts();
    });
});