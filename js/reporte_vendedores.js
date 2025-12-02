/**
 * @file js/reporte_vendedores.js
 * @description Genera el reporte de desempeño de ventas por vendedor (empleado).
 * Verifica permisos administrativos, obtiene los datos agregados de ventas por usuario
 * desde el backend y renderiza una tabla con métricas clave (Total Ventas, Ingresos, Ticket Promedio).
 */

/*
 * ===============================================
 * INICIO: Autenticación y Carga Inicial
 * ===============================================
 */

/**
 * Inicializa la página de reportes cuando el DOM está listo.
 * 1. Verifica la sesión y que el usuario tenga rol de Admin (0) o Gerente (1).
 * 2. Muestra el nombre del usuario en el encabezado.
 * 3. Inicia la carga de los datos del reporte.
 * 4. Configura el botón de cierre de sesión.
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

      // Si el usuario es válido, cargamos el reporte específico
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
 * HU 25: Carga y renderiza el reporte de ventas desglosado por empleado.
 * Consume el endpoint `/reports/sales-by-employee`, maneja estados de carga/error
 * y formatea los valores monetarios para la tabla.
 * @async
 */
async function loadEmployeeSalesReport() {
  const tableBody = document.getElementById("report-table-body");

  // Mostrar estado de carga
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

    /** @type {Array<Object>} Lista de métricas por empleado. */
    const employeeSales = await response.json();

    tableBody.innerHTML = ""; // Limpiamos la tabla

    if (employeeSales.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="5">No hay datos de ventas de empleados para mostrar.</td></tr>';
      return;
    }

    /**
     * Función interna para formatear números a moneda (MXN).
     * @param {number} amount - Cantidad monetaria.
     * @returns {string} Cadena formateada (ej. "$1,500.00 MXN").
     */
    const formatCurrency = (amount) =>
      new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
      }).format(amount || 0);

    // Renderizar cada fila del reporte
    employeeSales.forEach((item) => {
      const tr = document.createElement("tr");

      // Manejo de usuarios 'online' o eliminados que pueden no tener username
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
