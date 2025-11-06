// pos.js - Archivo nuevo para la página POS
document.addEventListener("DOMContentLoaded", function() {
  // Verificar si hay un token en localStorage
  const token = localStorage.getItem('jwt_token');
  
  if (!token) {
    showTokenAlert("❌ No se encontró token. Serás redirigido al login.", true);
    return;
  }
  
  // Verificar validez del token y cargar información del usuario
  initializePOS(token);
});

// Función principal para inicializar el POS
async function initializePOS(token) {
  try {
    // Primero intentar con el endpoint /users/me
    let userInfo = await getUserInfoMe(token);
    
    // Si falla, intentar con el endpoint /users/:id
    if (!userInfo) {
      const decodedToken = decodeJWT(token);
      if (decodedToken && decodedToken.id) {
        userInfo = await getUserInfoById(decodedToken.id, token);
      }
    }
    
    if (userInfo) {
      showTokenAlert("✅ Token válido - Sesión activa", false);
      loadUserInfo(userInfo);
      setupPOSFunctionality();
    } else {
      showTokenAlert("❌ Token inválido o expirado. Serás redirigido al login.", true);
    }
  } catch (error) {
    console.error("Error inicializando POS:", error);
    showTokenAlert("⚠️ Error al verificar sesión. Verifica tu conexión.", false);
    // Continuar con funcionalidad básica aunque falle la verificación
    setupPOSFunctionality();
  }
}

// Función para obtener información del usuario usando /users/me
async function getUserInfoMe(token) {
  try {
    const response = await fetch("http://localhost:8080/users/me", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      console.warn("Endpoint /users/me no disponible:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error en /users/me:", error);
    return null;
  }
}

// Función para obtener información del usuario por ID
async function getUserInfoById(userId, token) {
  try {
    const response = await fetch(`http://localhost:8080/users/${userId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      console.warn("Error obteniendo usuario por ID:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error en /users/:id:", error);
    return null;
  }
}

// Función para mostrar alertas del token
function showTokenAlert(message, shouldRedirect) {
  alert(message);
  
  if (shouldRedirect) {
    setTimeout(() => {
      localStorage.removeItem('jwt_token');
      window.location.href = '../html/login.html';
    }, 2000);
  }
}

// Función para cargar información del usuario en la interfaz
function loadUserInfo(userData) {
  try {
    if (userData.username) {
      document.getElementById('userName').textContent = `Cajero: ${userData.username}`;
      
      // Crear avatar con iniciales
      const initials = userData.username.charAt(0).toUpperCase();
      const userAvatar = document.getElementById('userAvatar');
      if (userAvatar) {
        userAvatar.textContent = initials;
      }
    }
  } catch (error) {
    console.error("Error cargando información del usuario:", error);
  }
}

// Función para decodificar JWT
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decodificando JWT:", error);
    return null;
  }
}

// Función para configurar toda la funcionalidad del POS
function setupPOSFunctionality() {
  console.log("POS inicializado");
  
  // Inicializar carrito vacío
  initializeCart();
  
  // Configurar event listeners
  setupEventListeners();
  
  // Cargar datos iniciales si es necesario
  loadInitialData();
}

// Función para inicializar el carrito
function initializeCart() {
  const cartBody = document.getElementById('cartBody');
  const emptyCartMessage = document.getElementById('emptyCartMessage');
  const totalAmount = document.getElementById('totalAmount');
  
  if (cartBody) cartBody.innerHTML = '';
  if (emptyCartMessage) emptyCartMessage.style.display = 'block';
  if (totalAmount) totalAmount.textContent = '$0.00';
}

// Función para configurar todos los event listeners
function setupEventListeners() {
  // Buscar cliente
  const searchCustomerBtn = document.getElementById('searchCustomerBtn');
  if (searchCustomerBtn) {
    searchCustomerBtn.addEventListener('click', searchCustomer);
  }
  
  // Añadir producto
  const addProductBtn = document.getElementById('addProductBtn');
  if (addProductBtn) {
    addProductBtn.addEventListener('click', addProduct);
  }
  
  // Buscar producto
  const searchProductBtn = document.getElementById('searchProductBtn');
  if (searchProductBtn) {
    searchProductBtn.addEventListener('click', searchProduct);
  }
  
  // Aplicar descuento
  const applyDiscountBtn = document.getElementById('applyDiscountBtn');
  if (applyDiscountBtn) {
    applyDiscountBtn.addEventListener('click', applyDiscount);
  }
  
  // Eliminar producto
  const removeProductBtn = document.getElementById('removeProductBtn');
  if (removeProductBtn) {
    removeProductBtn.addEventListener('click', removeProduct);
  }
  
  // Añadir otro producto
  const addAnotherProductBtn = document.getElementById('addAnotherProductBtn');
  if (addAnotherProductBtn) {
    addAnotherProductBtn.addEventListener('click', addAnotherProduct);
  }
  
  // Cobrar
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', processCheckout);
  }
  
  // Reporte diario
  const dailyReportBtn = document.getElementById('dailyReportBtn');
  if (dailyReportBtn) {
    dailyReportBtn.addEventListener('click', generateDailyReport);
  }
  
  // Cierre de caja
  const closeRegisterBtn = document.getElementById('closeRegisterBtn');
  if (closeRegisterBtn) {
    closeRegisterBtn.addEventListener('click', closeRegister);
  }
}

// Función para cargar datos iniciales
function loadInitialData() {
  // Aquí puedes cargar productos, clientes, etc. si es necesario
  console.log("Cargando datos iniciales...");
}

// Funciones de la lógica del POS (implementa según tus necesidades)
function searchCustomer() {
  console.log("Buscando cliente...");
  // Tu lógica para buscar cliente
  alert("Funcionalidad de búsqueda de cliente");
}

function addProduct() {
  console.log("Añadiendo producto...");
  // Tu lógica para añadir producto
  alert("Funcionalidad de añadir producto");
}

function searchProduct() {
  console.log("Buscando producto...");
  // Tu lógica para buscar producto
  alert("Funcionalidad de búsqueda de producto");
}

function applyDiscount() {
  console.log("Aplicando descuento...");
  // Tu lógica para aplicar descuento
  alert("Funcionalidad de aplicar descuento");
}

function removeProduct() {
  console.log("Eliminando producto...");
  // Tu lógica para eliminar producto
  alert("Funcionalidad de eliminar producto");
}

function addAnotherProduct() {
  console.log("Añadiendo otro producto...");
  // Tu lógica para añadir otro producto
  alert("Funcionalidad de añadir otro producto");
}

function processCheckout() {
  console.log("Procesando pago...");
  // Tu lógica para procesar el pago
  alert("Funcionalidad de procesar pago");
}

function generateDailyReport() {
  console.log("Generando reporte diario...");
  // Tu lógica para generar reporte
  alert("Funcionalidad de reporte diario");
}

function closeRegister() {
  console.log("Cerrando caja...");
  // Tu lógica para cerrar caja
  alert("Funcionalidad de cierre de caja");
}

// Función para obtener el token (útil para otras funciones)
function getToken() {
  return localStorage.getItem('jwt_token');
}

// Función para logout
function logout() {
  localStorage.removeItem('jwt_token');
  window.location.href = '../html/login.html';
}