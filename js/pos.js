document.addEventListener("DOMContentLoaded", function () {
  initializePOS();
});

// Variables globales para la búsqueda en tiempo real
let searchTimeout = null;
let currentSearchTerm = "";

async function initializePOS() {
  try {
    const userInfo = await getUserInfoMe();

    if (userInfo) {
      showTokenAlert("Sesión activa", false);
      loadUserInfo(userInfo);
      setupPOSFunctionality();
    } else {
      showTokenAlert(
        "Sesión inválida o expirada. Serás redirigido al login.",
        true
      );
    }
  } catch (error) {
    console.error("Error inicializando POS:", error);
    showTokenAlert(
      "Error al verificar sesión. Serás redirigido al login.",
      true
    );
  }
}

async function getUserInfoMe() {
  try {
    const response = await fetch("http://localhost:8080/users/me", {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.warn(
        "Endpoint /users/me no disponible o no autorizado:",
        response.status
      );
      return null;
    }
  } catch (error) {
    console.error("Error en /users/me:", error);
    return null;
  }
}

function showTokenAlert(message, shouldRedirect) {
  alert(message);

  if (shouldRedirect) {
    setTimeout(() => {
      logout();
    }, 1000);
  }
}

function loadUserInfo(userData) {
  try {
    if (userData.username) {
      document.getElementById(
        "userName"
      ).textContent = `Cajero: ${userData.username}`;

      const initials = userData.username.charAt(0).toUpperCase();
      const userAvatar = document.getElementById("userAvatar");
      if (userAvatar) {
        userAvatar.textContent = initials;
      }
    }
  } catch (error) {
    console.error("Error cargando información del usuario:", error);
  }
}

function setupPOSFunctionality() {
  console.log("POS inicializado");

  initializeCart();
  setupEventListeners();
  loadInitialData();
  setupProductSearch();
  updateRegisterStats();
}

function setupProductSearch() {
  const productSearch = document.getElementById("productSearch");
  const searchResults = document.getElementById("searchResults");

  if (productSearch && searchResults) {
    // Evento de input para búsqueda en tiempo real
    productSearch.addEventListener("input", function (e) {
      const searchTerm = e.target.value.trim();

      // Limpiar timeout anterior
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Ocultar resultados si el término está vacío
      if (!searchTerm) {
        hideSearchResults();
        return;
      }

      // Esperar 300ms después de que el usuario deje de escribir
      searchTimeout = setTimeout(() => {
        performProductSearch(searchTerm);
      }, 300);
    });

    // Mostrar resultados cuando el input recibe foco
    productSearch.addEventListener("focus", function (e) {
      const searchTerm = e.target.value.trim();
      if (searchTerm && searchTerm.length >= 2) {
        performProductSearch(searchTerm);
      }
    });

    // Prevenir que el formulario se envíe al presionar Enter en la búsqueda
    productSearch.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
      }
    });
  }
}

// Función para realizar la búsqueda de productos
async function performProductSearch(searchTerm) {
  try {
    currentSearchTerm = searchTerm.toLowerCase();

    // Primero obtener todos los productos
    const response = await fetch(`http://localhost:8080/products`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const allProducts = await response.json();

    // Filtrar productos localmente para mejor control
    const filteredProducts = filterProducts(allProducts, searchTerm);

    displaySearchResults(filteredProducts, searchTerm);
  } catch (error) {
    console.error("Error buscando productos:", error);

    // Fallback: usar datos de ejemplo si la API falla
    const exampleProducts = getExampleProducts();
    const filteredProducts = filterProducts(exampleProducts, searchTerm);
    displaySearchResults(filteredProducts, searchTerm);
  }
}

// Función para filtrar productos localmente
function filterProducts(products, searchTerm) {
  const searchLower = searchTerm.toLowerCase();

  return products
    .filter((product) => {
      const productData = product.product || product;
      const productName = (productData.name || "").toLowerCase();
      const description = (productData.description || "").toLowerCase();
      const sku = (product.sku || "").toLowerCase();
      const productType = (productData.productType || "").toLowerCase();

      // Buscar en múltiples campos con diferentes pesos
      const nameMatch = productName.includes(searchLower);
      const descriptionMatch = description.includes(searchLower);
      const skuMatch = sku.includes(searchLower);
      const typeMatch = productType.includes(searchLower);

      // Dar más peso al nombre del producto
      if (nameMatch) return true;
      if (skuMatch) return true;
      if (typeMatch) return true;
      if (descriptionMatch) return true;

      return false;
    })
    .sort((a, b) => {
      // Ordenar por relevancia
      const aName = (a.product?.name || a.name || "").toLowerCase();
      const bName = (b.product?.name || b.name || "").toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      // Priorizar productos que empiecen con el término de búsqueda
      const aStartsWith = aName.startsWith(searchLower);
      const bStartsWith = bName.startsWith(searchLower);

      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      // Luego por coincidencia exacta en el nombre
      const aExactMatch = aName === searchLower;
      const bExactMatch = bName === searchLower;

      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;

      return 0;
    });
}

// Datos de ejemplo para fallback
function getExampleProducts() {
  return [
    {
      _id: "1",
      product: {
        name: "Pantalón Jogger",
        base_price: 720.0,
        description:
          "Jogger deportivo con ajuste elástico y bolsillos laterales.",
        productType: "pantalones",
      },
      size: "M",
      sku: "PANT-JOG-M",
      stock: 35,
    },
    {
      _id: "2",
      product: {
        name: "Pantalón Jogger",
        base_price: 720.0,
        description:
          "Jogger deportivo con ajuste elástico y bolsillos laterales.",
        productType: "pantalones",
      },
      size: "L",
      sku: "PANT-JOG-L",
      stock: 25,
    },
    {
      _id: "3",
      product: {
        name: "Pantalón Cargo",
        base_price: 650.5,
        description: "Pantalón estilo cargo con múltiples bolsillos.",
        productType: "pantalones",
      },
      size: "M",
      sku: "PANT-CAR-M",
      stock: 40,
    },
    {
      _id: "4",
      product: {
        name: "Hoodie Clásica",
        base_price: 799.0,
        description: "Hoodie de algodón grueso, cómoda y duradera.",
        productType: "hoodie",
      },
      size: "M",
      sku: "HOOD-CLA-M",
      stock: 50,
    },
    {
      _id: "5",
      product: {
        name: "Hoodie Clásica",
        base_price: 799.0,
        description: "Hoodie de algodón grueso, cómoda y duradera.",
        productType: "hoodie",
      },
      size: "L",
      sku: "HOOD-CLA-L",
      stock: 30,
    },
    {
      _id: "6",
      product: {
        name: "Short Deportivo",
        base_price: 450.0,
        description: "Short ligero y transpirable ideal para entrenamiento.",
        productType: "shorts",
      },
      size: "M",
      sku: "SHOR-DEP-M",
      stock: 70,
    },
  ];
}

// Función para mostrar los resultados de búsqueda
function displaySearchResults(products, searchTerm) {
  const searchResults = document.getElementById("searchResults");
  const productSearch = document.getElementById("productSearch");

  if (!searchResults || !productSearch) return;

  // Verificar si el término de búsqueda sigue siendo el mismo
  if (productSearch.value.trim().toLowerCase() !== searchTerm.toLowerCase()) {
    return;
  }

  if (products.length === 0) {
    searchResults.innerHTML =
      '<div class="search-result-item no-results">No se encontraron productos con "' +
      searchTerm +
      '"</div>';
    searchResults.style.display = "block";
    return;
  }

  searchResults.innerHTML = products
    .map((product) => {
      const productData = product.product || product;
      const productName = productData.name || "Sin nombre";
      const basePrice = productData.base_price || 0;
      const description = productData.description || "Sin descripción";
      const stock = product.stock || 0;
      const size = product.size || "N/A";
      const sku = product.sku || "N/A";
      const productType = productData.productType || "N/A";

      // Resaltar el término de búsqueda en el nombre
      const highlightedName = highlightSearchTerm(productName, searchTerm);

      // Limitar la longitud de la descripción
      const shortDescription =
        description.length > 60
          ? description.substring(0, 60) + "..."
          : description;

      const stockClass = stock > 0 ? "stock-available" : "stock-low";
      const stockText = stock > 0 ? `Stock: ${stock}` : "Sin stock";

      return `
      <div class="search-result-item" onclick="selectProductFromSearch('${
        product._id
      }', '${productName.replace(
        /'/g,
        "\\'"
      )}', ${basePrice}, ${stock}, '${size}')">
        <div class="product-info">
          <div class="product-name">${highlightedName}</div>
          <div class="product-details">
            ${shortDescription}<br>
            <strong>Talla:</strong> ${size} | <strong>SKU:</strong> ${sku} | <strong>Tipo:</strong> ${productType}
          </div>
        </div>
        <div class="product-price-container">
          <span class="product-price">$${basePrice.toFixed(2)}</span>
          <span class="${stockClass} product-stock">${stockText}</span>
        </div>
      </div>
    `;
    })
    .join("");

  searchResults.style.display = "block";
}

// Función para resaltar el término de búsqueda
function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm) return text;

  const searchLower = searchTerm.toLowerCase();
  const textLower = text.toLowerCase();
  const index = textLower.indexOf(searchLower);

  if (index === -1) return text;

  const before = text.substring(0, index);
  const match = text.substring(index, index + searchTerm.length);
  const after = text.substring(index + searchTerm.length);

  return (
    before +
    '<span style="background-color: #fff3cd; padding: 2px 4px; border-radius: 3px;">' +
    match +
    "</span>" +
    after
  );
}

// Función para seleccionar un producto de los resultados
function selectProductFromSearch(productId, productName, price, stock, size) {
  // Ocultar resultados
  hideSearchResults();

  // Limpiar campo de búsqueda
  const productSearch = document.getElementById("productSearch");
  if (productSearch) {
    productSearch.value = "";
  }

  // Verificar stock
  if (stock <= 0) {
    alert("⚠️ Este producto no tiene stock disponible");
    return;
  }

  // Agregar al carrito
  const product = {
    id: productId,
    name: `${productName} (${size})`,
    price: price,
    quantity: 1,
    variantId: productId,
    size: size,
  };

  addProductToCart(product);

  // Mostrar confirmación
  showProductAddedMessage(productName, size, price);
}

// Función para mostrar mensaje de producto añadido
function showProductAddedMessage(productName, size, price) {
  const message = `✅ Producto agregado al carrito:\n\n"${productName}" (${size})\nPrecio: $${price.toFixed(
    2
  )}`;
  alert(message);
}

// Función para ocultar resultados de búsqueda
function hideSearchResults() {
  const searchResults = document.getElementById("searchResults");
  if (searchResults) {
    searchResults.style.display = "none";
  }
}

function initializeCart() {
  const cartBody = document.getElementById("cartBody");
  const emptyCartMessage = document.getElementById("emptyCartMessage");
  const subtotalAmount = document.getElementById("subtotalAmount");
  const totalAmount = document.getElementById("totalAmount");

  if (cartBody) cartBody.innerHTML = "";
  if (emptyCartMessage) emptyCartMessage.style.display = "block";
  if (subtotalAmount) subtotalAmount.textContent = "$0.00";
  if (totalAmount) totalAmount.textContent = "$0.00";

  window.getSelectedCustomer = null;
  window.selectedCupon = null; // CORRECCIÓN: Limpiar cupón
  window.cartItems = [];

  hideCustomerInfo();
  hideCuponInfo();
  clearCustomerSearch();

  // Limpiar también el campo de búsqueda de cupones
  const searchCuponInput = document.getElementById("searchCupon");
  if (searchCuponInput) {
    searchCuponInput.value = "";
  }

  updateCartSummary();
}

function setupEventListeners() {
  // Ocultar resultados al hacer clic fuera
  document.addEventListener("click", function (e) {
    const searchResults = document.getElementById("searchResults");
    const productSearch = document.getElementById("productSearch");

    if (
      searchResults &&
      searchResults.style.display === "block" &&
      !searchResults.contains(e.target) &&
      !productSearch.contains(e.target)
    ) {
      hideSearchResults();
    }
  });

  const searchCustomerBtn = document.getElementById("searchCustomerBtn");
  if (searchCustomerBtn) {
    searchCustomerBtn.addEventListener("click", searchCustomer);
  }

  const searchCustomerInput = document.getElementById("searchCustomer");
  if (searchCustomerInput) {
    searchCustomerInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        searchCustomer();
      }
    });
  }

  const searchCuponBtn = document.getElementById("searchCuponBtn");
  if (searchCuponBtn) {
    searchCuponBtn.addEventListener("click", searchCupon);
  }

  const searchCuponInput = document.getElementById("searchCupon");
  if (searchCuponInput) {
    searchCuponInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        searchCupon();
      }
    });
  }

  const removeCuponBtn = document.getElementById("removeCuponBtn");
  if (removeCuponBtn) {
    removeCuponBtn.addEventListener("click", removeCupon);
  }

  const addProductBtn = document.getElementById("addProductBtn");
  if (addProductBtn) {
    addProductBtn.addEventListener("click", addProduct);
  }

  const searchProductBtn = document.getElementById("searchProductBtn");
  if (searchProductBtn) {
    searchProductBtn.addEventListener("click", searchProduct);
  }

  const removeProductBtn = document.getElementById("removeProductBtn");
  if (removeProductBtn) {
    removeProductBtn.addEventListener("click", removeProduct);
  }

  const addAnotherProductBtn = document.getElementById("addAnotherProductBtn");
  if (addAnotherProductBtn) {
    addAnotherProductBtn.addEventListener("click", addAnotherProduct);
  }

  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", processCheckout);
  }

  const dailyReportBtn = document.getElementById("dailyReportBtn");
  if (dailyReportBtn) {
    dailyReportBtn.addEventListener("click", generateDailyReport);
  }

  const closeRegisterBtn = document.getElementById("closeRegisterBtn");
  if (closeRegisterBtn) {
    closeRegisterBtn.addEventListener("click", closeRegister);
  }
}

function loadInitialData() {
  console.log("Cargando datos iniciales...");
}

async function searchCustomer() {
  const searchInput = document.getElementById("searchCustomer").value.trim();

  if (!searchInput) {
    alert("Por favor, ingrese un nombre para buscar");
    return;
  }

  if (searchInput.length < 2) {
    alert("La búsqueda debe tener al menos 2 caracteres");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:8080/users/search/customers?query=${encodeURIComponent(
        searchInput
      )}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(
          "No tiene permisos para buscar clientes. Contacte al administrador."
        );
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const matchingUsers = await response.json();

    if (matchingUsers.length === 0) {
      alert("No se encontraron clientes con ese nombre");
      hideCustomerInfo();
      return;
    }

    if (matchingUsers.length > 1) {
      const customerNames = matchingUsers
        .map((user) => user.username)
        .join(", ");
      alert(
        `Múltiples clientes encontrados: ${customerNames}. Mostrando el primero.`
      );
    }

    displayCustomerInfo(matchingUsers[0]);
  } catch (error) {
    console.error("Error buscando cliente:", error);
    alert(`Error al buscar cliente: ${error.message}`);
  }
}

async function searchCupon() {
  const searchInput = document
    .getElementById("searchCupon")
    .value.trim()
    .toUpperCase();

  if (!searchInput) {
    alert("Por favor, ingrese un código de cupón");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:8080/coupons/search/${encodeURIComponent(searchInput)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al buscar cupón");
    }

    if (data.success && data.coupon) {
      displayCuponInfo(data.coupon);
      updateCartSummary();
    } else {
      throw new Error("Cupón no encontrado");
    }
  } catch (error) {
    console.error("Error buscando cupón:", error);
    alert(`Error al buscar cupón: ${error.message}`);
    hideCuponInfo();
  }
}

function displayCustomerInfo(customer) {
  const customerInfo = document.getElementById("customerInfo");
  const customerAvatar = document.getElementById("customerAvatar");
  const customerName = document.getElementById("customerName");
  const customerContact = document.getElementById("customerContact");

  if (customerInfo && customerAvatar && customerName && customerContact) {
    const initials = customer.username.charAt(0).toUpperCase();
    customerAvatar.textContent = initials;

    customerName.textContent = customer.username;
    customerContact.textContent = customer.email || "Sin email registrado";

    customerInfo.style.display = "flex";

    window.getSelectedCustomer = customer;

    console.log("Cliente seleccionado:", customer);
  }
}

function displayCuponInfo(cupon) {
  const cuponInfo = document.getElementById("cuponInfo");
  const cuponCodigo = document.getElementById("cuponCodigo");
  const cuponDescuento = document.getElementById("cuponDescuento");
  const cuponNombre = document.getElementById("cuponNombre");
  const cuponUsos = document.getElementById("cuponUsos");
  const cuponExpiracion = document.getElementById("cuponExpiracion");

  if (
    cuponInfo &&
    cuponCodigo &&
    cuponDescuento &&
    cuponNombre &&
    cuponUsos &&
    cuponExpiracion
  ) {
    cuponCodigo.textContent = cupon.code;
    cuponDescuento.textContent = `${cupon.discount}% OFF`;
    cuponNombre.textContent = cupon.name;

    // Información de usos
    const usosText = cupon.maximum_uses
      ? `Usos: ${cupon.actual_uses}/${cupon.maximum_uses}`
      : `Usos: ${cupon.actual_uses}`;
    cuponUsos.textContent = usosText;

    // Información de expiración
    const expiracionText = cupon.expiration_date
      ? `Expira: ${new Date(cupon.expiration_date).toLocaleDateString()}`
      : "Sin expiración";
    cuponExpiracion.textContent = expiracionText;

    cuponInfo.style.display = "block";
    
    // CORRECCIÓN: Usar window.selectedCupon consistentemente
    window.selectedCupon = {
      id: cupon.id,
      name: cupon.name,
      discount: cupon.discount,
      code: cupon.code,
      expiration_date: cupon.expiration_date,
      actual_uses: cupon.actual_uses,
      maximum_uses: cupon.maximum_uses
    };

    console.log("Cupón seleccionado y guardado:", window.selectedCupon);

    alert(
      `Cupón "${cupon.name}" aplicado correctamente. Descuento: ${cupon.discount}%`
    );
    
    // Actualizar el resumen inmediatamente
    updateCartSummary();
  }
}

function hideCustomerInfo() {
  const customerInfo = document.getElementById("customerInfo");
  if (customerInfo) {
    customerInfo.style.display = "none";
    window.getSelectedCustomer = null;
  }
}

function hideCuponInfo() {
  const cuponInfo = document.getElementById("cuponInfo");
  if (cuponInfo) {
    cuponInfo.style.display = "none";
    window.selectedCupon = null;
  }
  updateCartSummary();
}

function clearCustomerSearch() {
  const searchInput = document.getElementById("searchCustomer");
  if (searchInput) {
    searchInput.value = "";
  }
  hideCustomerInfo();
}

function removeCupon() {
  // CORRECCIÓN: Limpiar window.selectedCupon
  window.selectedCupon = null;
  
  hideCuponInfo();
  const searchInput = document.getElementById("searchCupon");
  if (searchInput) {
    searchInput.value = "";
  }
  
  // Actualizar el resumen para quitar el descuento
  updateCartSummary();
  
  alert("Cupón removido correctamente");
}

function addProduct() {
  console.log("Añadiendo producto...");

  // Simulación de producto añadido
  const productId = document.getElementById("productID").value.trim();
  if (!productId) {
    alert("Por favor, ingrese un ID de producto");
    return;
  }

  // Producto simulado para demo
  const simulatedProduct = {
    id: productId,
    name: `Producto ${productId}`,
    price: Math.random() * 100 + 10, // Precio aleatorio entre 10 y 110
    quantity: 1,
  };

  addProductToCart(simulatedProduct);
  document.getElementById("productID").value = "";
}

// Función para agregar productos al carrito
function addProductToCart(product) {
  if (!window.cartItems) {
    window.cartItems = [];
  }

  // Verificar si el producto ya está en el carrito
  const existingItemIndex = window.cartItems.findIndex(
    (item) => item.id === product.id && item.size === product.size
  );

  if (existingItemIndex > -1) {
    // Incrementar cantidad si ya existe
    window.cartItems[existingItemIndex].quantity += 1;
  } else {
    // Agregar nuevo producto
    window.cartItems.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      size: product.size,
      variantId: product.variantId,
    });
  }

  updateCartDisplay();
  updateCartSummary();
}

function updateCartDisplay() {
  const cartBody = document.getElementById("cartBody");
  const emptyCartMessage = document.getElementById("emptyCartMessage");

  if (!window.cartItems || window.cartItems.length === 0) {
    if (cartBody) cartBody.innerHTML = "";
    if (emptyCartMessage) emptyCartMessage.style.display = "block";
    return;
  }

  if (emptyCartMessage) emptyCartMessage.style.display = "none";

  cartBody.innerHTML = window.cartItems
    .map(
      (item) => `
    <tr>
      <td>${item.name}${item.size ? ` (${item.size})` : ""}</td>
      <td>${item.quantity}</td>
      <td>$${item.price.toFixed(2)}</td>
      <td>$${(item.price * item.quantity).toFixed(2)}</td>
      <td>
        <button onclick="removeProductFromCart('${
          item.id
        }')" class="btn-small btn-danger">Eliminar</button>
      </td>
    </tr>
  `
    )
    .join("");
}

// Función para actualizar el resumen del carrito - MODIFICADA
function updateCartSummary() {
  if (!window.cartItems || window.cartItems.length === 0) {
    document.getElementById("subtotalAmount").textContent = "$0.00";
    document.getElementById("totalAmount").textContent = "$0.00";
    document.getElementById("descuentoRow").style.display = "none";
    
    // Limpiar variables globales
    window.cartTotal = 0;
    window.cartSubtotal = 0;
    window.cartDescuento = 0;
    return;
  }

  const subtotal = window.cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  document.getElementById("subtotalAmount").textContent = `$${subtotal.toFixed(2)}`;

  let descuento = 0;
  let descuentoPorcentaje = 0;
  
  // VERIFICAR QUE EL CUPÓN ESTÉ DISPONIBLE
  if (window.selectedCupon && window.selectedCupon.discount) {
    descuentoPorcentaje = window.selectedCupon.discount;
    descuento = subtotal * (descuentoPorcentaje / 100);
    document.getElementById(
      "descuentoAmount"
    ).textContent = `-$${descuento.toFixed(2)} (${descuentoPorcentaje}%)`;
    document.getElementById("descuentoRow").style.display = "flex";
    
    console.log(`Descuento aplicado: ${descuentoPorcentaje}% = $${descuento.toFixed(2)}`);
  } else {
    document.getElementById("descuentoRow").style.display = "none";
    console.log("No hay cupón aplicado");
  }

  const total = subtotal - descuento;
  document.getElementById("totalAmount").textContent = `$${total.toFixed(2)}`;
  
  // Guardar el total calculado para usar en el checkout
  window.cartTotal = total;
  window.cartSubtotal = subtotal;
  window.cartDescuento = descuento;
  
  console.log(`Resumen - Subtotal: $${subtotal.toFixed(2)}, Descuento: $${descuento.toFixed(2)}, Total: $${total.toFixed(2)}`);
}

function removeProductFromCart(productId) {
  if (!window.cartItems) return;

  window.cartItems = window.cartItems.filter((item) => item.id !== productId);
  updateCartDisplay();
  updateCartSummary();
}

function searchProduct() {
  console.log("Buscando producto...");
  const searchTerm = document.getElementById("productSearch").value.trim();

  if (!searchTerm) {
    alert("Por favor, ingrese un término de búsqueda");
    return;
  }

  // Simulación de búsqueda de producto
  alert(
    `Buscando productos con: "${searchTerm}"\n\nEsta funcionalidad se conectará con la API de productos.`
  );
}

function removeProduct() {
  console.log("Eliminando producto...");

  if (!window.cartItems || window.cartItems.length === 0) {
    alert("El carrito está vacío");
    return;
  }

  const productId = prompt("Ingrese el ID del producto a eliminar:");
  if (productId) {
    removeProductFromCart(productId);
  }
}

function addAnotherProduct() {
  console.log("Añadiendo otro producto...");
  document.getElementById("productID").focus();
}



function generateDailyReport() {
  console.log("Generando reporte diario...");
  alert(
    "Generando reporte diario...\n\nEsta funcionalidad generará un reporte de ventas del día."
  );
}

function closeRegister() {
  console.log("Cerrando caja...");
  
  // Mostrar confirmación antes de redirigir
  if (confirm("¿Está seguro de que desea cerrar la caja y salir?")) {
    // Redirigir a la página de login
    window.location.href = "../html/login.html";
  }
}

// Función para actualizar estadísticas de caja (simulada)
function updateRegisterStats(saleTotal) {
  const dailySales = document.getElementById("dailySales");
  const transactionsCount = document.getElementById("transactionsCount");
  const averageTicket = document.getElementById("averageTicket");
  
  if (dailySales && transactionsCount && averageTicket) {
    const currentSales = parseFloat(dailySales.textContent.replace('$', '')) || 0;
    const currentTransactions = parseInt(transactionsCount.textContent) || 0;
    
    const newSales = currentSales + saleTotal;
    const newTransactions = currentTransactions + 1;
    const newAverage = newTransactions > 0 ? newSales / newTransactions : 0;
    
    dailySales.textContent = `$${newSales.toFixed(2)}`;
    transactionsCount.textContent = newTransactions;
    averageTicket.textContent = `$${newAverage.toFixed(2)}`;
  }
}

async function logout() {
  try {
    await fetch("http://localhost:8080/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  } finally {
    window.location.href = "../html/login.html";
  }
}

function getSelectedCustomer() {
  return window.getSelectedCustomer || null;
}

function getSelectedCupon() {
  return window.selectedCupon || null;
}

function clearSelectedCustomer() {
  window.getSelectedCustomer = null;
  hideCustomerInfo();
  clearCustomerSearch();
}

// Función para procesar checkout - MODIFICADA
async function processCheckout() {
  console.log("Procesando pago...");
  console.log("Cupón actual:", window.selectedCupon);

  try {
    // Verificar usuario y permisos
    const currentUser = await getUserInfoMe();
    if (!currentUser) {
      alert("Error: No se pudo obtener la información del usuario");
      return;
    }

    console.log("Usuario actual:", currentUser);

    if (!window.getSelectedCustomer) {
      alert("Por favor, seleccione un cliente antes de procesar el pago");
      return;
    }

    if (!window.cartItems || window.cartItems.length === 0) {
      alert("El carrito está vacío. Agregue productos antes de procesar el pago.");
      return;
    }

    // CALCULAR TOTALES CON DESCUENTO
    const subtotal = window.cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    
    let descuento = 0;
    let discountRate = 0;
    
    // VERIFICAR CUPÓN Y APLICAR DESCUENTO
    if (window.selectedCupon && window.selectedCupon.discount) {
      descuento = subtotal * (window.selectedCupon.discount / 100);
      discountRate = window.selectedCupon.discount / 100;
      console.log(`Aplicando descuento del ${window.selectedCupon.discount}%: $${descuento.toFixed(2)}`);
    }
    
    const total = subtotal - descuento;

    // Preparar items con la tasa de descuento correcta
    const saleItems = window.cartItems.map(item => ({
      variant: item.variantId || item.id,
      quantity: item.quantity,
      unit_price: item.price,
      discount_rate: discountRate // Usar la tasa de descuento calculada
    }));

    const saleData = {
      user: window.getSelectedCustomer._id,
      cashier: currentUser._id,
      items: saleItems,
      total: total, // Total YA incluye el descuento
      payment_method: "CASH",
      transaction_type: "POS",
    };

    console.log("=== DATOS DE VENTA ===");
    console.log("Datos a enviar:", saleData);
    console.log("Cupón aplicado:", window.selectedCupon);
    console.log("Subtotal:", subtotal);
    console.log("Descuento:", descuento);
    console.log("Total final:", total);
    console.log("Tasa de descuento por item:", discountRate);

    // Mostrar confirmación con información del descuento
    let confirmMessage = `¿Confirmar venta?\n\nCliente: ${window.getSelectedCustomer.username}\nItems: ${window.cartItems.length}\nSubtotal: $${subtotal.toFixed(2)}`;
    
    if (window.selectedCupon) {
      confirmMessage += `\nCupón: ${window.selectedCupon.code} (${window.selectedCupon.discount}% OFF)`;
      confirmMessage += `\nDescuento: -$${descuento.toFixed(2)}`;
    }
    
    confirmMessage += `\nTotal: $${total.toFixed(2)}`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    // Procesar la venta
    await processPOSSale(saleData);

  } catch (error) {
    console.error("Error procesando la venta:", error);
    alert(`❌ Error al procesar la venta: ${error.message}`);
  }
}

// Función específica para procesar ventas POS
async function processPOSSale(saleData) {
  try {
    // USAR EL ENDPOINT pos-sale que acepta permission_ring 2
    const response = await fetch("http://localhost:8080/orders/pos-sale", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(saleData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Si es error de permisos, mostrar mensaje específico
      if (response.status === 403) {
        throw new Error(`Permisos insuficientes. El usuario necesita permisos de cajero.`);
      }
      
      // Si es error de stock u otro problema
      throw new Error(responseData.error || responseData.message || `Error ${response.status}: ${response.statusText}`);
    }

    // Éxito - Mostrar mensaje con información del descuento
    let successMessage = `✅ Venta registrada exitosamente\n\nID de Venta: ${responseData.saleId}\nTotal: $${saleData.total.toFixed(2)}`;
    
    if (window.selectedCupon) {
      successMessage += `\nCupón aplicado: ${window.selectedCupon.code} (${window.selectedCupon.discount}% OFF)`;
      // Incrementar el contador de usos del cupón
    }
    
    successMessage += `\n\nEl stock ha sido actualizado.`;
    
    alert(successMessage);
    
    initializeCart();
    updateRegisterStats(saleData.total);

  } catch (error) {
    throw error;
  }
}

// Función para incrementar el uso del cupón - CORREGIDA
// En pos.js - CORREGIR PUERTO Y MEJORAR DEBUG
async function incrementCouponUsage(couponId) {
  try {
    // VERIFICAR ID COMPLETO
    console.log("🟡 Intentando incrementar cupón con ID:", couponId);
    
    if (!couponId || couponId.length < 10) {
      console.warn("❌ ID de cupón inválido:", couponId);
      return;
    }
    
    // USAR PUERTO CORRECTO - 5500
    const baseUrl = "http://localhost:5500";
    const url = `${baseUrl}/coupons/${couponId}/increment`;
    console.log("🔵 URL completa:", url);
    
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    
    console.log("🟢 Respuesta del servidor:", response.status, response.statusText);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn("❌ Endpoint no encontrado - verificar ruta en server");
        return;
      }
      if (response.status === 405) {
        console.warn("❌ Método no permitido - verificar CORS y método en server");
        return;
      }
      console.warn(`❌ Error HTTP: ${response.status} ${response.statusText}`);
    } else {
      const result = await response.json();
      console.log("✅ Contador de cupón incrementado:", result);
    }
  } catch (error) {
    console.error("❌ Error en incrementCouponUsage:", error);
  }
}

function showSuccessMessage(result, total) {
  alert(`✅ Venta registrada exitosamente\n\nID de Venta: ${result.saleId || result._id}\nTotal: $${total.toFixed(2)}\n\nEl stock ha sido actualizado.`);
}

// Función alternativa usando checkout web
async function processWithCheckoutEndpoint(saleData) {
  try {
    // Adaptar datos para checkout web
    const checkoutData = {
      shipping_address: {
        full_name: window.getSelectedCustomer.username || "Cliente POS",
        address: "Tienda Física",
        city: "Local",
        state: "Local", 
        zip_code: "00000",
        country: "MX"
      }
    };

    const response = await fetch("http://localhost:8080/orders/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(checkoutData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error checkout: ${response.status}`);
    }

    const result = await response.json();
    showSuccessMessage(result, saleData.total);
    initializeCart();

  } catch (error) {
    throw new Error(`No se pudo procesar la venta: ${error.message}`);
  }
}

// ==========================================
// LÓGICA DE DEVOLUCIONES (H.U. 17)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar modal de devoluciones
    const returnBtn = document.getElementById('returnBtn');
    const returnModal = document.getElementById('return-modal');
    const closeBtn = returnModal ? returnModal.querySelector('.close') : null;
    const searchSaleBtn = document.getElementById('searchSaleBtn');
    const confirmReturnBtn = document.getElementById('confirmReturnBtn');

    if (returnBtn && returnModal) {
        returnBtn.addEventListener('click', () => {
            returnModal.style.display = 'block';
            document.getElementById('return-step-1').style.display = 'block';
            document.getElementById('return-step-2').style.display = 'none';
            document.getElementById('returnSaleId').value = '';
            document.getElementById('returnItemsTable').innerHTML = '';
        });

        closeBtn.addEventListener('click', () => returnModal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target === returnModal) returnModal.style.display = 'none';
        });

        searchSaleBtn.addEventListener('click', searchSaleForReturn);
        confirmReturnBtn.addEventListener('click', processReturn);
    }
});

// Variable global temporal para la devolución actual
let currentReturnSale = null;

async function searchSaleForReturn() {
    const saleId = document.getElementById('returnSaleId').value.trim();
    if (!saleId) return alert("Ingrese un ID de venta");

    try {
        // Solicitamos los detalles de la venta al backend
        // Usamos el endpoint específico para buscar por ID
        const response = await fetch(`http://localhost:8080/orders/detail/${saleId}`, {
            method: "GET",
            credentials: "include" // IMPORTANTE: Envía la cookie de sesión para el permiso
        });

        if (!response.ok) {
            throw new Error("Venta no encontrada");
        }
        
        const sale = await response.json();
        currentReturnSale = sale; // Guardamos la venta en la variable global
        
        renderReturnItems(sale); // Mostramos los items en la tabla

    } catch (error) {
        console.error(error);
        alert("No se encontró la venta o no tienes permiso.");
    }
}

function renderReturnItems(sale) {
    const tbody = document.getElementById('returnItemsTable');
    tbody.innerHTML = '';
    
    document.getElementById('return-step-1').style.display = 'none';
    document.getElementById('return-step-2').style.display = 'block';

    sale.items.forEach((item, index) => {
        const productName = item.variant?.product?.name || "Producto Eliminado";
        const size = item.variant?.size || "-";
        const maxQty = item.quantity;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                ${productName} (${size})<br>
                <small>$${item.unit_price.toFixed(2)} c/u</small>
            </td>
            <td>${maxQty}</td>
            <td>
                <input type="number" class="return-qty" 
                    data-index="${index}" 
                    data-price="${item.unit_price}"
                    data-variant="${item.variant._id}"
                    min="0" max="${maxQty}" value="0" 
                    style="width: 60px; padding: 5px;">
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Listener para calcular total dinámicamente
    const inputs = tbody.querySelectorAll('.return-qty');
    inputs.forEach(input => {
        input.addEventListener('change', updateRefundTotal);
        input.addEventListener('keyup', updateRefundTotal);
    });
}

function updateRefundTotal() {
    let total = 0;
    document.querySelectorAll('.return-qty').forEach(input => {
        const qty = parseInt(input.value) || 0;
        const price = parseFloat(input.dataset.price);
        total += qty * price;
    });
    document.getElementById('refundTotalDisplay').textContent = `$${total.toFixed(2)}`;
}

async function processReturn() {
    const itemsToReturn = [];
    
    document.querySelectorAll('.return-qty').forEach(input => {
        const qty = parseInt(input.value);
        if (qty > 0) {
            itemsToReturn.push({
                variantId: input.dataset.variant,
                quantity: qty
            });
        }
    });

    if (itemsToReturn.length === 0) return alert("Seleccione al menos un producto para devolver.");

    try {
        const response = await fetch("http://localhost:8080/orders/return", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                originalSaleId: currentReturnSale._id,
                itemsToReturn: itemsToReturn
            })
        });

        if (!response.ok) throw new Error("Error en el servidor");

        const result = await response.json();
        alert(`✅ Devolución exitosa.\nReembolso: $${result.refundAmount.toFixed(2)}`);
        document.getElementById('return-modal').style.display = 'none';
        
        // Actualizar estadísticas del día (restando venta)
        updateRegisterStats(-result.refundAmount);

    } catch (error) {
        console.error(error);
        alert("Error al procesar la devolución.");
    }
}

// ==========================================
// LÓGICA DE GASTOS / MOVIMIENTOS DE CAJA (H.U. 18)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const cashBtn = document.getElementById('cashMovementBtn');
    const cashModal = document.getElementById('cash-modal');
    const cashForm = document.getElementById('cash-form');
    
    // Elementos de cierre
    const closeSpans = cashModal ? cashModal.querySelectorAll('.close, .close-cash-modal') : [];

    if (cashBtn && cashModal) {
        // Abrir modal
        cashBtn.addEventListener('click', () => {
            cashForm.reset();
            cashModal.style.display = 'block';
            document.getElementById('cash-amount').focus();
        });

        // Cerrar modal (X y botón cancelar)
        closeSpans.forEach(el => {
            el.addEventListener('click', () => cashModal.style.display = 'none');
        });

        // Cerrar al hacer click fuera
        window.addEventListener('click', (e) => {
            if (e.target === cashModal) cashModal.style.display = 'none';
        });

        // Enviar formulario
        cashForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const type = document.getElementById('cash-type').value;
            const amount = parseFloat(document.getElementById('cash-amount').value);
            const description = document.getElementById('cash-description').value;

            if (amount <= 0) return alert("El monto debe ser mayor a 0");

            const submitBtn = cashForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = "Guardando...";

            try {
                const response = await fetch("http://localhost:8080/cash-movements", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ type, amount, description })
                });

                if (!response.ok) throw new Error("Error al registrar");

                const data = await response.json();
                
                // Feedback visual
                alert(`✅ Movimiento registrado correctamente.\n${type === 'OUT' ? 'Gasto' : 'Ingreso'}: $${amount.toFixed(2)}`);
                
                cashModal.style.display = 'none';
                
                // Opcional: Actualizar visualmente el total en caja si tienes esa variable visible
                updateRegisterStats(type === 'IN' ? amount : -amount);

            } catch (error) {
                console.error(error);
                alert("Error: No se pudo registrar el movimiento.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});

async function updateRegisterStats() {
    // 1. Elementos del Contador Superior (Verde)
    const cashDisplay = document.getElementById('cash-balance-display');
    
    // 2. Elementos del Panel "Cierre de Caja" (Abajo)
    const dailySalesDisplay = document.getElementById('dailySales');
    const transactionsDisplay = document.getElementById('transactionsCount');
    const averageDisplay = document.getElementById('averageTicket');

    try {
        const response = await fetch("http://localhost:8080/cash-movements/balance", {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) return;

        const data = await response.json();
        
        // Formateador de moneda
        const formatMoney = (amount) => new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount || 0);

        // --- A) Actualizar Contador Verde (En Caja) ---
        if (cashDisplay) {
            cashDisplay.textContent = formatMoney(data.balance);
            cashDisplay.style.color = data.balance < 0 ? '#e74c3c' : 'white';
        }

        // --- B) Actualizar Panel de Cierre de Caja ---
        if (dailySalesDisplay) {
            dailySalesDisplay.textContent = formatMoney(data.dailySales);
        }
        
        if (transactionsDisplay) {
            transactionsDisplay.textContent = data.transactions;
        }

        if (averageDisplay) {
            // Calcular ticket promedio: Total / #Transacciones
            const avg = data.transactions > 0 ? (data.dailySales / data.transactions) : 0;
            averageDisplay.textContent = formatMoney(avg);
        }

    } catch (error) {
        console.error("Error actualizando estadísticas:", error);
    }
}