// mis-recetas.js - Funcionalidad para gestionar las recetas del usuario

// Funci�n para determinar la unidad autom�ticamente basada en el ingrediente
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
        'aj�': 'unidad',
        'leche': 'ml',
        'queso': 'g',
        'mantequilla': 'g',
        'crema': 'ml',
        'yogur': 'ml',
        'pollo': 'g',
        'carne': 'g',
        'cerdo': 'g',
        'pescado': 'g',
        'jam�n': 'g',
        'tocino': 'g',
        'arroz': 'g',
        'pasta': 'g',
        'harina': 'g',
        'az�car': 'g',
        'sal': 'cucharadita',
        'pimienta': 'pizca',
        'aceite': 'cucharada',
        'oliva': 'cucharada',
        'huevo': 'unidad',
        'huevos': 'unidad',
        'manzana': 'unidad',
        'pl�tano': 'unidad',
        'naranja': 'unidad',
        'lim�n': 'unidad',
        'lima': 'unidad',
        'lechuga': 'unidad',
        'espinaca': 'g',
        'br�coli': 'g',
        'coliflor': 'g',
        'pepino': 'unidad',
        'calabaza': 'g',
        'berenjena': 'unidad',
        'nuez': 'g',
        'almendra': 'g',
        'man�': 'g',
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
        'pur�': 'g',
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

// Funci�n para formatear ingrediente con unidad autom�tica
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
    // Verificar autenticaci�n
    if (!isAuthenticated()) {
        mostrarMisRecetasNoAutenticado();
        return;
    }
    
    // Cargar recetas del usuario
    cargarMisRecetas();
});

// Mostrar mensaje cuando no est� autenticado
function mostrarMisRecetasNoAutenticado() {
    const container = document.getElementById('listaRecetas');
    const noRecetas = document.getElementById('noRecetas');
    
    if (noRecetas) {
        noRecetas.classList.remove('d-none');
        noRecetas.className = 'sin-contenido';
        noRecetas.innerHTML = `
            <i class="fas fa-lock"></i>
            <h4>Inicia sesion para ver tus recetas</h4>
            <p>Necesitas tener una cuenta para crear y gestionar tus recetas</p>
            <div class="d-flex gap-2 justify-content-center">
                <a href="login.html" class="btn btn-primary btn-elegante">
                    <i class="fas fa-sign-in-alt"></i> Iniciar Sesion
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

// Cargar recetas del usuario
async function cargarMisRecetas() {
    try {
        const response = await fetch('php/recetas.php?action=mis_recetas');
        const data = await response.json();
        
        if (data.success) {
            mostrarMisRecetas(data.recetas);
        } else {
            if (data.message === 'Usuario no autenticado') {
                mostrarMisRecetasNoAutenticado();
                return;
            }
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        console.error('Error al cargar recetas:', error);
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
    }
}

// Mostrar lista de recetas del usuario
function mostrarMisRecetas(recetas) {
    const container = document.getElementById('listaRecetas');
    const noRecetas = document.getElementById('noRecetas');
    
    if (!container) return;
    
    if (recetas.length === 0) {
        if (noRecetas) {
            noRecetas.classList.remove('d-none');
            noRecetas.className = 'sin-contenido';
            noRecetas.innerHTML = `
                <i class="fas fa-book-open"></i>
                <h4>No tienes recetas creadas</h4>
                <p>Comienza a crear tus propias recetas y compartelas con la comunidad!</p>
                <a href="agregar-receta.html" class="btn btn-primary btn-elegante">
                    <i class="fas fa-plus"></i> Crear Primera Receta
                </a>
            `;
        }
        container.innerHTML = '';
        return;
    }
    
    if (noRecetas) noRecetas.classList.add('d-none');
    
    container.innerHTML = recetas.map((receta, index) => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card receta-card h-100" style="animation-delay: ${index * 0.1}s;">
                <div class="card-img-top bg-light d-flex align-items-center justify-content-center receta-imagen" style="height: 200px;">
                    <i class="fas fa-utensils fa-3x text-muted"></i>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${receta.titulo}</h5>
                    <p class="card-text text-muted">${receta.descripcion || ''}</p>
                    
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge badge-elegante" style="background-color: ${receta.categoria?.color || '#007bff'}; color: white;">
                            ${receta.categoria?.nombre || 'Sin categoria'}
                        </span>
                        <small class="text-muted">
                            <i class="fas fa-clock"></i> ${receta.tiempo_preparacion || 'N/A'} min
                        </small>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge badge-elegante bg-secondary">${receta.dificultad}</span>
                        <span class="text-muted">
                            <i class="fas fa-users"></i> ${receta.porciones || 'N/A'} porciones
                        </span>
                    </div>
                    
                    <div class="receta-creador">
                        <small class="text-muted">
                            <i class="fas fa-calendar"></i> ${new Date(receta.fecha_creacion).toLocaleDateString()}
                        </small>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <div class="d-flex justify-content-between align-items-center">
                        <button class="btn btn-primary btn-sm btn-elegante" onclick="verReceta(${receta.id})" data-tooltip="Ver receta" class="tooltip-elegante">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        <div class="btn-group" role="group">
                            <button class="btn btn-warning btn-sm btn-elegante" onclick="editarReceta(${receta.id})" data-tooltip="Editar receta" class="tooltip-elegante">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-sm btn-elegante" onclick="confirmarEliminarReceta(${receta.id})" data-tooltip="Eliminar receta" class="tooltip-elegante">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Editar receta
function editarReceta(recetaId) {
    // Cerrar modal de receta
    const modal = bootstrap.Modal.getInstance(document.getElementById('recetaModal'));
    if (modal) {
        modal.hide();
    }
    
    // Redirigir a la p�gina de agregar receta con el ID para edici�n
    window.location.href = `agregar-receta.html?id=${recetaId}`;
}

// Confirmar eliminaci�n de receta con SweetAlert
function confirmarEliminarReceta(recetaId) {
    // Cerrar modal de receta si est� abierto
    const modal = bootstrap.Modal.getInstance(document.getElementById('recetaModal'));
    if (modal) {
        modal.hide();
    }
    
    // Mostrar SweetAlert de confirmaci�n
    Swal.fire({
        title: 'Eliminar receta?',
        text: 'Esta accian no se puede deshacer. Estas seguro?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Si, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            eliminarReceta(recetaId);
        }
    });
}

// Eliminar receta
async function eliminarReceta(recetaId) {
    if (!recetaId) {
        Swal.fire('Error', 'Error al eliminar la receta', 'error');
        return;
    }
    
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Eliminando receta...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const formData = new FormData();
        formData.append('receta_id', recetaId);
        
        const response = await fetch('php/recetas.php?action=eliminar', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            Swal.fire('Exito', data.message, 'success');
            
            // Recargar la lista de recetas
            cargarMisRecetas();
        } else {
            if (data.message === 'Usuario no autenticado') {
                mostrarMisRecetasNoAutenticado();
                return;
            }
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        console.error('Error al eliminar receta:', error);
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
    const modalFooter = document.querySelector('#recetaModal .modal-footer');
    
    // Configurar t�tulo
    modalTitle.textContent = receta.titulo;
    
    // Configurar contenido
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6><i class="fas fa-info-circle"></i> Informacion</h6>
                <ul class="list-unstyled">
                    <li><strong>Tiempo:</strong> ${receta.tiempo_preparacion || 'N/A'} minutos</li>
                    <li><strong>Dificultad:</strong> ${receta.dificultad}</li>
                    <li><strong>Porciones:</strong> ${receta.porciones}</li>
                    <li><strong>Categoria:</strong> ${receta.categoria?.nombre || 'Sin categor�a'}</li>
                    <li><strong>Creado por:</strong> ${receta.usuario?.nombre || 'Usuario'}</li>
                    <li><strong>Fecha de creacion:</strong> ${new Date(receta.fecha_creacion).toLocaleDateString()}</li>
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
    
    // Configurar footer con botones de acci�n
    modalFooter.innerHTML = `
        <button type="button" class="btn btn-secondary btn-elegante" data-bs-dismiss="modal">Cerrar</button>
        <button type="button" class="btn btn-warning btn-elegante" onclick="editarReceta(${receta.id})">
            <i class="fas fa-edit"></i> Editar
        </button>
        <button type="button" class="btn btn-danger btn-elegante" onclick="confirmarEliminarReceta(${receta.id})">
            <i class="fas fa-trash"></i> Eliminar
        </button>
    `;
    
    // Mostrar modal
    modal.show();
}
