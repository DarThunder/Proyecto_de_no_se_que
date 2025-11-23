// js/ReporteVendedores.html.js

/*
 * ===============================================
 * INICIO: Autenticación y Carga Inicial
 * (Copiado y adaptado de reportes.js)
 * ===============================================
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
      await loadEmployeeSalesReport();
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
 * HU 25: Carga el reporte de ventas por vendedor
 */
async function loadEmployeeSalesReport() {
  const tableBody = document.getElementById("report-table-body");
  tableBody.innerHTML = '<tr><td colspan="5">Cargando reporte...</td></tr>';

  try {
    const response = await fetch(
      "http://localhost:8080/reports/sales-by-employee",
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.message || "Error al cargar el reporte.");
    }

    const employeeSales = await response.json();

    tableBody.innerHTML = ""; // Limpiamos la tabla

    if (employeeSales.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="5">No hay datos de ventas de empleados para mostrar.</td></tr>';
      return;
    }

    // Función para formatear a moneda
    const formatCurrency = (amount) =>
      new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
      }).format(amount || 0);

    employeeSales.forEach((item) => {
      const tr = document.createElement("tr");

      // Manejamos usuarios 'online' que pueden no tener username
      const username = item.username || "Cliente Web";
      const email = item.email || "N/A";

      tr.innerHTML = `
                <td>${username}</td>
                <td>${email}</td>
                <td>${item.totalSales}</td>
                <td>${formatCurrency(item.totalRevenue)}</td>
                <td>${formatCurrency(item.averageTicket)}</td>
            `;
      tableBody.appendChild(tr);
    });
  } catch (error) {
    console.error(error.message);
    tableBody.innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
  }
}
