document.addEventListener('DOMContentLoaded', function() {
    const productNameInput = document.getElementById('productName');
    const generateBtn = document.getElementById('generateBtn');
    const printBtn = document.getElementById('printBtn');
    const backBtn = document.getElementById('backBtn');
    const barcodeResult = document.getElementById('barcodeResult');
    const productDisplay = document.getElementById('productDisplay');
    const barcodeText = document.getElementById('barcodeText');
    const recentProductsList = document.getElementById('recentProductsList');
    const barcodeSvg = document.getElementById('barcode');
    
    // Almacenar productos recientes
    let recentProducts = JSON.parse(localStorage.getItem('recentProducts')) || [];
    updateRecentProductsList();
    
    // Función hash simple para convertir texto a valor numérico consistente
    function stringToConsistentNumber(str) {
        // Convertir a minúsculas para hacerlo case-insensitive
        str = str.toLowerCase();
        
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir a entero de 32 bits
        }
        
        // Asegurarse de que el número sea positiva
        hash = Math.abs(hash);
        
        // Convertir a cadena y asegurar que tenga al menos 8 dígitos
        let numericString = hash.toString();
        while (numericString.length < 8) {
            numericString = '0' + numericString;
        }
        
        // Limitar a 12 dígitos para formato estándar
        return numericString.substring(0, 12);
    }
    
    // Generar código de barras cuando se hace clic en el botón
    generateBtn.addEventListener('click', function() {
        const productName = productNameInput.value.trim();
        
        if (!productName) {
            alert('Por favor, ingresa un nombre de producto');
            return;
        }
        
        generateBarcode(productName);
        
        // Guardar en productos recientes (sin duplicados, usando minúsculas para comparar)
        const productNameLower = productName.toLowerCase();
        const exists = recentProducts.some(product => product.toLowerCase() === productNameLower);
        
        if (!exists) {
            recentProducts.unshift(productName);
            // Mantener solo los últimos 5 productos
            if (recentProducts.length > 5) {
                recentProducts = recentProducts.slice(0, 5);
            }
            localStorage.setItem('recentProducts', JSON.stringify(recentProducts));
            updateRecentProductsList();
        }
    });
    
    // Función para generar el código de barras
    function generateBarcode(productName) {
        // Convertir el nombre del producto a un código numérico consistente
        const barcodeValue = stringToConsistentNumber(productName);
        
        // Mostrar el nombre del producto
        productDisplay.textContent = productName;
        
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
        
        // Asegurar que el SVG tenga los atributos correctos para impresión
        barcodeSvg.setAttribute('style', 'display: block; background: white;');
        
        // Mostrar el valor del código de barras
        barcodeText.textContent = `Código: ${barcodeValue}`;
        
        // Mostrar la sección de resultados
        barcodeResult.classList.remove('hidden');
    }
    
    // Actualizar la lista de productos recientes
    function updateRecentProductsList() {
        recentProductsList.innerHTML = '';
        recentProducts.forEach(product => {
            const productTag = document.createElement('span');
            productTag.className = 'product-tag';
            productTag.textContent = product;
            productTag.addEventListener('click', function() {
                productNameInput.value = product;
                generateBarcode(product);
            });
            recentProductsList.appendChild(productTag);
        });
    }
    
    // Imprimir cuando se hace clic en el botón de imprimir
    // Reemplaza la función de impresión existente
printBtn.addEventListener('click', function() {
    // Primero aplicar estilos de impresión manualmente
    applyPrintStyles();
    
    // Pequeño delay para asegurar que los estilos se apliquen
    setTimeout(() => {
        window.print();
        
        // Restaurar estilos normales después de imprimir
        setTimeout(restoreNormalStyles, 500);
    }, 100);
});

// Función para aplicar estilos de impresión
function applyPrintStyles() {
    const barcodeSvg = document.getElementById('barcode');
    const paths = barcodeSvg.querySelectorAll('path');
    const rects = barcodeSvg.querySelectorAll('rect');
    const texts = barcodeSvg.querySelectorAll('text');
    
    // Aplicar estilos directos al SVG para impresión
    barcodeSvg.style.background = 'white';
    barcodeSvg.style.border = '1px solid #ccc';
    barcodeSvg.style.padding = '10px';
    
    // Asegurar que las barras sean negras
    paths.forEach(path => {
        if (path.getAttribute('fill') !== '#ffffff') {
            path.style.fill = '#000000';
            path.style.stroke = '#000000';
        }
    });
    
    // Asegurar que el fondo sea blanco
    rects.forEach(rect => {
        if (rect.getAttribute('fill') === '#ffffff') {
            rect.style.fill = '#ffffff';
            rect.style.stroke = '#ffffff';
        }
    });
    
    // Asegurar que el texto sea negro
    texts.forEach(text => {
        text.style.fill = '#000000';
        text.style.stroke = 'none';
    });
}

// Función para restaurar estilos normales
function restoreNormalStyles() {
    const barcodeSvg = document.getElementById('barcode');
    barcodeSvg.style.background = '';
    barcodeSvg.style.border = '';
    barcodeSvg.style.padding = '';
}
    
    // Regresar a admin.html cuando se hace clic en el botón de regresar
    backBtn.addEventListener('click', function() {
        window.location.href = 'admin.html';
    });
    
    // Permitir generar con la tecla Enter
    productNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            generateBtn.click();
        }
    });
    
    // Ejemplo de prueba al cargar la página
    if (recentProducts.length === 0) {
        productNameInput.value = "Producto Ejemplo";
        // Generar automáticamente el código de ejemplo
        setTimeout(() => {
            generateBtn.click();
        }, 500);
    }
});