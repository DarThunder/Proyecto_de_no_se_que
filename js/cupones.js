class CuponManager {
  constructor() {
    this.API_BASE = "http://localhost:8080/coupons";
    this.init();
  }

  async init() {
    await this.verificarAutenticacion();
    await this.cargarCupones();
    this.configurarEventListeners();
  }

  async verificarAutenticacion() {
    try {
      const response = await fetch("http://localhost:8080/users/me", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("No autenticado");
      }

      const userData = await response.json();

      if (userData.role.permission_ring !== 0) {
        this.mostrarError(
          "No tienes permisos de administrador para acceder a esta página"
        );
        setTimeout(() => {
          window.location.href = "../index.html";
        }, 3000);
        return;
      }

      document.getElementById("username-display").textContent =
        userData.username;
    } catch (error) {
      console.error("Error de autenticación:", error);
      this.mostrarError("Debes iniciar sesión como administrador");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 3000);
    }
  }

  configurarEventListeners() {
    const form = document.getElementById("cupon-form");
    form.addEventListener("submit", (e) => this.crearCupon(e));
  }

  async crearCupon(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const cuponData = {
      nombre: formData.get("nombre"),
      descuento: parseInt(formData.get("descuento")),
      fecha_expiracion: formData.get("fecha_expiracion") || null,
      usos_maximos: formData.get("usos_maximos")
        ? parseInt(formData.get("usos_maximos"))
        : null,
    };

    const submitBtn = document.getElementById("submit-btn");
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Creando...';

    try {
      const response = await fetch(this.API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(cuponData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al crear cupón");
      }

      this.mostrarMensaje("Cupón creado exitosamente", "success");
      event.target.reset();
      await this.cargarCupones();
    } catch (error) {
      this.mostrarError(error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bx bx-plus"></i> Crear Cupón';
    }
  }

  async cargarCupones() {
    const cuponesList = document.getElementById("cupones-list");
    cuponesList.innerHTML = '<div class="loading">Cargando cupones...</div>';

    try {
      const response = await fetch(this.API_BASE, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al cargar cupones");
      }

      const cupones = await response.json();
      this.mostrarCupones(cupones);
    } catch (error) {
      cuponesList.innerHTML = `<div class="alert alert-error">Error al cargar cupones: ${error.message}</div>`;
    }
  }

  mostrarCupones(cupones) {
    const cuponesList = document.getElementById("cupones-list");

    if (cupones.length === 0) {
      cuponesList.innerHTML =
        '<div class="loading">No hay cupones creados</div>';
      return;
    }

    cuponesList.innerHTML = cupones
      .map(
        (cupon) => `
            <div class="cupon-card">
                <div class="cupon-header">
                    <span class="cupon-codigo">${cupon.code}</span>
                    <span class="cupon-descuento">${cupon.discount}% OFF</span>
                </div>
                <div class="cupon-nombre">${cupon.name}</div>
                <div class="cupon-info">
                    <span>Creado: ${new Date(
                      cupon.createdAt
                    ).toLocaleDateString()}</span>
                    <span>Usos: ${cupon.actual_uses}${
          cupon.maximum_uses ? `/${cupon.maximum_uses}` : ""
        }</span>
                </div>
                <div class="cupon-info">
                    <span>Estado: ${cupon.active ? "Activo" : "Inactivo"}</span>
                    ${
                      cupon.fecha_expiracion
                        ? `<span>Expira: ${new Date(
                            cupon.fecha_expiracion
                          ).toLocaleDateString()}</span>`
                        : "<span>Sin expiración</span>"
                    }
                </div>
                <div class="cupon-actions">
                    <button class="btn-danger" onclick="cuponManager.eliminarCupon('${
                      cupon._id
                    }')">
                        <i class='bx bx-trash'></i> Eliminar
                    </button>
                    <button class="btn-secondary" onclick="cuponManager.toggleActivo('${
                      cupon._id
                    }', ${!cupon.active})">
                        ${cupon.active ? "Desactivar" : "Activar"}
                    </button>
                </div>
            </div>
        `
      )
      .join("");
  }

  async eliminarCupon(id) {
    if (!confirm("¿Estás seguro de que quieres eliminar este cupón?")) {
      return;
    }

    try {
      const response = await fetch(`${this.API_BASE}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar cupón");
      }

      this.mostrarMensaje("Cupón eliminado exitosamente", "success");
      await this.cargarCupones();
    } catch (error) {
      this.mostrarError(error.message);
    }
  }

  async toggleActivo(id, nuevoEstado) {
    try {
      const response = await fetch(`${this.API_BASE}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ activo: nuevoEstado }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar cupón");
      }

      this.mostrarMensaje(
        `Cupón ${nuevoEstado ? "activado" : "desactivado"} exitosamente`,
        "success"
      );
      await this.cargarCupones();
    } catch (error) {
      this.mostrarError(error.message);
    }
  }

  mostrarMensaje(mensaje, tipo) {
    const alertDiv = document.getElementById("alert-message");
    alertDiv.innerHTML = `
            <div class="alert alert-${tipo}">
                ${mensaje}
            </div>
        `;

    setTimeout(() => {
      alertDiv.innerHTML = "";
    }, 5000);
  }

  mostrarError(mensaje) {
    this.mostrarMensaje(mensaje, "error");
  }
}

// Funciones globales
function logout() {
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  window.location.href = "login.html";
}

// Inicializar el manager cuando se cargue la página
const cuponManager = new CuponManager();

// Hacer funciones disponibles globalmente
window.cargarCupones = () => cuponManager.cargarCupones();
window.cuponManager = cuponManager;
