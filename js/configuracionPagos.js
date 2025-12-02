/**
 * @file js/configuracionPagos.js
 * @description Administra la configuración de las pasarelas de pago en el panel de administración.
 * Permite listar los proveedores disponibles (PayPal, Stripe), activar/desactivar servicios,
 * y guardar las credenciales (API Keys, Client Secrets) y el modo de operación (Sandbox/Live).
 */

/**
 * Inicializa el gestor de configuración de pagos cuando el DOM está listo.
 * Define la URL base de la API y carga las configuraciones iniciales.
 * @listens document#DOMContentLoaded
 */
document.addEventListener("DOMContentLoaded", () => {
  /**
   * URL base del endpoint de configuración de pagos en el backend.
   * @const {string}
   */
  const API_URL = "http://localhost:8080/payment-config";

  /**
   * Contenedor del DOM donde se renderizarán las tarjetas de configuración.
   * @type {HTMLElement}
   */
  const container = document.getElementById("payment-configs");

  // Cargar configuraciones al iniciar
  loadConfigs();

  /**
   * Obtiene las configuraciones de pago desde el servidor y renderiza la interfaz.
   * Si no existe configuración para un proveedor conocido, genera una estructura por defecto.
   * @async
   */
  async function loadConfigs() {
    try {
      const res = await fetch(API_URL, { credentials: "include" });
      const configs = await res.json();

      container.innerHTML = "";

      // Lista de proveedores soportados por el sistema
      const providers = ["PAYPAL", "STRIPE"];

      providers.forEach((providerName) => {
        // Busca la config existente o crea una vacía por defecto
        const config = configs.find((c) => c.providerName === providerName) || {
          providerName,
          isActive: false,
          credentials: { clientId: "", clientSecret: "", mode: "sandbox" },
        };

        renderCard(config);
      });
    } catch (error) {
      container.innerHTML = "<p>Error al cargar configuraciones.</p>";
      console.error(error);
    }
  }

  /**
   * Genera el HTML de la tarjeta de configuración para un proveedor específico.
   * Crea el formulario dinámicamente con los valores actuales.
   * @param {Object} config - Objeto de configuración del proveedor.
   * @param {string} config.providerName - Nombre del proveedor (ej. 'PAYPAL').
   * @param {boolean} config.isActive - Estado de activación.
   * @param {Object} config.credentials - Credenciales y modo (clientId, clientSecret, mode).
   */
  function renderCard(config) {
    const div = document.createElement("div");
    div.className = "config-card";

    const isLive = config.credentials?.mode === "live";

    // Inyección de HTML con el formulario de configuración
    div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3><i class="fab fa-${config.providerName.toLowerCase()}"></i> ${
      config.providerName
    }</h3>
                <span class="status-indicator ${
                  config.isActive ? "status-active" : "status-inactive"
                }"></span>
            </div>
            
            <form onsubmit="guardarConfig(event, '${config.providerName}')">
                <div class="form-group">
                    <label>Estado</label>
                    <select name="isActive" style="background: #2c3e50;">
                        <option value="true" ${
                          config.isActive ? "selected" : ""
                        }>Activado</option>
                        <option value="false" ${
                          !config.isActive ? "selected" : ""
                        }>Desactivado</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Client ID / API Key</label>
                    <input type="password" name="clientId" value="${
                      config.credentials.clientId ||
                      config.credentials.apiKey ||
                      ""
                    }" placeholder="Clave Pública">
                </div>

                <div class="form-group">
                    <label>Client Secret</label>
                    <input type="password" name="clientSecret" value="${
                      config.credentials.clientSecret || ""
                    }" placeholder="Clave Privada">
                </div>

                <div class="form-group">
                    <label>Modo</label>
                    <select name="mode" style="background: #2c3e50;">
                        <option value="sandbox" ${
                          !isLive ? "selected" : ""
                        }>Sandbox (Pruebas)</option>
                        <option value="live" ${
                          isLive ? "selected" : ""
                        }>Live (Producción)</option>
                    </select>
                </div>

                <button type="submit" class="btn btn-primary" style="width:100%">Guardar Cambios</button>
            </form>
        `;
    container.appendChild(div);
  }

  /**
   * Maneja el envío del formulario de configuración.
   * Esta función se adjunta al objeto `window` para ser accesible desde el atributo `onsubmit` del HTML inyectado.
   * Realiza una petición PUT para actualizar la configuración en el backend.
   * * @global
   * @async
   * @param {Event} e - Evento del formulario.
   * @param {string} providerName - Nombre del proveedor que se está editando.
   */
  window.guardarConfig = async (e, providerName) => {
    e.preventDefault();
    const form = e.target;

    // Construcción del objeto de datos
    const data = {
      isActive: form.isActive.value === "true",
      credentials: {
        clientId: form.clientId.value,
        clientSecret: form.clientSecret.value,
        mode: form.mode.value,
      },
    };

    // Ajuste específico para Stripe (usa 'apiKey' en lugar de 'clientId')
    if (providerName === "STRIPE") {
      data.credentials.apiKey = form.clientId.value;
      delete data.credentials.clientId;
    }

    try {
      const res = await fetch(`${API_URL}/${providerName}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (res.ok) {
        alert(`Configuración de ${providerName} guardada.`);
        loadConfigs(); // Recargar para ver cambios visuales (ej. indicador de estado)
      } else {
        const err = await res.json();
        alert("Error: " + err.message);
      }
    } catch (error) {
      alert("Error de conexión");
    }
  };
});
