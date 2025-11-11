document.addEventListener("DOMContentLoaded", function () {
  initializePOS();
});

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
  window.selectedCupon = null;
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
    window.getSelectedCupon = cupon;

    console.log("Cupón seleccionado:", cupon);

    alert(
      `Cupón "${cupon.name}" aplicado correctamente. Descuento: ${cupon.discount}%`
    );
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
  hideCuponInfo();
  const searchInput = document.getElementById("searchCupon");
  if (searchInput) {
    searchInput.value = "";
  }
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

function addProductToCart(product) {
  if (!window.cartItems) {
    window.cartItems = [];
  }

  // Verificar si el producto ya está en el carrito
  const existingItemIndex = window.cartItems.findIndex(
    (item) => item.id === product.id
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
      <td>${item.name}</td>
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

function updateCartSummary() {
  if (!window.cartItems || window.cartItems.length === 0) {
    document.getElementById("subtotalAmount").textContent = "$0.00";
    document.getElementById("totalAmount").textContent = "$0.00";
    document.getElementById("descuentoRow").style.display = "none";
    return;
  }

  const subtotal = window.cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  document.getElementById("subtotalAmount").textContent = `$${subtotal.toFixed(
    2
  )}`;

  let descuento = 0;
  if (window.selectedCupon) {
    descuento = subtotal * (window.selectedCupon.descuento / 100);
    document.getElementById(
      "descuentoAmount"
    ).textContent = `-$${descuento.toFixed(2)}`;
    document.getElementById("descuentoRow").style.display = "flex";
  } else {
    document.getElementById("descuentoRow").style.display = "none";
  }

  const total = subtotal - descuento;
  document.getElementById("totalAmount").textContent = `$${total.toFixed(2)}`;
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

function processCheckout() {
  console.log("Procesando pago...");

  if (!window.getSelectedCustomer) {
    alert("Por favor, seleccione un cliente antes de procesar el pago");
    return;
  }

  if (!window.cartItems || window.cartItems.length === 0) {
    alert(
      "El carrito está vacío. Agregue productos antes de procesar el pago."
    );
    return;
  }

  const total = parseFloat(
    document.getElementById("totalAmount").textContent.replace("$", "")
  );

  const checkoutInfo = {
    cliente: window.getSelectedCustomer.username,
    cupon: window.selectedCupon ? window.selectedCupon.nombre : "Ninguno",
    descuento: window.selectedCupon
      ? window.selectedCupon.descuento + "%"
      : "0%",
    total: total,
    items: window.cartItems.length,
  };

  alert(`Procesando pago para:\n
Cliente: ${checkoutInfo.cliente}
Cupón aplicado: ${checkoutInfo.cupon}
Descuento: ${checkoutInfo.descuento}
Total a cobrar: $${checkoutInfo.total.toFixed(2)}
Items: ${checkoutInfo.items}

Esta funcionalidad se conectará con la API de órdenes.`);

  // Aquí se conectaría con la API para procesar la orden
  // initializeCart(); // Limpiar carrito después del pago
}

function generateDailyReport() {
  console.log("Generando reporte diario...");
  alert(
    "Generando reporte diario...\n\nEsta funcionalidad generará un reporte de ventas del día."
  );
}

function closeRegister() {
  console.log("Cerrando caja...");
  alert(
    "Cerrando caja...\n\nEsta funcionalidad realizará el cierre de caja del turno."
  );
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
