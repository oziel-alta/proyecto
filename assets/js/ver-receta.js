// ver-receta.js - Funcionalidad para ver detalles de una receta

let recetaActual = null;
let esFavorito = false;

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
    // Si la unidad es vacía o '0', usar la unidad automática
    if (!unidad || unidad.trim() === '' || unidad === '0') {
        unidad = determinarUnidadAutomatica(ingrediente.ingrediente_id, nombre);
    }
    return `${cantidad} ${unidad} de ${nombre}`;
}

document.addEventListener('DOMContentLoaded', function() {
    // Obtener el ID de la receta de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const recetaId = urlParams.get('id');
    
    if (!recetaId) {
        mostrarError('No se especificó una receta para ver.');
        return;
    }
    
    // Cargar la receta
    cargarReceta(recetaId);
});

// Cargar datos de la receta
async function cargarReceta(recetaId) {
    try {
        const response = await fetch(`php/recetas.php?action=obtener&id=${recetaId}`);
        const data = await response.json();
        
        if (data.success) {
            recetaActual = data.receta;
            mostrarReceta(recetaActual);
            
            // Verificar si es favorito (solo si el usuario está autenticado)
            if (isAuthenticated()) {
                verificarFavorito(recetaId);
            }
        } else {
            mostrarError(data.message || 'No se pudo cargar la receta.');
        }
    } catch (error) {
        console.error('Error al cargar receta:', error);
        mostrarError('Error al conectar con el servidor.');
    }
}

// Mostrar la receta en la interfaz
function mostrarReceta(receta) {
    // Ocultar loading y mostrar contenido
    document.getElementById('loading').classList.add('d-none');
    document.getElementById('recetaContent').classList.remove('d-none');
    
    // Actualizar título de la página
    document.title = `${receta.titulo} - ¿Qué Cocino Hoy?`;
    
    // Información básica
    document.getElementById('breadcrumbTitle').textContent = receta.titulo;
    document.getElementById('recetaTitulo').textContent = receta.titulo;
    document.getElementById('recetaDescripcion').textContent = receta.descripcion || 'Sin descripción';
    document.getElementById('recetaTiempo').textContent = receta.tiempo_preparacion || 'N/A';
    document.getElementById('recetaDificultad').textContent = receta.dificultad || 'N/A';
    document.getElementById('recetaPorciones').textContent = receta.porciones || 'N/A';
    document.getElementById('recetaCategoria').textContent = receta.categoria?.nombre || 'Sin categoría';
    
    // Información del creador
    document.getElementById('creadorNombre').textContent = receta.usuario?.nombre || 'Usuario';
    document.getElementById('fechaCreacion').textContent = new Date(receta.fecha_creacion).toLocaleDateString();
    
    // Mostrar ingredientes
    mostrarIngredientes(receta.ingredientes);
    
    // Mostrar instrucciones
    mostrarInstrucciones(receta.instrucciones);
    
    // Mostrar/ocultar acciones según si el usuario es el creador
    if (isAuthenticated() && receta.usuario?.id === getCurrentUserId()) {
        document.getElementById('accionesCard').classList.remove('d-none');
    } else {
        document.getElementById('accionesCard').classList.add('d-none');
    }
}

// Mostrar lista de ingredientes
function mostrarIngredientes(ingredientes) {
    const container = document.getElementById('ingredientesLista');
    
    if (!ingredientes || ingredientes.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay ingredientes especificados.</p>';
        return;
    }
    
    const ingredientesHTML = ingredientes.map(ingrediente => `
        <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
            <div class="d-flex align-items-center">
                <i class="fas fa-circle text-primary me-2" style="font-size: 0.5rem;"></i>
                <span class="fw-medium">${ingrediente.nombre}</span>
            </div>
            <span class="text-muted">
                ${formatearIngrediente(ingrediente)}
            </span>
        </div>
    `).join('');
    
    container.innerHTML = ingredientesHTML;
}

// Mostrar instrucciones
function mostrarInstrucciones(instrucciones) {
    const container = document.getElementById('instruccionesLista');
    
    if (!instrucciones) {
        container.innerHTML = '<p class="text-muted">No hay instrucciones especificadas.</p>';
        return;
    }
    
    // Dividir las instrucciones por líneas y numerarlas
    const pasos = instrucciones.split('\n').filter(paso => paso.trim() !== '');
    
    if (pasos.length === 0) {
        container.innerHTML = '<p class="text-muted">No hay instrucciones especificadas.</p>';
        return;
    }
    
    const instruccionesHTML = pasos.map((paso, index) => `
        <div class="d-flex mb-3">
            <div class="flex-shrink-0">
                <span class="badge bg-primary rounded-circle me-3" style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
                    ${index + 1}
                </span>
            </div>
            <div class="flex-grow-1">
                <p class="mb-0">${paso.trim()}</p>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = instruccionesHTML;
}

// Verificar si la receta es favorita del usuario
async function verificarFavorito(recetaId) {
    try {
        const response = await fetch(`php/favoritos.php?action=verificar&receta_id=${recetaId}`);
        const data = await response.json();
        
        if (data.success) {
            esFavorito = data.es_favorito;
            actualizarBotonFavorito();
        }
    } catch (error) {
        console.error('Error al verificar favorito:', error);
    }
}

// Actualizar botón de favorito
function actualizarBotonFavorito() {
    const icon = document.getElementById('iconFavorito');
    const btn = document.getElementById('btnFavorito');
    
    if (esFavorito) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        btn.classList.remove('btn-outline-primary');
        btn.classList.add('btn-primary');
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
    }
}

// Toggle favorito
async function toggleFavorito() {
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
    
    if (!recetaActual) return;
    
    try {
        const action = esFavorito ? 'remove' : 'add';
        const formData = new FormData();
        formData.append('receta_id', recetaActual.id);
        
        const response = await fetch(`php/favoritos.php?action=${action}`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            esFavorito = !esFavorito;
            actualizarBotonFavorito();
            
            const mensaje = esFavorito ? 'Receta agregada a favoritos' : 'Receta removida de favoritos';
            Swal.fire('Éxito', mensaje, 'success');
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

// Editar receta
function editarReceta() {
    if (!recetaActual) return;
    
    Swal.fire('Próximamente', 'La funcionalidad de edición estará disponible pronto', 'info');
}

// Confirmar eliminación
function confirmarEliminar() {
    if (!recetaActual) return;
    
    const modal = new bootstrap.Modal(document.getElementById('confirmarEliminarModal'));
    modal.show();
}

// Eliminar receta
async function eliminarReceta() {
    if (!recetaActual) return;
    
    try {
        const formData = new FormData();
        formData.append('receta_id', recetaActual.id);
        
        const response = await fetch('php/recetas.php?action=eliminar', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            Swal.fire('Éxito', data.message, 'success').then(() => {
                window.location.href = 'mis-recetas.html';
            });
        } else {
            if (data.message === 'Usuario no autenticado') {
                Swal.fire('Error', 'Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
                return;
            }
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        console.error('Error al eliminar receta:', error);
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
    }
}

// Mostrar error
function mostrarError(mensaje) {
    document.getElementById('loading').classList.add('d-none');
    document.getElementById('error').classList.remove('d-none');
    document.getElementById('errorMessage').textContent = mensaje;
}

// Obtener ID del usuario actual
function getCurrentUserId() {
    // Esta función debería obtener el ID del usuario desde la sesión
    // Por ahora retornamos null, se implementará cuando tengamos la sesión funcionando
    return null;
} 