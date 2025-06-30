// app.js - Funcionalidad principal de la aplicación

document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el usuario está logueado
    checkAuthStatus();
    
    // Cargar recetas destacadas al inicio
    cargarRecetasDestacadas();
    
    // Enlazar eventos de búsqueda
    const buscarBtn = document.querySelector('button[onclick="buscarRecetas()"]');
    if (buscarBtn) {
        buscarBtn.addEventListener('click', buscarRecetas);
    }
    
    // Búsqueda al presionar Enter
    const buscarNombre = document.getElementById('buscarNombre');
    const buscarIngrediente = document.getElementById('buscarIngrediente');
    
    if (buscarNombre) {
        buscarNombre.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') buscarRecetas();
        });
    }
    
    if (buscarIngrediente) {
        buscarIngrediente.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') buscarRecetas();
        });
    }
});

// Buscar recetas
async function buscarRecetas() {
    const nombre = document.getElementById('buscarNombre')?.value.trim() || '';
    const ingrediente = document.getElementById('buscarIngrediente')?.value.trim() || '';
    
    if (!nombre && !ingrediente) {
        Swal.fire('Aviso', 'Ingresa un nombre de receta o ingrediente para buscar', 'info');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        if (nombre) params.append('nombre', nombre);
        if (ingrediente) params.append('ingrediente', ingrediente);
        
        const response = await fetch(`php/buscar-recetas.php?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
            mostrarResultadosBusqueda(data.recetas);
        } else {
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        console.error('Error al buscar recetas:', error);
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
    }
}

// Mostrar resultados de búsqueda
function mostrarResultadosBusqueda(recetas) {
    const container = document.getElementById('resultadosBusqueda');
    if (!container) return;
    
    if (recetas.length === 0) {
        container.innerHTML = `
            <div class="col-12 sin-contenido">
                <i class="fas fa-search"></i>
                <h4>No se encontraron recetas</h4>
                <p>Intenta con otros términos de búsqueda</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recetas.map((receta, index) => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card receta-card h-100" style="animation-delay: ${index * 0.1}s;">
                ${receta.imagen ? 
                    `<div class="receta-imagen">
                        <img src="${receta.imagen}" class="card-img-top" alt="${receta.titulo}" style="height: 200px; object-fit: cover;">
                    </div>` :
                    `<div class="card-img-top bg-light d-flex align-items-center justify-content-center receta-imagen" style="height: 200px;">
                        <i class="fas fa-utensils fa-3x text-muted"></i>
                    </div>`
                }
                <div class="card-body">
                    <h5 class="card-title">${receta.titulo}</h5>
                    <p class="card-text text-muted">${receta.descripcion || ''}</p>
                    
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge badge-elegante" style="background-color: ${receta.categoria?.color || '#007bff'}; color: white;">
                            ${receta.categoria?.nombre || 'Sin categoría'}
                        </span>
                        <small class="text-muted">
                            <i class="fas fa-clock"></i> ${receta.tiempo_preparacion || 'N/A'} min
                        </small>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge badge-elegante bg-secondary receta-dificultad">${receta.dificultad}</span>
                        <span class="text-muted">
                            <i class="fas fa-users"></i> ${receta.porciones} porciones
                        </span>
                    </div>
                    
                    <div class="receta-creador">
                        <small class="text-muted">
                            <i class="fas fa-user"></i> Creado por: ${receta.usuario?.nombre || 'Usuario'}
                        </small>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <div class="d-flex justify-content-between align-items-center">
                        <button class="btn btn-primary btn-sm btn-elegante" onclick="verReceta(${receta.id})" data-tooltip="Ver receta" class="tooltip-elegante">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        <button class="btn btn-outline-danger btn-sm btn-elegante favorito-heart" onclick="toggleFavorito(${receta.id})" id="favorito-${receta.id}" data-tooltip="Agregar a favoritos" class="tooltip-elegante">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Verificar estado de favoritos para cada receta
    recetas.forEach(receta => {
        verificarYActualizarFavorito(receta.id);
    });
}

// Cargar recetas destacadas
async function cargarRecetasDestacadas() {
    try {
        const response = await fetch('php/buscar-recetas.php');
        const data = await response.json();
        
        if (data.success) {
            mostrarRecetasDestacadas(data.recetas);
        }
    } catch (error) {
        console.error('Error al cargar recetas destacadas:', error);
    }
}

// Mostrar recetas destacadas
function mostrarRecetasDestacadas(recetas) {
    const container = document.getElementById('recetasDestacadas');
    if (!container) return;
    
    if (recetas.length === 0) {
        container.innerHTML = `
            <div class="col-12 sin-contenido">
                <i class="fas fa-utensils"></i>
                <h4>No hay recetas disponibles</h4>
                <p>¡Sé el primero en crear una receta!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recetas.map((receta, index) => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card receta-card h-100" style="animation-delay: ${index * 0.1}s;">
                ${receta.imagen ? 
                    `<div class="receta-imagen">
                        <img src="${receta.imagen}" class="card-img-top" alt="${receta.titulo}" style="height: 200px; object-fit: cover;">
                    </div>` :
                    `<div class="card-img-top bg-light d-flex align-items-center justify-content-center receta-imagen" style="height: 200px;">
                        <i class="fas fa-utensils fa-3x text-muted"></i>
                    </div>`
                }
                <div class="card-body">
                    <h5 class="card-title">${receta.titulo}</h5>
                    <p class="card-text text-muted">${receta.descripcion || ''}</p>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge badge-elegante" style="background-color: ${receta.categoria?.color || '#007bff'}; color: white;">
                            ${receta.categoria?.nombre || 'Sin categoría'}
                        </span>
                        <small class="text-muted">
                            <i class="fas fa-clock"></i> ${receta.tiempo_preparacion || 'N/A'} min
                        </small>
                    </div>
                    <div class="receta-creador">
                        <small class="text-muted">
                            <i class="fas fa-user"></i> Creado por: ${receta.usuario?.nombre || 'Usuario'}
                        </small>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-primary btn-sm btn-elegante w-100" onclick="verReceta(${receta.id})" data-tooltip="Ver receta" class="tooltip-elegante">
                        <i class="fas fa-eye"></i> Ver Receta
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Limpiar búsqueda
function limpiarBusqueda() {
    const buscarNombre = document.getElementById('buscarNombre');
    const buscarIngrediente = document.getElementById('buscarIngrediente');
    const resultadosBusqueda = document.getElementById('resultadosBusqueda');
    
    if (buscarNombre) buscarNombre.value = '';
    if (buscarIngrediente) buscarIngrediente.value = '';
    if (resultadosBusqueda) resultadosBusqueda.innerHTML = '';
}

// Ver detalles de una receta
function verReceta(id) {
    window.location.href = `ver-receta.html?id=${id}`;
}

// Verificar y actualizar estado de favorito
async function verificarYActualizarFavorito(recetaId) {
    if (!isAuthenticated()) return;
    
    try {
        const response = await fetch(`php/favoritos.php?action=verificar&receta_id=${recetaId}`);
        const data = await response.json();
        
        if (data.success) {
            const boton = document.getElementById(`favorito-${recetaId}`);
            if (boton) {
                if (data.es_favorito) {
                    boton.classList.remove('btn-outline-danger');
                    boton.classList.add('btn-danger');
                } else {
                    boton.classList.remove('btn-danger');
                    boton.classList.add('btn-outline-danger');
                }
            }
        }
    } catch (error) {
        console.error('Error al verificar favorito:', error);
    }
}

// Toggle favorito (función global)
async function toggleFavorito(recetaId) {
    if (!isAuthenticated()) {
        Swal.fire({
            title: 'Inicia sesión',
            text: 'Necesitas iniciar sesión para agregar recetas a favoritos',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Iniciar Sesión',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = 'login.html';
            }
        });
        return;
    }
    
    try {
        const response = await fetch(`php/favoritos.php?action=verificar&receta_id=${recetaId}`);
        const data = await response.json();
        
        if (data.success) {
            if (data.es_favorito) {
                await quitarFavorito(recetaId);
            } else {
                await agregarFavorito(recetaId);
            }
        } else {
            if (data.message === 'Usuario no autenticado') {
                Swal.fire('Error', 'Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
                return;
            }
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        console.error('Error al verificar favorito:', error);
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
    }
}

// Agregar a favoritos
async function agregarFavorito(recetaId) {
    try {
        const formData = new FormData();
        formData.append('receta_id', recetaId);
        
        const response = await fetch('php/favoritos.php?action=add', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            const boton = document.getElementById(`favorito-${recetaId}`);
            if (boton) {
                boton.classList.remove('btn-outline-danger');
                boton.classList.add('btn-danger');
            }
            Swal.fire('Éxito', 'Receta agregada a favoritos', 'success');
        } else {
            if (data.message === 'Usuario no autenticado') {
                Swal.fire('Error', 'Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
                return;
            }
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        console.error('Error al agregar favorito:', error);
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
    }
}

// Quitar de favoritos
async function quitarFavorito(recetaId) {
    try {
        const formData = new FormData();
        formData.append('receta_id', recetaId);
        
        const response = await fetch('php/favoritos.php?action=remove', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            const boton = document.getElementById(`favorito-${recetaId}`);
            if (boton) {
                boton.classList.remove('btn-danger');
                boton.classList.add('btn-outline-danger');
            }
            Swal.fire('Éxito', 'Receta removida de favoritos', 'success');
        } else {
            if (data.message === 'Usuario no autenticado') {
                Swal.fire('Error', 'Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
                return;
            }
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        console.error('Error al quitar favorito:', error);
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
    }
}

// Función para verificar autenticación antes de crear receta
function verificarAutenticacionParaCrear() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    
    if (!usuario) {
        Swal.fire({
            title: 'Inicia sesión',
            text: 'Debes iniciar sesión para crear una receta',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Iniciar Sesión',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#007bff',
            cancelButtonColor: '#6c757d'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = 'login.html';
            }
        });
        return false;
    }
    
    return true;
}

// Función global para determinar la unidad automáticamente basada en el ingrediente
function determinarUnidadAutomatica(ingredienteId, ingredienteNombre) {
    const nombre = ingredienteNombre.toLowerCase();
    
    // Mapeo de ingredientes a unidades
    const mapeoUnidades = {
        'ajo': 'diente',
        'cebolla': 'unidad',
        'tomate': 'unidad',
        'papa': 'unidad',
        'zanahoria': 'unidad',
        'pimiento': 'unidad',
        'chile': 'unidad',
        'ají': 'unidad',
        'leche': 'ml',
        'queso': 'g',
        'mantequilla': 'g',
        'crema': 'ml',
        'yogur': 'ml',
        'pollo': 'g',
        'carne': 'g',
        'cerdo': 'g',
        'pescado': 'g',
        'jamón': 'g',
        'tocino': 'g',
        'arroz': 'g',
        'pasta': 'g',
        'harina': 'g',
        'azúcar': 'g',
        'sal': 'cucharadita',
        'pimienta': 'pizca',
        'aceite': 'cucharada',
        'oliva': 'cucharada',
        'huevo': 'unidad',
        'huevos': 'unidad',
        'manzana': 'unidad',
        'plátano': 'unidad',
        'naranja': 'unidad',
        'limón': 'unidad',
        'lima': 'unidad',
        'lechuga': 'unidad',
        'espinaca': 'g',
        'brócoli': 'g',
        'coliflor': 'g',
        'pepino': 'unidad',
        'calabaza': 'g',
        'berenjena': 'unidad',
        'nuez': 'g',
        'almendra': 'g',
        'maní': 'g',
        'pistacho': 'g',
        'vinagre': 'cucharada',
        'salsa': 'cucharada',
        'mostaza': 'cucharadita',
        'mayonesa': 'cucharada',
        'ketchup': 'cucharada',
        'agua': 'ml',
        'vino': 'ml',
        'cerveza': 'ml',
        'jugo': 'ml',
        'caldo': 'ml',
        'sopa': 'ml',
        'puré': 'g',
        'miel': 'cucharada',
        'chocolate': 'g',
        'cacao': 'cucharada'
    };
    
    // Coincidencia exacta
    if (mapeoUnidades[nombre]) {
        return mapeoUnidades[nombre];
    }
    // Coincidencia parcial para 'caldo'
    if (nombre.includes('caldo')) {
        return 'ml';
    }
    // Coincidencia parcial para otros ingredientes
    for (const [ingredienteKey, unidad] of Object.entries(mapeoUnidades)) {
        if (nombre.includes(ingredienteKey)) {
            return unidad;
        }
    }
    return 'g'; // Unidad por defecto
}

// Función global para formatear ingrediente con unidad automática
function formatearIngrediente(ingrediente) {
    const cantidad = ingrediente.cantidad;
    let unidad = ingrediente.unidad;
    const nombre = ingrediente.nombre;
    // Si la unidad es vacía o '0', usar la unidad automática
    if (!unidad || unidad.trim() === '' || unidad === '0') {
        unidad = determinarUnidadAutomatica(ingrediente.ingrediente_id, nombre);
    }
    return `${cantidad} ${unidad} de ${nombre}`;
} 