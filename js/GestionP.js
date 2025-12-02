/**
 * @file js/GestionP.js
 * @description Módulo de administración de productos.
 * Define la clase `ProductManager` que gestiona el ciclo de vida completo de los productos (CRUD),
 * incluyendo la gestión de variantes (tallas/SKUs), control de stock y subida de imágenes.
 */

/**
 * Clase principal para la gestión de productos.
 * Encapsula la lógica de autenticación, renderizado de tabla, manejo de modales
 * y comunicación con la API de productos.
 */
class ProductManager {
  /**
   * Crea una instancia del administrador de productos.
   * Inicializa el estado y dispara el proceso de carga.
   */
  constructor() {
    /** @type {Array<Object>} Lista local de productos cargados. */
    this.products = [];

    /** @type {string|null} ID del producto en edición (null si es creación). */
    this.currentProductId = null;

    /** @type {File|null} Archivo de imagen seleccionado para subir. */
    this.currentImageFile = null;

    /** @type {Array<Object>|null} Variantes del producto en edición de stock. */
    this.currentProductVariants = null;

    this.init();
  }

  /**
   * Inicializa el componente.
   * Verifica permisos, carga productos y configura los eventos del DOM.
   * @async
   */
  async init() {
    await this.checkAuthAndPermissions();
    await this.loadProducts();
    this.setupEventListeners();
  }

  /**
   * Verifica que el usuario tenga sesión activa y permisos de Administrador (Ring 0).
   * @async
   * @throws {Error} Si la sesión no es válida o el rol no es adecuado.
   */
  async checkAuthAndPermissions() {
    try {
      const meResponse = await fetch("http://localhost:8080/users/me", {
        method: "GET",
        credentials: "include",
      });

      if (!meResponse.ok) {
        throw new Error("No autorizado. Redirigiendo al login.");
      }

      const userInfo = await meResponse.json();

      // SOLO ADMIN (permission_ring = 0)
      if (userInfo.role && userInfo.role.permission_ring === 0) {
        const usernameEl = document.getElementById("admin-username");
        if (usernameEl) usernameEl.textContent = userInfo.username || "Admin";
      } else {
        throw new Error(
          "Acceso denegado. Solo los administradores pueden gestionar productos."
        );
      }
    } catch (error) {
      console.error(error.message);
      const userConfirmed = confirm(
        "Acceso denegado. Debes iniciar sesión como Administrador.\n\n¿Deseas ir al Login? (Cancelar para ir al Dashboard)"
      );

      if (userConfirmed) {
        window.location.href = "login.html";
      } else {
        window.location.href = "admin.html";
      }
      throw error;
    }
  }

  /**
   * Carga la lista completa de productos desde la API de administración.
   * @async
   */
  async loadProducts() {
    try {
      const response = await fetch("http://localhost:8080/products/admin/all", {
        credentials: "include",
      });

      if (response.ok) {
        this.products = await response.json();
        this.renderProducts();
      } else {
        throw new Error("Error al cargar productos: " + response.status);
      }
    } catch (error) {
      console.error("Error:", error);
      this.showNotification(
        "Error al cargar productos: " + error.message,
        "error"
      );
    }
  }

  /**
   * Renderiza la tabla HTML con los productos cargados.
   * Calcula el stock total sumando las variantes y formatea la información para su visualización.
   */
  renderProducts() {
    const tbody = document.getElementById("products-table-body");
    if (!tbody) {
      console.error("No se encontró el elemento products-table-body");
      return;
    }

    tbody.innerHTML = "";

    if (this.products.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem;">
                        No hay productos registrados
                    </td>
                </tr>
            `;
      return;
    }

    this.products.forEach((product) => {
      const row = document.createElement("tr");

      // Calcular stock total sumando variantes
      const totalStock = product.variants
        ? product.variants.reduce(
            (sum, variant) => sum + (variant.stock || 0),
            0
          )
        : 0;

      // Generar resumen de texto de variantes (ej: "S: 10, M: 5")
      const variantsInfo =
        product.variants && product.variants.length > 0
          ? product.variants.map((v) => `${v.size}: ${v.stock}`).join(", ")
          : "Sin variantes";

      // Normalización de URL de imagen
      let imageUrl = product.image_url || "/sources/img/logo_negro.png";
      if (!imageUrl.startsWith("/")) imageUrl = "/" + imageUrl;
      if (imageUrl.startsWith("/sources/")) imageUrl = ".." + imageUrl;

      row.innerHTML = `
                <td>
                    <img src="${imageUrl}" 
                         alt="${product.name}" 
                         class="product-thumbnail"
                         onerror="this.src='../sources/img/logo_negro.png'">
                </td>
                <td>${this.escapeHtml(product.name)}</td>
                <td>$${(product.base_price || 0).toFixed(2)}</td>
                <td>${this.capitalizeFirstLetter(product.category)}</td>
                <td>${this.escapeHtml(product.productType)}</td>
                <td>${totalStock}</td>
                <td>
                    <small>${variantsInfo}</small>
                    <br>
                    <button class="btn btn-sm btn-info manage-stock-btn" data-id="${
                      product._id
                    }">
                        <i class="fas fa-warehouse"></i> Gestionar Stock
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-edit" data-id="${
                      product._id
                    }">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" data-id="${
                      product._id
                    }">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

      tbody.appendChild(row);
    });

    this.addTableEventListeners();
  }

  /**
   * Escapa caracteres HTML para prevenir XSS.
   * @param {string} text
   * @returns {string} Texto seguro.
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Capitaliza la primera letra de una cadena.
   * @param {string} string
   * @returns {string}
   */
  capitalizeFirstLetter(string) {
    return string ? string.charAt(0).toUpperCase() + string.slice(1) : "";
  }

  /**
   * Configura los listeners globales (botones principales, modales, imagen, logout).
   */
  setupEventListeners() {
    // Botón agregar producto
    const addBtn = document.getElementById("add-product-btn");
    if (addBtn) addBtn.addEventListener("click", () => this.openProductModal());

    // Gestión de imagen (selección de archivo y preview)
    this.setupImageHandlers();

    // Modal de producto (Crear/Editar)
    this.setupModalHandlers();

    // Envío del formulario principal
    const productForm = document.getElementById("product-form");
    if (productForm) {
      productForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveProduct();
      });
    }

    // Botón para añadir campos de variantes dinámicamente
    const addVariantBtn = document.getElementById("add-variant-btn");
    if (addVariantBtn) {
      addVariantBtn.addEventListener("click", () => this.addVariantField());
    }

    // Modal de eliminación
    this.setupDeleteModalHandlers();

    // Modal de gestión de stock
    this.setupStockModalHandlers();

    // Logout
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await fetch("http://localhost:8080/auth/logout", {
            method: "POST",
            credentials: "include",
          });
        } catch (err) {
          console.error(err);
        } finally {
          alert("Sesión cerrada.");
          window.location.href = "login.html";
        }
      });
    }
  }

  /**
   * Configura la previsualización de imagen (input file y URL).
   */
  setupImageHandlers() {
    const selectImageBtn = document.getElementById("select-image-btn");
    const imageFileInput = document.getElementById("product-image-file");
    const imageUrlInput = document.getElementById("product-image");
    const imagePreview = document.getElementById("image-preview");
    const previewImg = document.getElementById("preview-img");

    if (selectImageBtn && imageFileInput) {
      selectImageBtn.addEventListener("click", () => imageFileInput.click());

      imageFileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if (file.size > 5 * 1024 * 1024) {
            this.showNotification(
              "La imagen es muy grande. Máximo 5MB.",
              "error"
            );
            return;
          }
          const reader = new FileReader();
          reader.onload = (ev) => {
            previewImg.src = ev.target.result;
            imagePreview.style.display = "block";
            imageUrlInput.value = `Imagen seleccionada: ${file.name}`;
            this.currentImageFile = file;
          };
          reader.readAsDataURL(file);
        }
      });

      imageUrlInput.addEventListener("input", (e) => {
        const url = e.target.value.trim();
        if (
          url &&
          (url.startsWith("http") ||
            url.startsWith("/") ||
            url.startsWith("../"))
        ) {
          previewImg.src = url;
          imagePreview.style.display = "block";
          this.currentImageFile = null;
        } else if (!url) {
          imagePreview.style.display = "none";
        }
      });
    }
  }

  /**
   * Configura el comportamiento de cierre del modal de producto.
   */
  setupModalHandlers() {
    const modal = document.getElementById("product-modal");
    if (modal) {
      const closeBtn = modal.querySelector(".close");
      const cancelBtn = document.getElementById("cancel-btn");
      if (closeBtn)
        closeBtn.addEventListener("click", () => this.closeProductModal());
      if (cancelBtn)
        cancelBtn.addEventListener("click", () => this.closeProductModal());
      window.addEventListener("click", (e) => {
        if (e.target === modal) this.closeProductModal();
      });
    }
  }

  /**
   * Configura el comportamiento del modal de eliminación.
   */
  setupDeleteModalHandlers() {
    const deleteModal = document.getElementById("delete-modal");
    if (deleteModal) {
      const closeEls = deleteModal.querySelectorAll(".close, #cancel-delete");
      closeEls.forEach((el) =>
        el.addEventListener("click", () => this.closeDeleteModal())
      );

      window.addEventListener("click", (e) => {
        if (e.target === deleteModal) this.closeDeleteModal();
      });

      const confirmDeleteBtn = document.getElementById("confirm-delete");
      if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", () => this.deleteProduct());
      }
    }
  }

  /**
   * Configura el comportamiento del modal de gestión de stock.
   */
  setupStockModalHandlers() {
    const stockModal = document.getElementById("stock-modal");
    if (stockModal) {
      const closeEls = stockModal.querySelectorAll(".close, #cancel-stock-btn");
      closeEls.forEach((el) =>
        el.addEventListener("click", () => this.closeStockModal())
      );

      const saveStockBtn = document.getElementById("save-stock-btn");
      if (saveStockBtn)
        saveStockBtn.addEventListener("click", () => this.saveStockChanges());

      window.addEventListener("click", (e) => {
        if (e.target === stockModal) this.closeStockModal();
      });
    }
  }

  /**
   * Añade listeners a los botones dinámicos de la tabla (Editar, Eliminar, Stock).
   */
  addTableEventListeners() {
    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const productId = e.currentTarget.getAttribute("data-id");
        this.editProduct(productId);
      });
    });

    document.querySelectorAll(".btn-danger").forEach((btn) => {
      if (
        !btn.closest(".modal-footer") &&
        !btn.classList.contains("remove-variant")
      ) {
        btn.addEventListener("click", (e) => {
          const productId = e.currentTarget.getAttribute("data-id");
          this.openDeleteModal(productId);
        });
      }
    });

    document.querySelectorAll(".manage-stock-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const productId = e.currentTarget.getAttribute("data-id");
        this.openStockModal(productId);
      });
    });
  }

  /**
   * Abre el modal de producto para crear (sin argumentos) o editar (con producto).
   * @param {Object|null} product - Objeto producto a editar.
   */
  openProductModal(product = null) {
    const modal = document.getElementById("product-modal");
    const title = document.getElementById("modal-title");
    const form = document.getElementById("product-form");
    const imagePreview = document.getElementById("image-preview");

    if (!modal || !title || !form) return;

    form.reset();
    document.getElementById("variants-container").innerHTML = "";
    if (imagePreview) imagePreview.style.display = "none";
    this.currentImageFile = null;

    if (product) {
      title.textContent = "Editar Producto";
      this.currentProductId = product._id;
      this.fillProductForm(product);
    } else {
      title.textContent = "Agregar Producto";
      this.currentProductId = null;
      this.addVariantField(); // Añadir un campo de variante vacío por defecto
    }

    modal.style.display = "block";
  }

  /**
   * Rellena el formulario con los datos de un producto existente.
   * @param {Object} product
   */
  fillProductForm(product) {
    document.getElementById("product-id").value = product._id;
    document.getElementById("product-name").value = product.name;
    document.getElementById("product-price").value = product.base_price;
    document.getElementById("product-description").value =
      product.description || "";
    document.getElementById("product-image").value = product.image_url || "";
    document.getElementById("product-category").value = product.category;
    document.getElementById("product-type").value = product.productType;

    const imageUrl = document.getElementById("product-image").value;
    const imagePreview = document.getElementById("image-preview");
    const previewImg = document.getElementById("preview-img");

    if (imageUrl && imagePreview && previewImg) {
      previewImg.src = imageUrl;
      imagePreview.style.display = "block";
    }

    const variantsContainer = document.getElementById("variants-container");
    variantsContainer.innerHTML = "";

    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((variant) => this.addVariantField(variant));
    } else {
      this.addVariantField();
    }
  }

  /**
   * Añade un nuevo bloque de campos para una variante (Talla, SKU, Stock) al formulario.
   * @param {Object|null} variant - Datos de variante para pre-llenar (opcional).
   */
  addVariantField(variant = null) {
    const container = document.getElementById("variants-container");
    if (!container) return;

    const variantId = Date.now() + Math.random();

    const variantHtml = `
            <div class="variant-row" data-id="${variantId}">
                <div class="variant-fields">
                    <select class="variant-size" required>
                        <option value="">Talla</option>
                        <option value="XS" ${
                          variant?.size === "XS" ? "selected" : ""
                        }>XS</option>
                        <option value="S" ${
                          variant?.size === "S" ? "selected" : ""
                        }>S</option>
                        <option value="M" ${
                          variant?.size === "M" ? "selected" : ""
                        }>M</option>
                        <option value="L" ${
                          variant?.size === "L" ? "selected" : ""
                        }>L</option>
                        <option value="XL" ${
                          variant?.size === "XL" ? "selected" : ""
                        }>XL</option>
                    </select>
                    <input type="text" class="variant-sku" placeholder="SKU" value="${
                      variant?.sku || ""
                    }" required>
                    <input type="number" class="variant-stock" placeholder="Stock" value="${
                      variant?.stock || 0
                    }" min="0" required>
                    <button type="button" class="btn btn-sm btn-danger remove-variant">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;

    container.insertAdjacentHTML("beforeend", variantHtml);

    const newRow = container.querySelector(`[data-id="${variantId}"]`);
    const removeBtn = newRow.querySelector(".remove-variant");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => newRow.remove());
    }
  }

  closeProductModal() {
    const modal = document.getElementById("product-modal");
    if (modal) modal.style.display = "none";
  }

  /**
   * Guarda el producto (Creación o Edición).
   * Recolecta datos, valida y envía la petición al backend.
   * @async
   */
  async saveProduct() {
    const formData = this.getFormData();

    if (!this.validateForm(formData)) return;

    try {
      const url = this.currentProductId
        ? `http://localhost:8080/products/admin/${this.currentProductId}`
        : "http://localhost:8080/products/admin";

      const method = this.currentProductId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        this.showNotification(
          `Producto ${
            this.currentProductId ? "actualizado" : "creado"
          } correctamente`,
          "success"
        );
        this.closeProductModal();
        await this.loadProducts();
      } else {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error("Error:", error);
      this.showNotification(
        "Error al guardar el producto: " + error.message,
        "error"
      );
    }
  }

  /**
   * Extrae los datos del formulario y construye el objeto producto.
   * Maneja la lógica de nombres de archivo para imágenes subidas.
   * @returns {Object} Objeto producto formateado.
   */
  getFormData() {
    const variants = [];
    document.querySelectorAll(".variant-row").forEach((row) => {
      const size = row.querySelector(".variant-size").value;
      const sku = row.querySelector(".variant-sku").value;
      const stock = parseInt(row.querySelector(".variant-stock").value);

      if (size && sku) {
        variants.push({ size, sku, stock: stock || 0 });
      }
    });

    const formData = {
      name: document.getElementById("product-name").value,
      base_price: parseFloat(document.getElementById("product-price").value),
      description: document.getElementById("product-description").value,
      image_url: document.getElementById("product-image").value,
      category: document.getElementById("product-category").value,
      productType: document.getElementById("product-type").value,
      variants: variants,
    };

    if (this.currentImageFile) {
      formData.image_url = `uploaded_${Date.now()}_${
        this.currentImageFile.name
      }`;
    }

    return formData;
  }

  /**
   * Valida la integridad de los datos del producto antes de enviar.
   * @param {Object} formData
   * @returns {boolean}
   */
  validateForm(formData) {
    if (!formData.name.trim()) {
      this.showNotification("El nombre del producto es requerido", "error");
      return false;
    }
    if (!formData.base_price || formData.base_price <= 0) {
      this.showNotification("El precio debe ser mayor a 0", "error");
      return false;
    }
    if (formData.variants.length === 0) {
      this.showNotification("Debe agregar al menos una variante", "error");
      return false;
    }
    const skus = formData.variants.map((v) => v.sku);
    if (new Set(skus).size !== skus.length) {
      this.showNotification("Los SKUs deben ser únicos", "error");
      return false;
    }
    return true;
  }

  /**
   * Inicia la edición de un producto.
   * Carga las variantes actualizadas desde el servidor antes de abrir el modal.
   * @async
   * @param {string} productId
   */
  async editProduct(productId) {
    const product = this.products.find((p) => p._id === productId);
    if (product) {
      try {
        const response = await fetch(
          `http://localhost:8080/products/${productId}/variants`,
          {
            credentials: "include",
          }
        );
        if (response.ok) {
          product.variants = await response.json();
        }
      } catch (error) {
        console.error("Error al cargar variantes:", error);
      }

      this.openProductModal(product);
    }
  }

  // --- MÉTODOS DE GESTIÓN DE STOCK ---

  /**
   * Abre el modal específico para gestión rápida de stock.
   * @async
   * @param {string} productId
   */
  async openStockModal(productId) {
    const product = this.products.find((p) => p._id === productId);
    if (!product) return;

    try {
      // Asegurar tener las variantes más recientes
      const response = await fetch(
        `http://localhost:8080/products/${productId}/variants`,
        { credentials: "include" }
      );
      if (response.ok) {
        product.variants = await response.json();
      }
    } catch (error) {
      this.showNotification(
        "Error al cargar las variantes del producto",
        "error"
      );
      return;
    }

    this.currentProductId = productId;
    this.currentProductVariants = product.variants;
    document.getElementById("stock-product-name").textContent = product.name;

    this.renderStockForm(product);
    document.getElementById("stock-modal").style.display = "block";
  }

  /**
   * Genera el formulario de stock (lista de variantes con inputs de cantidad).
   * @param {Object} product
   */
  renderStockForm(product) {
    const container = document.getElementById("variants-stock-list");
    if (!container) return;

    container.innerHTML = "";

    if (!product.variants || product.variants.length === 0) {
      container.innerHTML =
        '<p class="no-variants">No hay variantes para este producto.</p>';
      return;
    }

    product.variants.forEach((variant) => {
      const variantHtml = `
                <div class="variant-stock-item" data-variant-id="${variant._id}">
                    <div class="variant-info">
                        <div class="variant-header">
                            <strong>Talla: ${variant.size}</strong>
                            <span class="variant-sku">SKU: ${variant.sku}</span>
                        </div>
                        <div class="stock-info">
                            <span>Stock actual: <strong class="current-stock">${variant.stock}</strong></span>
                        </div>
                    </div>
                    <div class="stock-controls">
                        <label for="stock-${variant._id}">Nuevo Stock:</label>
                        <input type="number" id="stock-${variant._id}" class="stock-input" 
                               value="${variant.stock}" min="0" required
                               onchange="this.style.borderColor = this.value != ${variant.stock} ? '#3498db' : '#34495e'">
                    </div>
                </div>
            `;
      container.insertAdjacentHTML("beforeend", variantHtml);
    });
  }

  /**
   * Guarda los cambios realizados en el modal de stock.
   * Detecta qué variantes han cambiado y envía una actualización masiva.
   * @async
   */
  async saveStockChanges() {
    if (!this.currentProductId || !this.currentProductVariants) return;

    const stockInputs = document.querySelectorAll(".stock-input");
    const updatedVariants = [];
    let hasChanges = false;

    stockInputs.forEach((input) => {
      const variantId = input
        .closest(".variant-stock-item")
        .getAttribute("data-variant-id");
      const newStock = parseInt(input.value);
      const originalVariant = this.currentProductVariants.find(
        (v) => v._id === variantId
      );

      if (
        originalVariant &&
        !isNaN(newStock) &&
        newStock >= 0 &&
        newStock !== originalVariant.stock
      ) {
        updatedVariants.push({ ...originalVariant, stock: newStock });
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      this.showNotification("No hay cambios para guardar", "warning");
      return;
    }

    try {
      this.showNotification("Actualizando stock...", "info");
      const response = await fetch(
        `http://localhost:8080/products/admin/${this.currentProductId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ variants: updatedVariants }),
        }
      );

      if (response.ok) {
        this.showNotification("Stock actualizado correctamente", "success");
        this.closeStockModal();
        await this.loadProducts();
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      this.showNotification(
        "Error al actualizar el stock: " + error.message,
        "error"
      );
    }
  }

  closeStockModal() {
    const modal = document.getElementById("stock-modal");
    if (modal) modal.style.display = "none";
    this.currentProductId = null;
    this.currentProductVariants = null;
  }

  // --- MÉTODOS DE ELIMINACIÓN ---

  openDeleteModal(productId) {
    this.currentProductId = productId;
    const modal = document.getElementById("delete-modal");
    if (modal) modal.style.display = "block";
  }

  closeDeleteModal() {
    const modal = document.getElementById("delete-modal");
    if (modal) modal.style.display = "none";
    this.currentProductId = null;
  }

  async deleteProduct() {
    if (!this.currentProductId) return;

    try {
      const response = await fetch(
        `http://localhost:8080/products/admin/${this.currentProductId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        this.showNotification("Producto eliminado correctamente", "success");
        this.closeDeleteModal();
        await this.loadProducts();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar");
      }
    } catch (error) {
      console.error("Error:", error);
      this.showNotification("Error: " + error.message, "error");
    }
  }

  /**
   * Muestra una notificación flotante.
   * @param {string} message
   * @param {'info'|'success'|'error'|'warning'} type
   */
  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `<span>${message}</span><button class="notification-close">&times;</button>`;

    // Estilos inline básicos para funcionamiento inmediato
    notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 15px 20px;
            background: ${
              type === "success"
                ? "#2ecc71"
                : type === "error"
                ? "#e74c3c"
                : type === "warning"
                ? "#f39c12"
                : "#3498db"
            };
            color: white; border-radius: 5px; z-index: 10000; display: flex; align-items: center;
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) notification.remove();
    }, 5000);
    notification
      .querySelector(".notification-close")
      .addEventListener("click", () => notification.remove());
  }
}

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  new ProductManager();
});
