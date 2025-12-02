/**
 * @file js/gestionRoles.js
 * @description Administra el CRUD (Crear, Leer, Actualizar, Eliminar) de los roles de usuario.
 * Permite definir nuevos roles, asignarles un nivel de permisos (`permission_ring`) y una descripción.
 * Los roles con nivel 0 (Sistema/Admin Supremo) están protegidos y no pueden ser eliminados ni editados completamente.
 */

/**
 * Inicializa el gestor de roles cuando el DOM está listo.
 * Configura las referencias globales, carga la lista inicial y asigna los listeners del modal.
 * @listens document#DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", () => {
  /** * URL base del endpoint de roles en la API.
   * @const {string}
   */
  const API_URL = "http://localhost:8080/roles";

  /** @type {HTMLElement} Cuerpo de la tabla donde se listarán los roles. */
  const tableBody = document.getElementById("roles-tbody");

  /** @type {HTMLElement} Modal para crear/editar roles. */
  const modal = document.getElementById("rol-modal");

  /** @type {HTMLFormElement} Formulario dentro del modal. */
  const form = document.getElementById("rol-form");

  // Cargar lista inicial
  loadRoles();

  // Listener para botón "Crear Nuevo Rol"
  document.getElementById("btn-crear-rol").addEventListener("click", () => {
    document.getElementById("rol-id").value = ""; // Limpiar ID para indicar creación
    form.reset();
    document.getElementById("modal-title").textContent = "Crear Nuevo Rol";
    modal.style.display = "block";
  });

  // Listener para cerrar modal (X)
  document
    .querySelector(".close")
    .addEventListener("click", () => (modal.style.display = "none"));

  /**
   * Maneja el envío del formulario (Crear o Editar).
   * Determina el método HTTP (POST/PUT) según si existe un ID en el campo oculto.
   * @event submit
   */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("rol-id").value;

    // Recolección de datos
    const data = {
      name: document.getElementById("rol-nombre").value,
      permission_ring: parseInt(document.getElementById("rol-ring").value),
      description: document.getElementById("rol-desc").value,
    };

    try {
      const method = id ? "PUT" : "POST";
      const url = id ? `${API_URL}/${id}` : API_URL;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al guardar");

      modal.style.display = "none";
      loadRoles(); // Recargar tabla
      alert("Guardado correctamente");
    } catch (error) {
      alert(error.message);
    }
  });

  /**
   * Obtiene la lista de roles desde el backend y renderiza la tabla HTML.
   * Aplica lógica visual para proteger roles de sistema (Ring 0).
   * @async
   */
  async function loadRoles() {
    try {
      const res = await fetch(API_URL, { credentials: "include" });
      const roles = await res.json();

      tableBody.innerHTML = roles
        .map(
          (rol) => `
                <tr>
                    <td><strong>${rol.name}</strong></td>
                    <td><span class="badge">${rol.permission_ring}</span></td>
                    <td>${rol.description || "-"}</td>
                    <td>
                        ${
                          // Protección para el rol de Administrador Supremo (Ring 0)
                          rol.permission_ring === 0
                            ? '<span style="color:gray">Sistema</span>'
                            : `
                        <button class="btn btn-sm btn-edit" onclick="editarRol('${
                          rol._id
                        }', '${rol.name}', ${rol.permission_ring}, '${
                                rol.description || ""
                              }')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarRol('${
                          rol._id
                        }')">
                            <i class="fas fa-trash"></i>
                        </button>
                        `
                        }
                    </td>
                </tr>
            `
        )
        .join("");
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Elimina un rol específico.
   * Función expuesta globalmente (`window`) para ser llamada desde el HTML dinámico.
   * @async
   * @global
   * @param {string} id - ID del rol a eliminar.
   */
  window.eliminarRol = async (id) => {
    if (!confirm("¿Estás seguro?")) return;
    try {
      await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      loadRoles();
    } catch (e) {
      alert("Error al eliminar");
    }
  };

  /**
   * Abre el modal en modo edición y pre-carga los datos del rol.
   * Función expuesta globalmente.
   * @global
   * @param {string} id - ID del rol.
   * @param {string} name - Nombre actual.
   * @param {number} ring - Nivel de permisos actual.
   * @param {string} desc - Descripción actual.
   */
  window.editarRol = (id, name, ring, desc) => {
    document.getElementById("rol-id").value = id;
    document.getElementById("rol-nombre").value = name;
    document.getElementById("rol-ring").value = ring;
    document.getElementById("rol-desc").value = desc;

    document.getElementById("modal-title").textContent = "Editar Rol";
    modal.style.display = "block";
  };
});
