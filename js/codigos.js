/**
 * @file js/codigos.js
 * @description Gestiona la interfaz de generación de códigos de barras para productos.
 * Permite seleccionar un producto, generar un código visual (usando JsBarcode) basado en su SKU/Nombre,
 * y ofrece funcionalidad para imprimir la etiqueta.
 */

/**
 * Inicializa el script cuando el DOM está listo.
 * @listens document#DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", function () {
  // Referencias a elementos del DOM
  const productSelect = document.getElementById("productSelect");
  const generateBtn = document.getElementById("generateBtn");
  const printBtn = document.getElementById("printBtn");
  const backBtn = document.getElementById("backBtn");
  const refreshBtn = document.getElementById("refreshBtn");
  const barcodeResult = document.getElementById("barcodeResult");
  const productDisplay = document.getElementById("productDisplay");
  const productDetails = document.getElementById("productDetails");
  const barcodeText = document.getElementById("barcodeText");
  const loadingSection = document.getElementById("loadingSection");
  const barcodeSvg = document.getElementById("barcode");

  /** * Almacena la lista de productos cargados desde la API.
   * @type {Array<Object>}
   */
  let products = [];

  /** * Producto actualmente seleccionado para generar el código.
   * @type {Object|null}
   */
  let selectedProduct = null;

  // Cargar productos al iniciar
  loadProducts();

  /**
   * Obtiene la lista de productos desde el backend.
   * Transforma la respuesta de variantes complejas a una estructura simple para el selector.
   * @async
   */
  async function loadProducts() {
    showLoading(true);
    try {
      const response = await fetch("http://localhost:8080/products");

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const variants = await response.json();

      // Procesar las variantes de productos para el uso local
      products = variants.map((variant) => ({
        id: variant._id,
        name: variant.product?.name || "Producto sin nombre",
        base_price: variant.product?.base_price || 0,
        description: variant.product?.description || "",
        category: variant.product?.category || "unisex",
        size: variant.size,
        sku: variant.sku,
        stock: variant.stock,
        image_url: variant.product?.image_url || "sources/img/logo_negro.png",
      }));

      updateProductSelect();
    } catch (error) {
      console.error("Error cargando productos:", error);
      alert("Error al cargar los productos: " + error.message);
    } finally {
      showLoading(false);
    }
  }

  /**
   * Llena el elemento `<select>` con las opciones de productos cargados.
   */
  function updateProductSelect() {
    productSelect.innerHTML =
      '<option value="">-- Selecciona un producto --</option>';

    products.forEach((product) => {
      const option = document.createElement("option");
      option.value = product.id;
      // Muestra información relevante en la opción (Nombre, Talla, SKU, Precio)
      option.textContent = `${product.name} - ${product.size} (SKU: ${
        product.sku
      }) - $${product.base_price.toFixed(2)}`;
      productSelect.appendChild(option);
    });
  }

  /**
   * Maneja la selección lógica de un producto.
   * @param {Object} product - El objeto producto seleccionado.
   */
  function selectProduct(product) {
    selectedProduct = product;
    productSelect.value = product.id;
    generateBarcode(product);
  }

  /**
   * Algoritmo de hash simple para generar un número consistente a partir de un texto.
   * Se usa para crear un valor numérico único para el código de barras basado en el nombre y SKU.
   * @param {string} str - Cadena de entrada (Nombre + SKU).
   * @returns {string} Cadena numérica de 12 dígitos (rellenada con ceros si es necesario).
   */
  function stringToConsistentNumber(str) {
    str = str.toLowerCase();

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convertir a entero de 32 bits
    }

    hash = Math.abs(hash);

    let numericString = hash.toString();
    // Asegurar longitud mínima
    while (numericString.length < 8) {
      numericString = "0" + numericString;
    }

    // Limitar a 12 dígitos para compatibilidad estándar (ej. EAN-like)
    return numericString.substring(0, 12);
  }

  /**
   * Genera y renderiza el código de barras SVG utilizando la librería JsBarcode.
   * @param {Object} product - El producto para el cual generar el código.
   */
  function generateBarcode(product) {
    if (!product) {
      alert("Por favor, selecciona un producto");
      return;
    }

    // 1. Generar valor numérico único
    const barcodeValue = stringToConsistentNumber(product.name + product.sku);

    // 2. Actualizar la vista previa de información
    productDisplay.textContent = product.name;
    productDetails.innerHTML = `
            <div class="product-info-detail">
                <strong>SKU:</strong> ${product.sku} | 
                <strong>Talla:</strong> ${product.size} | 
                <strong>Precio:</strong> $${product.base_price.toFixed(2)} | 
                <strong>Stock:</strong> ${product.stock}
            </div>
        `;

    // 3. Limpiar SVG anterior
    barcodeSvg.innerHTML = "";

    // 4. Renderizar con JsBarcode
    JsBarcode("#barcode", barcodeValue, {
      format: "CODE128",
      lineColor: "#000000",
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 16,
      margin: 10,
      background: "#ffffff",
    });

    // Asegurar visibilidad
    barcodeSvg.setAttribute("style", "display: block; background: white;");
    barcodeText.textContent = `Código: ${barcodeValue}`;
    barcodeResult.classList.remove("hidden");
  }

  /**
   * Muestra u oculta el indicador de carga.
   * @param {boolean} show - true para mostrar, false para ocultar.
   */
  function showLoading(show) {
    if (show) {
      loadingSection.classList.remove("hidden");
    } else {
      loadingSection.classList.add("hidden");
    }
  }

  // --- Event Listeners ---

  generateBtn.addEventListener("click", function () {
    if (productSelect.value) {
      const product = products.find((p) => p.id === productSelect.value);
      if (product) {
        generateBarcode(product);
      }
    } else {
      alert("Por favor, selecciona un producto de la lista");
    }
  });

  productSelect.addEventListener("change", function () {
    if (this.value) {
      const product = products.find((p) => p.id === this.value);
      if (product) {
        selectProduct(product);
      }
    } else {
      selectedProduct = null;
      barcodeResult.classList.add("hidden");
    }
  });

  /**
   * Maneja la impresión del código de barras.
   * Aplica estilos de alto contraste temporalmente para asegurar una impresión limpia.
   */
  printBtn.addEventListener("click", function () {
    if (!selectedProduct) {
      alert("No hay ningún producto seleccionado para imprimir");
      return;
    }

    applyPrintStyles();

    // Retraso para permitir que los estilos se apliquen antes de abrir el diálogo de impresión
    setTimeout(() => {
      window.print();
      // Restaurar estilos originales después de imprimir
      setTimeout(restoreNormalStyles, 500);
    }, 100);
  });

  /**
   * Fuerza estilos de color negro puro y fondo blanco en el SVG para la impresión.
   */
  function applyPrintStyles() {
    const barcodeSvg = document.getElementById("barcode");
    const paths = barcodeSvg.querySelectorAll("path");
    const rects = barcodeSvg.querySelectorAll("rect");
    const texts = barcodeSvg.querySelectorAll("text");

    barcodeSvg.style.background = "white";
    barcodeSvg.style.border = "1px solid #ccc";
    barcodeSvg.style.padding = "10px";

    paths.forEach((path) => {
      if (path.getAttribute("fill") !== "#ffffff") {
        path.style.fill = "#000000";
        path.style.stroke = "#000000";
      }
    });

    rects.forEach((rect) => {
      if (rect.getAttribute("fill") === "#ffffff") {
        rect.style.fill = "#ffffff";
        rect.style.stroke = "#ffffff";
      }
    });

    texts.forEach((text) => {
      text.style.fill = "#000000";
      text.style.stroke = "none";
    });
  }

  /**
   * Elimina los estilos forzados de impresión.
   */
  function restoreNormalStyles() {
    const barcodeSvg = document.getElementById("barcode");
    barcodeSvg.style.background = "";
    barcodeSvg.style.border = "";
    barcodeSvg.style.padding = "";
  }

  backBtn.addEventListener("click", function () {
    window.location.href = "admin.html";
  });

  refreshBtn.addEventListener("click", function () {
    loadProducts();
  });
});
