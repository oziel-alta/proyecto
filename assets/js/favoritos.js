// favoritos.js - Funcionalidad de favoritos

// Función para determinar la unidad automáticamente basada en el ingrediente
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
    
    // Buscar coincidencia exacta
    if (mapeoUnidades[nombre]) {
        return mapeoUnidades[nombre];
    }
    
    // Coincidencia parcial para 'caldo'
    if (nombre.includes('caldo')) {
        return 'ml';
    }
    
    // Buscar coincidencia parcial
    for (const [ingredienteKey, unidad] of Object.entries(mapeoUnidades)) {
        if (nombre.includes(ingredienteKey)) {
            return unidad;
        }
    }
    
    return 'g'; // Unidad por defecto
}

// Función para formatear ingrediente con unidad automática
function formatearIngrediente(ingrediente) {
    const cantidad = ingrediente.cantidad;
    let unidad = ingrediente.unidad;
    const nombre = ingrediente.nombre;
    
    // Si la unidad original existe y no está vacía ni es '0', usarla
    if (!unidad || unidad.trim() === '' || unidad === '0') {
        unidad = determinarUnidadAutomatica(ingrediente.ingrediente_id, nombre);
    }
    return `${cantidad} ${unidad} de ${nombre}`;
}

document.addEventListener('DOMContentLoaded', function() {
    // Cargar favoritos si estamos en la página de favoritos
    if (window.location.pathname.includes('favoritos.html')) {
        if (isAuthenticated()) {
            cargarFavoritos();
        } else {
            mostrarFavoritosNoAutenticado();
        }
    }
});

// Mostrar mensaje cuando no está autenticado
function mostrarFavoritosNoAutenticado() {
    const container = document.getElementById('listaFavoritos');
    const noFavoritos = document.getElementById('noFavoritos');
    
    if (noFavoritos) {
        noFavoritos.classList.remove('d-none');
        noFavoritos.className = 'sin-contenido';
        noFavoritos.innerHTML = `
            <i class="fas fa-lock"></i>
            <h4>Inicia sesión para ver tus favoritos</h4>
            <p>Necesitas tener una cuenta para guardar y ver tus recetas favoritas</p>
            <div class="d-flex gap-2 justify-content-center">
                <a href="login.html" class="btn btn-primary btn-elegante">
                    <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                </a>
                <a href="index.html" class="btn btn-outline-secondary btn-elegante">
                    <i class="fas fa-search"></i> Explorar Recetas
                </a>
            </div>
        `;
    }
    
    if (container) {
        container.innerHTML = '';
    }
}

// Cargar favoritos del usuario
async function cargarFavoritos() {
    try {
        const response = await fetch('php/favoritos.php?action=list');
        const data = await response.json();
        
        if (data.success) {
            mostrarFavoritos(data.favoritos);
        } else {
            if (data.message === 'Usuario no autenticado') {
                mostrarFavoritosNoAutenticado();
                return;
            }
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        console.error('Error al cargar favoritos:', error);
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
    }
}

// Mostrar lista de favoritos
function mostrarFavoritos(favoritos) {
    const container = document.getElementById('listaFavoritos');
    const noFavoritos = document.getElementById('noFavoritos');
    
    if (!container) return;
    
    if (favoritos.length === 0) {
        if (noFavoritos) {
            noFavoritos.classList.remove('d-none');
            noFavoritos.className = 'sin-contenido';
            noFavoritos.innerHTML = `
                <i class="fas fa-heart-broken"></i>
                <h4>No tienes recetas favoritas</h4>
                <p>Explora nuestras recetas y agrega las que más te gusten a tus favoritos</p>
                <a href="index.html" class="btn btn-primary btn-elegante">
                    <i class="fas fa-search"></i> Buscar Recetas
                </a>
            `;
        }
        container.innerHTML = '';
        return;
    }
    
    if (noFavoritos) noFavoritos.classList.add('d-none');
    
    container.innerHTML = favoritos.map((receta, index) => `
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
                        <button class="btn btn-danger btn-sm btn-elegante favorito-heart" onclick="quitarFavorito(${receta.id})" data-tooltip="Quitar de favoritos" class="tooltip-elegante">
                            <i class="fas fa-heart-broken"></i> Quitar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Agregar receta a favoritos
async function agregarFavorito(recetaId) {
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
        const formData = new FormData();
        formData.append('receta_id', recetaId);
        
        const response = await fetch('php/favoritos.php?action=add', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            Swal.fire('Éxito', data.message, 'success');
            // Actualizar el botón de favorito
            actualizarBotonFavorito(recetaId, true);
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

// Quitar receta de favoritos
async function quitarFavorito(recetaId) {
    if (!isAuthenticated()) {
        Swal.fire('Error', 'Necesitas iniciar sesión para gestionar favoritos', 'error');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('receta_id', recetaId);
        
        const response = await fetch('php/favoritos.php?action=remove', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            Swal.fire('Éxito', data.message, 'success');
            
            // Si estamos en la página de favoritos, recargar la lista
            if (window.location.pathname.includes('favoritos.html')) {
                cargarFavoritos();
            }
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

// Verificar si una receta está en favoritos
async function verificarFavorito(recetaId) {
    if (!isAuthenticated()) {
        return false;
    }
    
    try {
        const response = await fetch(`php/favoritos.php?action=verificar&receta_id=${recetaId}`);
        const data = await response.json();
        
        if (data.success) {
            return data.es_favorito;
        }
    } catch (error) {
        console.error('Error al verificar favorito:', error);
    }
    
    return false;
}

// Actualizar botón de favorito
function actualizarBotonFavorito(recetaId, esFavorito) {
    const boton = document.querySelector(`button[onclick="toggleFavorito(${recetaId})"]`);
    if (boton) {
        if (esFavorito) {
            boton.classList.remove('btn-outline-danger');
            boton.classList.add('btn-danger');
        } else {
            boton.classList.remove('btn-danger');
            boton.classList.add('btn-outline-danger');
        }
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
        console.error('Error al toggle favorito:', error);
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
    }
}

// Ver detalles de una receta en modal
async function verReceta(id) {
    try {
        const response = await fetch(`php/recetas.php?action=obtener&id=${id}`);
        const data = await response.json();
        
        if (data.success) {
            mostrarRecetaEnModal(data.receta);
        } else {
            Swal.fire('Error', data.message || 'Error al cargar la receta', 'error');
        }
    } catch (error) {
        console.error('Error al cargar receta:', error);
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
    }
}

// Mostrar receta en modal
function mostrarRecetaEnModal(receta) {
    const modal = new bootstrap.Modal(document.getElementById('recetaModal'));
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const quitarFavoritoBtn = document.getElementById('quitarFavorito');
    
    // Configurar título
    modalTitle.textContent = receta.titulo;
    
    // Configurar contenido
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6><i class="fas fa-info-circle"></i> Información</h6>
                <ul class="list-unstyled">
                    <li><strong>Tiempo:</strong> ${receta.tiempo_preparacion || 'N/A'} minutos</li>
                    <li><strong>Dificultad:</strong> ${receta.dificultad}</li>
                    <li><strong>Porciones:</strong> ${receta.porciones}</li>
                    <li><strong>Categoría:</strong> ${receta.categoria?.nombre || 'Sin categoría'}</li>
                    <li><strong>Creado por:</strong> ${receta.usuario?.nombre || 'Usuario'}</li>
                </ul>
                
                <h6><i class="fas fa-list"></i> Ingredientes</h6>
                <ul class="list-unstyled">
                    ${receta.ingredientes?.map(ing => 
                        `<li><i class="fas fa-check text-success"></i> ${formatearIngrediente(ing)}</li>`
                    ).join('') || '<li>No hay ingredientes registrados</li>'}
                </ul>
            </div>
            <div class="col-md-6">
                <h6><i class="fas fa-utensils"></i> Instrucciones</h6>
                <div class="instrucciones-text">
                    ${receta.instrucciones ? receta.instrucciones.replace(/\n/g, '<br>') : 'No hay instrucciones disponibles'}
                </div>
            </div>
        </div>
    `;
    
    // Configurar botón de quitar favorito
    if (quitarFavoritoBtn) {
        quitarFavoritoBtn.onclick = () => {
            quitarFavorito(receta.id);
            modal.hide();
        };
    }
    
    // Mostrar modal
    modal.show();
} 
