// Menú Hamburguesa - SIMPLIFICADO
const hamburgerMenu = document.querySelector('.hamburger-menu');
const mobileMenu = document.querySelector('.mobile-menu');
const menuOverlay = document.createElement('div');
const menuLinks = document.querySelectorAll('.mobile-nav-links a:not(.dropdown-toggle)');
const dropdownLinks = document.querySelectorAll('.dropdown-link');

// Crear overlay
menuOverlay.className = 'menu-overlay';
document.body.appendChild(menuOverlay);

// Función para alternar el menú
function toggleMobileMenu() {
    const isActive = mobileMenu.classList.contains('active');
    
    if (isActive) {
        // Cerrar menú
        mobileMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        hamburgerMenu.classList.remove('active');
        document.body.style.overflow = 'auto';
    } else {
        // Abrir menú
        mobileMenu.classList.add('active');
        menuOverlay.classList.add('active');
        hamburgerMenu.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Abrir/cerrar menú con el ícono hamburguesa
hamburgerMenu.addEventListener('click', toggleMobileMenu);

// Cerrar menú con overlay
menuOverlay.addEventListener('click', toggleMobileMenu);

// Cerrar menú al hacer clic en un enlace
menuLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        hamburgerMenu.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
});

// Cerrar menú al hacer clic en enlaces del dropdown
dropdownLinks.forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        hamburgerMenu.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
});

// Dropdown functionality
const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const dropdown = toggle.parentElement;
        dropdown.classList.toggle('active');
        
        // Cerrar otros dropdowns
        dropdownToggles.forEach(otherToggle => {
            if (otherToggle !== toggle) {
                otherToggle.parentElement.classList.remove('active');
            }
        });
    });
});

// Cerrar dropdowns al hacer clic fuera
document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        if (this.getAttribute('href') !== '#') {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Efecto de aparición al hacer scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Aplicar a las secciones
document.querySelectorAll('.categories, .men-section, .women-section, .new-arrivals').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// Header con efecto al hacer scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(10, 10, 10, 0.98)';
    } else {
        header.style.background = 'rgba(10, 10, 10, 0.95)';
    }
});

// Simulación de agregar al carrito
document.querySelectorAll('.product-btn').forEach(button => {
    button.addEventListener('click', async function() {
        
        // --- NECESITAS EL ID DE LA VARIANTE ---
        // Debes agregar el ID de la variante al botón en tu HTML
        // Por ejemplo: <button class="product-btn" data-variant-id="672fbc125e9d...">
        const variantId = this.dataset.variantId; 
        
        // --- NECESITAS EL TOKEN ---
        // Debes obtener el token que guardaste en localStorage al hacer login
        const token = localStorage.getItem('jwt_token'); 

        if (!token) {
            alert("Debes iniciar sesión para agregar productos al carrito.");
            window.location.href = 'html/login.html'; // Redirige a login
            return;
        }

        if (!variantId) {
            console.error("El producto no tiene un ID de variante (data-variant-id).");
            return;
        }

        this.textContent = 'AGREGANDO...';
        this.disabled = true;

        try {
            const response = await fetch("http://localhost:8080/cart/items", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    variantId: variantId,
                    quantity: 1 // Por defecto se agrega 1
                })
            });

            if (response.ok) {
                this.textContent = 'AGREGADO ✓';
                this.style.background = '#4CAF50'; // Éxito
            } else {
                throw new Error('Error al agregar');
            }

        } catch (error) {
            console.error(error);
            this.textContent = 'ERROR';
            this.style.background = '#e74c3c'; // Error
        } finally {
            setTimeout(() => {
                this.textContent = 'AGREGAR AL CARRITO';
                this.style.background = '#fff';
                this.style.color = '#000';
                this.disabled = false;
            }, 2000);
        }
    });
});

// Cerrar menú con tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        mobileMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        hamburgerMenu.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});