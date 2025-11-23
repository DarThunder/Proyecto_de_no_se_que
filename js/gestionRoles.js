document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://localhost:8080/roles";
  const tableBody = document.getElementById("roles-tbody");
  const modal = document.getElementById("rol-modal");
  const form = document.getElementById("rol-form");

  loadRoles();

  document.getElementById("btn-crear-rol").addEventListener("click", () => {
    document.getElementById("rol-id").value = "";
    form.reset();
    document.getElementById("modal-title").textContent = "Crear Nuevo Rol";
    modal.style.display = "block";
  });

  document
    .querySelector(".close")
    .addEventListener("click", () => (modal.style.display = "none"));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("rol-id").value;
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
      loadRoles();
      alert("Guardado correctamente");
    } catch (error) {
      alert(error.message);
    }
  });

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

  window.editarRol = (id, name, ring, desc) => {
    document.getElementById("rol-id").value = id;
    document.getElementById("rol-nombre").value = name;
    document.getElementById("rol-ring").value = ring;
    document.getElementById("rol-desc").value = desc;
    document.getElementById("modal-title").textContent = "Editar Rol";
    modal.style.display = "block";
  };
});
