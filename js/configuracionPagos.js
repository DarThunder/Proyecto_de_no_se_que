document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "http://localhost:8080/payment-config";
  const container = document.getElementById("payment-configs");

  loadConfigs();

  async function loadConfigs() {
    try {
      const res = await fetch(API_URL, { credentials: "include" });
      const configs = await res.json();

      container.innerHTML = "";

      const providers = ["PAYPAL", "STRIPE"];

      providers.forEach((providerName) => {
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

  function renderCard(config) {
    const div = document.createElement("div");
    div.className = "config-card";

    const isLive = config.credentials?.mode === "live";

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

  window.guardarConfig = async (e, providerName) => {
    e.preventDefault();
    const form = e.target;

    const data = {
      isActive: form.isActive.value === "true",
      credentials: {
        clientId: form.clientId.value,
        clientSecret: form.clientSecret.value,
        mode: form.mode.value,
      },
    };

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
        loadConfigs();
      } else {
        const err = await res.json();
        alert("Error: " + err.message);
      }
    } catch (error) {
      alert("Error de conexión");
    }
  };
});
