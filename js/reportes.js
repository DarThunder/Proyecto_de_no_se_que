/**
 * @file js/reportes.js
 * @description Gestiona la visualización de reportes de negocio generales en el panel de administración.
 * Se centra principalmente en cargar y mostrar el informe de "Productos Más Vendidos" (Best Sellers).
 * Incluye verificación de roles (Admin/Gerente) y formateo de datos monetarios.
 */

/*
 * ===============================================
 * INICIO: Autenticación y Carga Inicial
 * ===============================================
 */

/**
 * Inicializa la página de reportes cuando el DOM está listo.
 * 1. Verifica la sesión y los permisos del usuario (debe ser Admin o Gerente).
 * 2. Carga el reporte principal si la autenticación es exitosa.
 * 3. Configura el botón de cierre de sesión.
 * @listens document#DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Verificar la autenticación y permisos
  try {
    const meResponse = await fetch("http://localhost:8080/users/me", {
      method: "GET",
      credentials: "include", // Envía la cookie de sesión
    });

    if (!meResponse.ok) {
      throw new Error("No autorizado. Redirigiendo al login.");
    }

    const userInfo = await meResponse.json();

    // Verificamos el rol (Admin=0, Gerente=1)
    if (userInfo.role && userInfo.role.permission_ring <= 1) {
      document.getElementById("admin-username").textContent =
        userInfo.username || "Admin";
      // Si el usuario es válido, cargamos el reporte
      await loadBestSellersReport();
    } else {
      throw new Error("Acceso denegado. Redirigiendo al login.");
    }
  } catch (error) {
    console.error(error.message);
    alert(
      "Acceso denegado. Debes iniciar sesión como Gerente o Administrador."
    );
    window.location.href = "login.html";
  }

  // 2. Lógica del botón de Cerrar Sesión
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
});
/*
 * ===============================================
 * FIN: Autenticación y Carga Inicial
 * ===============================================
 */

/**
 * HU 31: Carga y renderiza el reporte de productos más vendidos desde la API.
 * Obtiene los datos agregados, formatea los ingresos como moneda y maneja
 * la visualización de imágenes de productos.
 * @async
 */
async function loadBestSellersReport() {
  const tableBody = document.getElementById("report-table-body");
  // Indicador de carga
  tableBody.innerHTML = '<tr><td colspan="6">Cargando reporte...</td></tr>';

  try {
    const response = await fetch("http://localhost:8080/reports/bestsellers", {
      credentials: "include",
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.message || "Error al cargar el reporte.");
    }

    /** @type {Array<Object>} Lista de productos con métricas de ventas. */
    const bestSellers = await response.json();

    tableBody.innerHTML = ""; // Limpiamos la tabla

    if (bestSellers.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="6">No hay datos de ventas para mostrar.</td></tr>';
      return;
    }

    bestSellers.forEach((item) => {
      const tr = document.createElement("tr");

      // Formatear moneda (ej. "$1,250.50 MXN")
      const revenue = new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
      }).format(item.revenue || 0);

      // Ajuste de ruta de imagen (subir un nivel desde /html/)
      const imageUrl = item.productImage
        ? `../${item.productImage}`
        : "../sources/img/logo_negro.png";

      tr.innerHTML = `
                <td><img src="${imageUrl}" alt="${
        item.productName
      }" style="width: 50px; height: auto; border-radius: 4px;"></td>
                <td>${item.productName || "Producto no encontrado"}</td>
                <td>${item.productSku || "N/A"}</td>
                <td>${item.productSize || "N/A"}</td>
                <td>${item.quantitySold}</td>
                <td>${revenue}</td>
            `;
      tableBody.appendChild(tr);
    });
  } catch (error) {
    console.error(error.message);
    tableBody.innerHTML = `<tr><td colspan="6">Error: ${error.message}</td></tr>`;
  }
}
