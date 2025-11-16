document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar la autenticación y permisos
    try {
        const meResponse = await fetch("http://localhost:8080/users/me", {
            method: "GET",
            credentials: "include", // Envía la cookie de sesión
        });

        if (!meResponse.ok) {
            // Si la sesión no es válida (ej. 401 Unauthorized)
            throw new Error("No autorizado. Redirigiendo al login.");
        }

        const userInfo = await meResponse.json();

        // Verificamos el rol (Admin=0, Gerente=1)
        if (userInfo.role && userInfo.role.permission_ring <= 1) {
            // El usuario es Admin o Gerente, cargamos sus datos
            document.getElementById('admin-username').textContent = userInfo.username || 'Admin';
            
            // --- ¡NUEVO! ---
            // Una vez autenticado, carga las estadísticas del dashboard
            await loadDashboardStats();

        } else {
            // No es Admin ni Gerente
            throw new Error("Acceso denegado. Redirigiendo al login.");
        }

    } catch (error) {
        console.error(error.message);
        // Si falla la autenticación, lo sacamos al login
        alert("Acceso denegado. Debes iniciar sesión como Gerente o Administrador.");
        window.location.href = 'login.html';
    }

    // 2. Lógica del botón de Cerrar Sesión
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch("http://localhost:8080/auth/logout", {
                    method: "POST",
                    credentials: "include",
                });
            } catch (err) {
                console.error("Error al cerrar sesión (quizás el servidor ya te desconectó)", err);
            } finally {
                // Siempre redirigir al login
                alert("Sesión cerrada.");
                window.location.href = 'login.html';
            }
        });
    }

    // --- Cargar Términos y Condiciones del Usuario ---
    
    // 1. MOSTRAR TERMINOS Y CONDICIONES
    const cargarTerminosUsuario = async () => {
        // Seleccionamos el 'div' contenedor que pusimos en el HTML
        const container = document.getElementById('terminos-content-usuario');
        // Si el contenedor no existe en esta página, no hacemos nada.
        if (!container) return; 

        try {
            // Hacemos una petición GET a la ruta pública (la misma que usa el admin para cargar)
            const res = await fetch('http://localhost:8080/content/terms'); 
            const data = await res.json();
            
            if (res.ok) {
                // ¡IMPORTANTE!
                // Usamos '.innerHTML' para que el navegador interprete las etiquetas HTML
                // (como <p>, <strong>, etc.) que el admin guardó en la BD.
                container.innerHTML = data.htmlContent; 
            } else {
                // Si la API falla, mostramos un error
                throw new Error(data.message);
            }
        } catch (error) {
            // Si el 'fetch' falla (ej. servidor caído), mostramos un error
            container.innerHTML = '<p>No se pudieron cargar los términos y condiciones en este momento.</p>';
            console.error('Error fetching T&C:', error);
        }
    };

    // 2. Carga inicial
    // Llamamos a la función en cuanto la página carga
    cargarTerminosUsuario();
});


// --- ========= FUNCIÓN NUEVA PARA HU 27 ========= ---

/**
 * Carga las estadísticas del dashboard (HU 27)
 */
async function loadDashboardStats() {
    try {
        const response = await fetch("http://localhost:8080/reports/sales-by-channel", {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('No se pudieron cargar las estadísticas');
        }

        const stats = await response.json(); // { online: {...}, pos: {...} }

        // Función para formatear a moneda
        const formatCurrency = (amount) => new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount || 0);

        // Actualizar el HTML
        document.getElementById('stats-online-revenue').textContent = formatCurrency(stats.online.revenue);
        document.getElementById('stats-online-sales').textContent = stats.online.salesCount;
        document.getElementById('stats-pos-revenue').textContent = formatCurrency(stats.pos.revenue);
        document.getElementById('stats-pos-sales').textContent = stats.pos.salesCount;

    } catch (error) {
        console.error(error.message);
        // Si falla, los stats se quedan en 0, pero la app no se rompe.
    }
}