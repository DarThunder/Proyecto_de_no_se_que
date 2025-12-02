/**
 * @file js/IStockBajo.js
 * @description Módulo de gestión de inventario crítico.
 * Permite visualizar el estado del stock de todos los productos, clasificarlos por niveles de alerta (Bajo, Medio, Normal)
 * y enviar solicitudes de reabastecimiento (notificaciones) al gerente.
 */

/**
 * Inicializa el módulo de stock bajo cuando el DOM está listo.
 * Configura referencias al DOM, constantes de niveles de stock y la lógica de la aplicación.
 * @listens document#DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", function () {
  // --- Referencias al DOM ---
  const statsCritical = document.querySelector(".stat-card:nth-child(1) h3");
  const statsWarning = document.querySelector(".stat-card:nth-child(2) h3");
  const statsNormal = document.querySelector(".stat-card:nth-child(3) h3");
  const alertBanner = document.querySelector(".alert-banner");
  const alertMessage = document.getElementById("alertMessage");
  const tableBody = document.querySelector("tbody");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const reorderForm = document.getElementById("reorderForm");
  const closeForm = document.getElementById("closeForm");
  const orderForm = document.getElementById("orderForm");
  const productNameInput = document.getElementById("productName");
  const userAvatar = document.getElementById("userAvatar");
  const userName = document.getElementById("userName");
  const userRole = document.getElementById("userRole");

  // --- Estado de la aplicación ---
  /** @type {Array<Object>} Lista completa de productos procesados. */
  let allProducts = [];
  /** @type {Array<Object>} Lista de productos filtrados actualmente visibles. */
  let filteredProducts = [];
  /** @type {string} Filtro activo actual ('all', 'bajo', 'medio', 'normal'). */
  let currentFilter = "all";

  // --- Configuración ---
  /**
   * Umbrales para determinar el estado del inventario.
   * @const {Object}
   */
  const STOCK_LEVELS = {
    BAJO: 15, // 0-15 unidades: Crítico/Bajo
    MEDIO: 50, // 16-49 unidades: Advertencia/Medio
    NORMAL: 50, // 50+ unidades: Normal
  };

  /**
   * Envía una notificación de solicitud de reabastecimiento al backend.
   * @async
   * @param {Object} orderDetails - Detalles del pedido.
   * @param {string} orderDetails.productName - Nombre del producto.
   * @param {string} orderDetails.productId - ID del producto/variante.
   * @param {string} orderDetails.supplier - ID del proveedor seleccionado.
   * @param {number} orderDetails.quantity - Cantidad solicitada.
   * @param {string} orderDetails.urgency - Nivel de urgencia.
   * @returns {Promise<boolean>} True si el envío fue exitoso, false si falló.
   */
  async function sendManagerNotification(orderDetails) {
    try {
      console.log("Enviando notificación al gerente:", orderDetails);

      // Determinar la URL base (manejo de puertos para desarrollo local)
      const baseUrl = window.location.origin.includes("5500")
        ? "http://localhost:8080"
        : window.location.origin;

      const response = await fetch(`${baseUrl}/messages/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productName: orderDetails.productName,
          variantId: orderDetails.productId,
          supplier: orderDetails.supplier,
          supplierName: orderDetails.supplierName,
          quantity: parseInt(orderDetails.quantity),
          urgency: orderDetails.urgency,
          orderId: orderDetails.orderId || "N/A",
          requestedBy: "Encargado de Inventario",
          notes:
            orderDetails.notes ||
            "Solicitud de reabastecimiento por stock bajo",
        }),
      });

      if (response.ok) {
        console.log("✅ Notificación enviada al gerente correctamente");
        return true;
      } else {
        console.error(
          "❌ Error al enviar notificación al gerente:",
          response.status
        );
        return false;
      }
    } catch (error) {
      console.error("❌ Error enviando notificación:", error);
      return false;
    }
  }

  /**
   * Abre el formulario modal de reabastecimiento para un producto específico.
   * Pre-selecciona la urgencia sugerida basada en el stock actual.
   * @param {string} productId - ID de la variante/producto.
   * @param {string} productName - Nombre para mostrar en el formulario.
   */
  function openReorderForm(productId, productName) {
    const form = document.getElementById("reorderForm");
    const productInput = document.getElementById("productName");

    productInput.value = productName;
    form.style.display = "block";
    form.dataset.productId = productId;

    // Auto-seleccionar urgencia basada en el stock actual
    const product = allProducts.find((p) => p.id === productId);
    if (product) {
      const urgencySelect = document.getElementById("urgency");
      if (urgencySelect) {
        if (product.stock <= 5) {
          urgencySelect.value = "critical";
        } else if (product.stock <= 15) {
          urgencySelect.value = "urgent";
        } else {
          urgencySelect.value = "normal";
        }
      }
    }
  }

  /**
   * Procesa el envío del formulario de reabastecimiento.
   * Recolecta datos, valida y llama a `sendManagerNotification`.
   * @async
   */
  async function submitReorderForm() {
    const form = document.getElementById("reorderForm");
    const productId = form.dataset.productId;
    const productName = document.getElementById("productName").value;
    const supplierSelect = document.getElementById("supplier");
    const quantity = document.getElementById("quantity").value;
    const urgency = document.getElementById("urgency").value;

    if (!supplierSelect.value) {
      alert("Por favor selecciona un proveedor");
      return;
    }

    const supplier = supplierSelect.value;
    const supplierName =
      supplierSelect.options[supplierSelect.selectedIndex].text;

    try {
      // Enviar notificación al gerente
      const notificationSent = await sendManagerNotification({
        productId: productId,
        productName: productName,
        supplier: supplier,
        supplierName: supplierName,
        quantity: quantity,
        urgency: urgency,
      });

      if (notificationSent) {
        alert(
          `✅ ¡Solicitud enviada al gerente!\n\nProducto: ${productName}\nCantidad: ${quantity}\nProveedor: ${supplierName}\nUrgencia: ${urgency}`
        );
      } else {
        alert(
          `⚠️ Error al enviar notificación\n\nProducto: ${productName}\nCantidad: ${quantity}\nProveedor: ${supplierName}`
        );
      }

      closeReorderForm();
    } catch (error) {
      console.error("Error realizando pedido:", error);
      alert("Error al realizar el pedido");
    }
  }

  /**
   * Cierra el formulario modal y resetea sus campos.
   */
  function closeReorderForm() {
    document.getElementById("reorderForm").style.display = "none";
    document.getElementById("orderForm").reset();
  }

  // Exponer funciones necesarias al scope global para los botones onclick inline
  window.openReorderForm = openReorderForm;
  window.closeReorderForm = closeReorderForm;
  window.submitReorderForm = submitReorderForm;

  /**
   * Función orquestadora de inicialización.
   * Carga datos de usuario y productos, y configura eventos.
   */
  async function init() {
    await loadUserInfo();
    await loadProducts();
    setupEventListeners();
  }

  /**
   * Carga la información del usuario en el header (Actualmente datos mock).
   */
  async function loadUserInfo() {
    try {
      // TODO: Conectar con /users/me para datos reales si es necesario
      const user = {
        name: "Inventario",
        role: "Encargado del Inventario",
        initials: "I",
      };

      userAvatar.textContent = user.initials;
      userName.textContent = user.name;
      userRole.textContent = user.role;
    } catch (error) {
      console.error("Error cargando información del usuario:", error);
    }
  }

  /**
   * Obtiene la lista de productos desde la API y procesa sus niveles de stock.
   * Actualiza la tabla, estadísticas y banners.
   * @async
   */
  async function loadProducts() {
    try {
      showLoadingState();

      const baseUrl = window.location.origin.includes("5500")
        ? "http://localhost:8080"
        : window.location.origin;

      const response = await fetch(`${baseUrl}/products`);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const variants = await response.json();
      allProducts = processProductData(variants);

      applyFilter("all");
      updateStats();
      updateAlertBanner();
    } catch (error) {
      console.error("Error cargando productos:", error);
      showErrorState("Error al cargar los productos.");
    }
  }

  /**
   * Transforma los datos crudos de la API en un formato optimizado para la tabla de inventario.
   * Calcula el nivel de stock (`stockLevel`) y estado para cada variante.
   * @param {Array<Object>} variants - Datos crudos de la API.
   * @returns {Array<Object>} Lista procesada de productos.
   */
  function processProductData(variants) {
    return variants
      .map((variant) => {
        const product = variant.product;

        if (!product) {
          console.warn("Variante sin producto:", variant);
          return null;
        }

        const stockLevel = getStockLevel(variant.stock);

        let imageUrl = product.image_url || "/sources/img/logo_negro.png";
        if (!imageUrl.startsWith("/")) {
          imageUrl = "/" + imageUrl;
        }

        return {
          id: variant._id,
          productId: product._id,
          name: product.name,
          category: product.category,
          size: variant.size,
          sku: variant.sku,
          stock: variant.stock,
          stockLevel: stockLevel,
          status: getStockStatus(stockLevel),
          minStock: STOCK_LEVELS.BAJO,
          image: imageUrl,
        };
      })
      .filter((product) => product !== null);
  }

  /**
   * Determina la categoría de nivel de stock basada en la cantidad.
   * @param {number} stock
   * @returns {'bajo'|'medio'|'normal'}
   */
  function getStockLevel(stock) {
    if (stock <= STOCK_LEVELS.BAJO) return "bajo";
    if (stock < STOCK_LEVELS.NORMAL) return "medio";
    return "normal";
  }

  /**
   * Devuelve una etiqueta legible para el estado del stock.
   * @param {string} level
   * @returns {string} Texto UI (ej. 'Bajo', 'Normal').
   */
  function getStockStatus(level) {
    const statusMap = {
      bajo: "Bajo",
      medio: "Medio",
      normal: "Normal",
    };
    return statusMap[level] || "Desconocido";
  }

  /**
   * Filtra la lista de productos visible según el criterio seleccionado.
   * @param {'all'|'bajo'|'medio'|'normal'} filter
   */
  function applyFilter(filter) {
    currentFilter = filter;

    switch (filter) {
      case "bajo":
        filteredProducts = allProducts.filter((p) => p.stockLevel === "bajo");
        break;
      case "medio":
        filteredProducts = allProducts.filter((p) => p.stockLevel === "medio");
        break;
      case "normal":
        filteredProducts = allProducts.filter((p) => p.stockLevel === "normal");
        break;
      default:
        filteredProducts = allProducts;
    }

    renderTable();
    updateFilterButtons();
  }

  /**
   * Genera el HTML de la tabla con los productos filtrados.
   */
  function renderTable() {
    if (filteredProducts.length === 0) {
      tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 10px; color: var(--success);"></i>
                        <br>
                        ${
                          currentFilter === "all"
                            ? "No hay productos con stock bajo"
                            : "No hay productos"
                        }
                    </td>
                </tr>
            `;
      return;
    }

    tableBody.innerHTML = filteredProducts
      .map(
        (product) => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${product.image}" alt="${product.name}" 
                            style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                        <div>
                            <strong>${product.name}</strong>
                            <br>
                            <small style="color: #666;">Talla: ${
                              product.size
                            } | SKU: ${product.sku}</small>
                        </div>
                    </div>
                </td>
                <td>${
                  product.category.charAt(0).toUpperCase() +
                  product.category.slice(1)
                }</td>
                <td class="stock-${product.stockLevel}">${
          product.stock
        } unidades</td>
                <td>
                    <span class="stock-${product.stockLevel}">
                        ${product.status}
                        ${
                          product.stockLevel === "bajo"
                            ? ' <i class="fas fa-exclamation-circle"></i>'
                            : product.stockLevel === "medio"
                            ? ' <i class="fas fa-clock"></i>'
                            : ' <i class="fas fa-check-circle"></i>'
                        }
                    </span>
                </td>
                <td>
                    <button class="action-btn order-btn" 
                            onclick="openReorderForm('${product.id}', '${
          product.name
        } - ${product.size}')"
                            ${
                              product.stockLevel === "normal"
                                ? 'disabled style="opacity: 0.5;"'
                                : ""
                            }>
                        <i class="fas fa-box"></i> Pedir
                    </button>
                </td>
            </tr>
        `
      )
      .join("");
  }

  /**
   * Actualiza el estado visual (clase `active`) de los botones de filtro.
   */
  function updateFilterButtons() {
    filterButtons.forEach((btn) => {
      const filterType = btn.textContent.toLowerCase();
      btn.classList.toggle(
        "active",
        (filterType === "todos" && currentFilter === "all") ||
          (filterType === "normal" && currentFilter === "normal") ||
          (filterType === "medio" && currentFilter === "medio") ||
          (filterType === "bajo" && currentFilter === "bajo")
      );
    });
  }

  /**
   * Recalcula y actualiza los contadores de las tarjetas de estadísticas.
   */
  function updateStats() {
    const bajoCount = allProducts.filter((p) => p.stockLevel === "bajo").length;
    const medioCount = allProducts.filter(
      (p) => p.stockLevel === "medio"
    ).length;
    const normalCount = allProducts.filter(
      (p) => p.stockLevel === "normal"
    ).length;

    statsCritical.textContent = bajoCount;
    statsWarning.textContent = medioCount;
    statsNormal.textContent = normalCount;
  }

  /**
   * Muestra u oculta el banner de alerta superior si hay productos críticos.
   */
  function updateAlertBanner() {
    // Nota: El código original buscaba 'critical', pero el nivel se define como 'bajo' en getStockLevel
    const criticalProducts = allProducts.filter((p) => p.stockLevel === "bajo"); // Corregido conceptualmente a 'bajo' para coincidir con lógica

    if (criticalProducts.length > 0) {
      alertMessage.textContent = `${criticalProducts.length} producto(s) tienen niveles de inventario por debajo del mínimo.`;
      alertBanner.style.display = "flex";
    } else {
      alertBanner.style.display = "none";
    }
  }

  function showLoadingState() {
    tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <br>
                    Cargando productos del inventario...
                </td>
            </tr>
        `;
  }

  function showErrorState(message) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--danger);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <br>
                    ${message}
                    <br>
                    <button onclick="location.reload()" class="action-btn order-btn" style="margin-top: 10px;">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </td>
            </tr>
        `;
  }

  /**
   * Configura los event listeners para filtros, formularios y cierre de modales.
   */
  function setupEventListeners() {
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        const filter = this.textContent.toLowerCase();
        const filterMap = {
          todos: "all",
          normal: "normal",
          medio: "medio",
          bajo: "bajo",
        };
        applyFilter(filterMap[filter] || "all");
      });
    });

    closeForm.addEventListener("click", closeReorderForm);

    orderForm.addEventListener("submit", function (e) {
      e.preventDefault();
      submitReorderForm();
    });

    // Cerrar modal al hacer click fuera
    document.addEventListener("click", function (e) {
      if (
        reorderForm.style.display === "block" &&
        !reorderForm.contains(e.target) &&
        !e.target.classList.contains("order-btn")
      ) {
        closeReorderForm();
      }
    });
  }

  // Inicializar
  init();
});
