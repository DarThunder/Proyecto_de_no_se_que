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
});