/**
 * @file js/GestionCategorias.js
 * @description Administra el CRUD completo de categorías en el panel de administración.
 * Utiliza una clase `CategoryManager` para encapsular la lógica de autenticación,
 * carga de datos, renderizado de tarjetas, gestión de modales y operaciones con la API.
 */

/**
 * Clase principal para la gestión de categorías.
 * Maneja el estado local de las categorías y la interfaz de usuario correspondiente.
 */
class CategoryManager {
  /**
   * Crea una instancia del administrador de categorías.
   * Inicializa el estado vacío y dispara el proceso de inicio.
   */
  constructor() {
    /** @type {Array<Object>} Lista local de categorías cargadas. */
    this.categories = [];

    /** @type {string|null} ID de la categoría que se está editando actualmente (null si es creación). */
    this.currentCategoryId = null;

    /** @type {File|null} Archivo de imagen seleccionado para subir. */
    this.currentImageFile = null;

    this.init();
  }

  /**
   * Inicializa el componente.
   * Ejecuta la verificación de seguridad, carga inicial de datos y configuración de eventos.
   * @async
   */
  async init() {
    console.log("🔧 CategoryManager inicializando...");
    try {
      await this.checkAuthAndPermissions();
      await this.loadCategories();
      this.setupEventListeners();
      console.log("✅ CategoryManager inicializado correctamente");
    } catch (error) {
      console.error("❌ Error inicializando CategoryManager:", error);
    }
  }

  /**
   * Verifica que el usuario tenga sesión activa y permisos de Administrador (Ring 0).
   * Redirige al login o al dashboard si los permisos son insuficientes.
   * @async
   * @throws {Error} Si la sesión no es válida o el rol no es adecuado.
   */
  async checkAuthAndPermissions() {
    try {
      console.log("🔐 Verificando autenticación...");
      const meResponse = await fetch("http://localhost:8080/users/me", {
        method: "GET",
        credentials: "include",
      });

      if (!meResponse.ok) {
        throw new Error("No autorizado. Redirigiendo al login.");
      }

      const userInfo = await meResponse.json();
      console.log("👤 Usuario autenticado:", userInfo);

      // SOLO ADMIN (permission_ring = 0)
      if (userInfo.role && userInfo.role.permission_ring === 0) {
        const usernameElement = document.getElementById("admin-username");
        if (usernameElement) {
          usernameElement.textContent = userInfo.username || "Admin";
        }
        console.log("✅ Permisos de administrador confirmados");
      } else {
        throw new Error(
          "Acceso denegado. Solo los administradores pueden gestionar categorías."
        );
      }
    } catch (error) {
      console.error("❌ Error en autenticación:", error.message);

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
   * Obtiene todas las categorías desde la API (incluyendo inactivas) para el panel de administración.
   * @async
   */
  async loadCategories() {
    try {
      console.log("📦 Cargando categorías...");
      const response = await fetch(
        "http://localhost:8080/categories/admin/all",
        {
          credentials: "include",
        }
      );

      console.log("📡 Response status:", response.status);

      if (response.ok) {
        this.categories = await response.json();
        console.log(`✅ ${this.categories.length} categorías cargadas`);
        this.renderCategories();
      } else {
        throw new Error("Error al cargar categorías: " + response.status);
      }
    } catch (error) {
      console.error("❌ Error cargando categorías:", error);
      this.showNotification(
        "Error al cargar categorías: " + error.message,
        "error"
      );
    }
  }

  /**
   * Helper para obtener solo categorías activas (útil para selectores públicos).
   * @async
   * @returns {Promise<Array<Object>>} Lista de categorías activas.
   */
  async getActiveCategories() {
    try {
      const response = await fetch("http://localhost:8080/categories", {
        credentials: "include",
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error("Error al cargar categorías activas");
      }
    } catch (error) {
      console.error("Error obteniendo categorías activas:", error);
      return [];
    }
  }

  /**
   * Renderiza las tarjetas de categorías en el grid del DOM.
   * Maneja el estado vacío y asigna estilos visuales según el estado (activa/inactiva).
   */
  renderCategories() {
    const grid = document.getElementById("categories-grid");
    if (!grid) {
      console.error("No se encontró el elemento categories-grid");
      return;
    }

    grid.innerHTML = "";

    if (this.categories.length === 0) {
      grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open fa-3x"></i>
                    <h3>No hay categorías registradas</h3>
                    <p>Comienza agregando tu primera categoría</p>
                </div>
            `;
      return;
    }

    this.categories.forEach((category) => {
      const categoryCard = document.createElement("div");
      categoryCard.className = `category-card ${
        !category.isActive ? "inactive" : ""
      }`;

      // Procesamiento de URL de imagen (rutas relativas/absolutas)
      let imageUrl = category.image_url || "/sources/img/category_default.png";
      if (!imageUrl.startsWith("/")) {
        imageUrl = "/" + imageUrl;
      }
      if (imageUrl.startsWith("/sources/")) {
        imageUrl = ".." + imageUrl;
      }

      categoryCard.innerHTML = `
                <div class="category-image">
                    <img src="${imageUrl}" 
                         alt="${category.name}"
                         onerror="this.src='../sources/img/category_default.png'">
                    ${
                      !category.isActive
                        ? '<div class="inactive-badge">Inactiva</div>'
                        : ""
                    }
                </div>
                <div class="category-info">
                    <h3 class="category-name">${this.escapeHtml(
                      category.name
                    )}</h3>
                    <p class="category-description">${this.escapeHtml(
                      category.description || "Sin descripción"
                    )}</p>
                    <div class="category-meta">
                        <span class="category-status ${
                          category.isActive ? "active" : "inactive"
                        }">
                            <i class="fas fa-circle"></i>
                            ${category.isActive ? "Activa" : "Inactiva"}
                        </span>
                        <span class="category-date">
                            Creada: ${new Date(
                              category.createdAt
                            ).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                <div class="category-actions">
                    <button class="btn btn-sm btn-edit" data-id="${
                      category._id
                    }" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm ${
                      category.isActive ? "btn-warning" : "btn-success"
                    }" 
                            data-id="${category._id}" 
                            data-action="toggle"
                            title="${
                              category.isActive ? "Desactivar" : "Activar"
                            }">
                        <i class="fas ${
                          category.isActive ? "fa-eye-slash" : "fa-eye"
                        }"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" data-id="${
                      category._id
                    }" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

      grid.appendChild(categoryCard);
    });

    this.addCardEventListeners();
  }

  /**
   * Escapa caracteres HTML para prevenir XSS al renderizar texto de usuario.
   * @param {string} text - Texto sin procesar.
   * @returns {string} Texto seguro para insertar en HTML.
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Configura los listeners globales de la página (botones principales, modales, logout).
   */
  setupEventListeners() {
    console.log("🎯 Configurando event listeners...");

    // Botón agregar categoría
    const addBtn = document.getElementById("add-category-btn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        this.openCategoryModal();
      });
    }

    // Gestión de imágenes (input file y preview)
    this.setupImageHandlers();

    // Modal de edición/creación
    this.setupModalHandlers();

    // Envío del formulario
    const categoryForm = document.getElementById("category-form");
    if (categoryForm) {
      categoryForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveCategory();
      });
    }

    // Modal de eliminación
    this.setupDeleteModalHandlers();

    // Botón de cerrar sesión
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
          console.error("Error al cerrar sesión", err);
        } finally {
          alert("Sesión cerrada.");
          window.location.href = "login.html";
        }
      });
    }
  }

  /**
   * Configura la lógica de previsualización de imágenes al seleccionar un archivo o escribir una URL.
   */
  setupImageHandlers() {
    const selectImageBtn = document.getElementById("select-image-btn");
    const imageFileInput = document.getElementById("category-image-file");
    const imageUrlInput = document.getElementById("category-image");

    // Manejo de archivo local
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
          reader.onload = (e) => {
            this.updateImagePreview(e.target.result);
            if (imageUrlInput)
              imageUrlInput.value = `Imagen seleccionada: ${file.name}`;
            this.currentImageFile = file;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Manejo de URL externa
    if (imageUrlInput) {
      imageUrlInput.addEventListener("input", (e) => {
        const url = e.target.value.trim();
        if (
          url &&
          (url.startsWith("http") ||
            url.startsWith("/") ||
            url.startsWith("../"))
        ) {
          this.updateImagePreview(url);
          this.currentImageFile = null;
        } else if (!url) {
          this.updateImagePreview(null);
        }
      });
    }
  }

  /**
   * Helper para actualizar el elemento visual de previsualización de imagen.
   * @param {string|null} src - Fuente de la imagen o null para ocultar.
   */
  updateImagePreview(src) {
    const previewImg = document.getElementById("preview-img");
    const imagePreview = document.getElementById("image-preview");

    if (src) {
      if (previewImg) previewImg.src = src;
      if (imagePreview) imagePreview.style.display = "block";
    } else {
      if (imagePreview) imagePreview.style.display = "none";
    }
  }

  /**
   * Configura los listeners para cerrar el modal de categoría (X, Cancelar, click fuera).
   */
  setupModalHandlers() {
    const modal = document.getElementById("category-modal");
    if (modal) {
      const closeBtn = modal.querySelector(".close");
      const cancelBtn = document.getElementById("cancel-btn");

      if (closeBtn)
        closeBtn.addEventListener("click", () => this.closeCategoryModal());
      if (cancelBtn)
        cancelBtn.addEventListener("click", () => this.closeCategoryModal());

      window.addEventListener("click", (e) => {
        if (e.target === modal) this.closeCategoryModal();
      });
    }
  }

  /**
   * Configura los listeners para el modal de confirmación de eliminación.
   */
  setupDeleteModalHandlers() {
    const deleteModal = document.getElementById("delete-modal");
    if (deleteModal) {
      const deleteCloseBtn = deleteModal.querySelector(".close");
      const cancelDeleteBtn = document.getElementById("cancel-delete");
      const confirmDeleteBtn = document.getElementById("confirm-delete");

      if (deleteCloseBtn)
        deleteCloseBtn.addEventListener("click", () => this.closeDeleteModal());
      if (cancelDeleteBtn)
        cancelDeleteBtn.addEventListener("click", () =>
          this.closeDeleteModal()
        );
      if (confirmDeleteBtn)
        confirmDeleteBtn.addEventListener("click", () => this.deleteCategory());

      window.addEventListener("click", (e) => {
        if (e.target === deleteModal) this.closeDeleteModal();
      });
    }
  }

  /**
   * Abre el modal de formulario para crear o editar.
   * @param {Object|null} category - Objeto categoría a editar, o null para crear.
   */
  openCategoryModal(category = null) {
    const modal = document.getElementById("category-modal");
    const title = document.getElementById("modal-title");
    const form = document.getElementById("category-form");

    if (!modal || !title || !form) return;

    form.reset();
    this.currentImageFile = null;
    this.updateImagePreview(null);

    const activeToggle = document.getElementById("active-toggle");

    if (category) {
      title.textContent = "Editar Categoría";
      this.currentCategoryId = category._id;
      this.fillCategoryForm(category);
      if (activeToggle) activeToggle.style.display = "block";
    } else {
      title.textContent = "Agregar Categoría";
      this.currentCategoryId = null;
      if (activeToggle) activeToggle.style.display = "none";
    }

    modal.style.display = "block";
  }

  /**
   * Rellena el formulario con los datos de una categoría existente.
   * @param {Object} category - Datos de la categoría.
   */
  fillCategoryForm(category) {
    document.getElementById("category-id").value = category._id;
    document.getElementById("category-name").value = category.name;
    document.getElementById("category-description").value =
      category.description || "";
    document.getElementById("category-image").value = category.image_url || "";
    document.getElementById("category-active").checked =
      category.isActive !== false;

    if (category.image_url) {
      this.updateImagePreview(category.image_url);
    }
  }

  /**
   * Cierra el modal de formulario.
   */
  closeCategoryModal() {
    const modal = document.getElementById("category-modal");
    if (modal) modal.style.display = "none";
  }

  /**
   * Guarda los cambios del formulario (Crear o Editar).
   * Maneja la subida de datos al backend.
   * @async
   */
  async saveCategory() {
    const formData = this.getFormData();

    if (!this.validateForm(formData)) return;

    try {
      const url = this.currentCategoryId
        ? `http://localhost:8080/categories/admin/${this.currentCategoryId}`
        : "http://localhost:8080/categories/admin";

      const method = this.currentCategoryId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        this.showNotification(
          `Categoría ${
            this.currentCategoryId ? "actualizada" : "creada"
          } correctamente`,
          "success"
        );
        this.closeCategoryModal();
        await this.loadCategories();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }
    } catch (error) {
      console.error("Error:", error);
      this.showNotification("Error al guardar: " + error.message, "error");
    }
  }

  /**
   * Recolecta y procesa los datos del formulario HTML.
   * Maneja la lógica de rutas de imagen (uploaded vs URL).
   * @returns {Object} Objeto con los datos listos para enviar.
   */
  getFormData() {
    const formData = {
      name: document.getElementById("category-name").value,
      description: document.getElementById("category-description").value,
      image_url: document.getElementById("category-image").value,
    };

    if (this.currentCategoryId) {
      formData.isActive = document.getElementById("category-active").checked;
    }

    // Lógica de normalización de rutas de imagen
    if (this.currentImageFile) {
      // Nombre simulado para archivo subido
      formData.image_url = `/sources/img/uploaded_${Date.now()}_${
        this.currentImageFile.name
      }`;
    } else if (formData.image_url) {
      // Ajustes para rutas relativas
      if (
        formData.image_url.startsWith("sources/") &&
        !formData.image_url.startsWith("/sources/")
      ) {
        formData.image_url = "/" + formData.image_url;
      } else if (
        !formData.image_url.startsWith("http") &&
        !formData.image_url.startsWith("/") &&
        !formData.image_url.includes("sources/")
      ) {
        formData.image_url = "/sources/img/" + formData.image_url;
      }
    } else {
      formData.image_url = "/sources/img/category_default.png";
    }

    return formData;
  }

  /**
   * Valida los datos del formulario antes de enviar.
   * @param {Object} formData
   * @returns {boolean} true si es válido, false si no.
   */
  validateForm(formData) {
    if (!formData.name.trim()) {
      this.showNotification("El nombre de la categoría es requerido", "error");
      return false;
    }
    if (formData.name.trim().length < 2) {
      this.showNotification(
        "El nombre debe tener al menos 2 caracteres",
        "error"
      );
      return false;
    }
    return true;
  }

  /**
   * Asigna listeners a los botones de las tarjetas (Editar, Toggle, Eliminar).
   * Se llama cada vez que se renderiza el grid.
   */
  addCardEventListeners() {
    // Botones Editar
    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const categoryId = e.currentTarget.getAttribute("data-id");
        this.editCategory(categoryId);
      });
    });

    // Botones Eliminar
    document.querySelectorAll(".btn-danger").forEach((btn) => {
      if (!btn.closest(".modal-footer")) {
        btn.addEventListener("click", (e) => {
          const categoryId = e.currentTarget.getAttribute("data-id");
          this.openDeleteModal(categoryId);
        });
      }
    });

    // Botones Toggle (Activar/Desactivar)
    document.querySelectorAll('[data-action="toggle"]').forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const categoryId = e.currentTarget.getAttribute("data-id");
        this.toggleCategory(categoryId);
      });
    });
  }

  /**
   * Inicia el proceso de edición buscando la categoría y abriendo el modal.
   * @param {string} categoryId
   */
  async editCategory(categoryId) {
    const category = this.categories.find((c) => c._id === categoryId);
    if (category) {
      this.openCategoryModal(category);
    }
  }

  /**
   * Cambia el estado (activo/inactivo) de una categoría mediante llamada PATCH.
   * @async
   * @param {string} categoryId
   */
  async toggleCategory(categoryId) {
    try {
      const response = await fetch(
        `http://localhost:8080/categories/admin/${categoryId}/toggle`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      if (response.ok) {
        const result = await response.json();
        this.showNotification(result.message, "success");
        await this.loadCategories();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al cambiar estado");
      }
    } catch (error) {
      console.error("Error:", error);
      this.showNotification("Error: " + error.message, "error");
    }
  }

  /**
   * Abre el modal de confirmación de eliminación.
   * @param {string} categoryId
   */
  openDeleteModal(categoryId) {
    this.currentCategoryId = categoryId;
    const category = this.categories.find((c) => c._id === categoryId);
    const modal = document.getElementById("delete-modal");
    const message = document.getElementById("delete-message");

    if (modal && message && category) {
      message.textContent = `¿Estás seguro de que quieres eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`;
      modal.style.display = "block";
    }
  }

  /**
   * Cierra el modal de confirmación de eliminación.
   */
  closeDeleteModal() {
    const modal = document.getElementById("delete-modal");
    if (modal) modal.style.display = "none";
    this.currentCategoryId = null;
  }

  /**
   * Ejecuta la eliminación de la categoría en el backend.
   * @async
   */
  async deleteCategory() {
    if (!this.currentCategoryId) return;

    try {
      const response = await fetch(
        `http://localhost:8080/categories/admin/${this.currentCategoryId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        this.showNotification("Categoría eliminada correctamente", "success");
        this.closeDeleteModal();
        await this.loadCategories();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar la categoría");
      }
    } catch (error) {
      console.error("Error:", error);
      this.showNotification("Error al eliminar: " + error.message, "error");
    }
  }

  /**
   * Muestra una notificación flotante (Toast) en la pantalla.
   * @param {string} message - Mensaje a mostrar.
   * @param {'info'|'success'|'error'|'warning'} [type='info'] - Tipo de notificación.
   */
  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;

    // Estilos inline para asegurar visibilidad inmediata
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${
              type === "success"
                ? "#2ecc71"
                : type === "error"
                ? "#e74c3c"
                : "#3498db"
            };
            color: white;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-width: 300px;
        `;

    document.body.appendChild(notification);

    // Auto-eliminar
    setTimeout(() => {
      if (notification.parentNode)
        notification.parentNode.removeChild(notification);
    }, 5000);

    // Botón cerrar
    const closeBtn = notification.querySelector(".notification-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        if (notification.parentNode)
          notification.parentNode.removeChild(notification);
      });
    }
  }
}

/**
 * Inicializa la clase Manager cuando el DOM está listo.
 */
document.addEventListener("DOMContentLoaded", () => {
  new CategoryManager();
});
