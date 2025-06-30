// auth.js

document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    // Enlazar formularios si existen
    const loginForm = document.getElementById('loginForm');
    const registroForm = document.getElementById('registroForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await loginUsuario();
        });
    }

    if (registroForm) {
        registroForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await crearCuenta();
        });
    }
});

// Verificar estado de autenticación
function checkAuthStatus() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    console.log('checkAuthStatus usuario:', usuario);
    const loginSection = document.getElementById('loginSection');
    const userSection5 = document.getElementById('userSection5'); // Mis Recetas
    const logoutSection = document.getElementById('logoutSection');
    const userName = document.getElementById('userName');
    const botonCrearReceta = document.getElementById('botonCrearReceta');
    const seccionNoAutenticado = document.getElementById('seccionNoAutenticado');
    const botonIniciarSesion = document.getElementById('botonIniciarSesion');
    
    if (usuario) {
        // Usuario autenticado
        if (loginSection) loginSection.classList.add('d-none');
        if (userSection5) userSection5.classList.remove('d-none'); // Mis Recetas
        if (logoutSection) logoutSection.classList.remove('d-none');
        if (userName) userName.textContent = usuario.nombre;
        if (botonCrearReceta) botonCrearReceta.classList.remove('d-none');
        if (seccionNoAutenticado) seccionNoAutenticado.classList.add('d-none');
        if (botonIniciarSesion) botonIniciarSesion.classList.add('d-none');
    } else {
        // Usuario no autenticado
        if (loginSection) loginSection.classList.remove('d-none');
        if (userSection5) userSection5.classList.add('d-none'); // Mis Recetas
        if (logoutSection) logoutSection.classList.add('d-none');
        if (userName) userName.textContent = '';
        if (botonCrearReceta) botonCrearReceta.classList.add('d-none');
        if (seccionNoAutenticado) seccionNoAutenticado.classList.remove('d-none');
        if (botonIniciarSesion) botonIniciarSesion.classList.remove('d-none');
    }
}

async function loginUsuario() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        Swal.fire('Error', 'Por favor, completa todos los campos.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    try {
        console.log('Intentando login con:', email);
        const response = await fetch('php/login.php', {
            method: 'POST',
            body: formData
        });
        
        console.log('Respuesta del servidor:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        if (data.success) {
            Swal.fire({
                title: 'ÉXITO',
                text: 'Bienvenido ' + data.user.nombre,
                icon: 'success',
                showConfirmButton: false,
                timer: 1000
            });
            localStorage.setItem('usuario', JSON.stringify(data.user));
            checkAuthStatus();
            setTimeout(function() {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        console.error('Error en login:', error);
        Swal.fire('Error', 'Error al conectar con el servidor: ' + error.message, 'error');
    }
}

async function crearCuenta() {
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('emailRegistro').value.trim();
    const password = document.getElementById('passwordRegistro').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!nombre || !email || !password || !confirmPassword) {
        Swal.fire('Error', 'Por favor, completa todos los campos.', 'error');
        return;
    }
    if (password !== confirmPassword) {
        Swal.fire('Error', 'Las contraseñas no coinciden.', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('email', email);
    formData.append('password', password);

    try {
        console.log('Intentando registro con:', email);
        const response = await fetch('php/registro.php', {
            method: 'POST',
            body: formData
        });
        
        console.log('Respuesta del servidor:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        if (data.success) {
            Swal.fire('Éxito', 'Usuario registrado correctamente. Ahora puedes iniciar sesión.', 'success');
            document.getElementById('registroForm').reset();
            mostrarLogin();
        } else {
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        console.error('Error en registro:', error);
        Swal.fire('Error', 'Error al conectar con el servidor: ' + error.message, 'error');
    }
}

// Mostrar/ocultar formularios en login.html
function mostrarRegistro() {
    document.getElementById('loginForm').parentElement.parentElement.classList.add('d-none');
    document.getElementById('registroCard').classList.remove('d-none');
}
function mostrarLogin() {
    document.getElementById('registroCard').classList.add('d-none');
    document.getElementById('loginForm').parentElement.parentElement.classList.remove('d-none');
}

// Cerrar sesión global
async function logout() {
    Swal.fire({
        title: '¿Cerrar sesión?',
        text: '¿Estás seguro de que quieres cerrar sesión?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                // Cerrar sesión en el backend
                const response = await fetch('php/logout.php');
                const data = await response.json();
                
                // Limpiar localStorage
                localStorage.removeItem('usuario');
                
                Swal.fire({
                    title: 'Sesión cerrada',
                    text: 'Has cerrado sesión correctamente',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    // Redirigir a la página principal
                    window.location.href = 'index.html';
                });
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                // Aún así limpiar localStorage y redirigir
                localStorage.removeItem('usuario');
                window.location.href = 'index.html';
            }
        }
    });
}

// Verificar si el usuario está autenticado (para páginas protegidas)
function isAuthenticated() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    return usuario !== null;
}

function requireAuth() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    if (!usuario) {
        Swal.fire('Error', 'Debes iniciar sesión para acceder a esta página', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return false;
    }
    return true;
} 