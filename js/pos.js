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
  const totalAmount = document.getElementById("totalAmount");

  if (cartBody) cartBody.innerHTML = "";
  if (emptyCartMessage) emptyCartMessage.style.display = "block";
  if (totalAmount) totalAmount.textContent = "$0.00";

  window.getSelectedCustomer = null;
  hideCustomerInfo();
  clearCustomerSearch();
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

  const addProductBtn = document.getElementById("addProductBtn");
  if (addProductBtn) {
    addProductBtn.addEventListener("click", addProduct);
  }

  const searchProductBtn = document.getElementById("searchProductBtn");
  if (searchProductBtn) {
    searchProductBtn.addEventListener("click", searchProduct);
  }

  const applyDiscountBtn = document.getElementById("applyDiscountBtn");
  if (applyDiscountBtn) {
    applyDiscountBtn.addEventListener("click", applyDiscount);
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

function hideCustomerInfo() {
  const customerInfo = document.getElementById("customerInfo");
  if (customerInfo) {
    customerInfo.style.display = "none";
    window.getSelectedCustomer = null;
  }
}

function clearCustomerSearch() {
  const searchInput = document.getElementById("searchCustomer");
  if (searchInput) {
    searchInput.value = "";
  }
  hideCustomerInfo();
}

function addProduct() {
  console.log("Añadiendo producto...");
  alert("Funcionalidad de añadir producto");
}

function searchProduct() {
  console.log("Buscando producto...");
  alert("Funcionalidad de búsqueda de producto");
}

function applyDiscount() {
  console.log("Aplicando descuento...");
  alert("Funcionalidad de aplicar descuento");
}

function removeProduct() {
  console.log("Eliminando producto...");
  alert("Funcionalidad de eliminar producto");
}

function addAnotherProduct() {
  console.log("Añadiendo otro producto...");
  alert("Funcionalidad de añadir otro producto");
}

function processCheckout() {
  console.log("Procesando pago...");

  if (!window.getSelectedCustomer) {
    alert("Por favor, seleccione un cliente antes de procesar el pago");
    return;
  }

  alert(`Procesando pago para cliente: ${window.getSelectedCustomer.username}`);
}

function generateDailyReport() {
  console.log("Generando reporte diario...");
  alert("Funcionalidad de reporte diario");
}

function closeRegister() {
  console.log("Cerrando caja...");
  alert("Funcionalidad de cierre de caja");
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

function clearSelectedCustomer() {
  window.getSelectedCustomer = null;
  hideCustomerInfo();
  clearCustomerSearch();
}
