// recetas.js - Funcionalidad de recetas

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar formulario de receta si existe
    const formReceta = document.getElementById('formReceta');
    if (formReceta) {
        inicializarFormularioReceta();
    }
});

// Inicializar formulario de receta
function inicializarFormularioReceta() {
    // Cargar categorías para el select
    cargarCategorias();
    
    // Agregar evento para agregar ingredientes
    const btnAgregarIngrediente = document.getElementById('btnAgregarIngrediente');
    if (btnAgregarIngrediente) {
        btnAgregarIngrediente.addEventListener('click', agregarIngrediente);
    }
    
    // Agregar evento para guardar receta
    const formReceta = document.getElementById('formReceta');
    if (formReceta) {
        formReceta.addEventListener('submit', guardarReceta);
    }
}

// Cargar categorías
async function cargarCategorias() {
    try {
        const response = await fetch('php/categorias.php?action=listar');
        const data = await response.json();
        
        if (data.success) {
            const selectCategoria = document.getElementById('categoriaReceta');
            if (selectCategoria) {
                selectCategoria.innerHTML = '<option value="">Seleccionar categoría</option>';
                data.categorias.forEach(categoria => {
                    selectCategoria.innerHTML += `<option value="${categoria.nombre}">${categoria.nombre}</option>`;
                });
            }
        }
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

// Agregar ingrediente al formulario
function agregarIngrediente() {
    const container = document.getElementById('ingredientesContainer');
    const index = container.children.length;
    
    const ingredienteHtml = `
        <div class="row mb-2 ingrediente-item" data-index="${index}">
            <div class="col-md-4">
                <input type="text" class="form-control form-control-elegante" name="ingredientes[${index}][nombre]" 
                       placeholder="Nombre del ingrediente" required>
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control form-control-elegante" name="ingredientes[${index}][cantidad]" 
                       placeholder="Cantidad" step="0.1" min="0" required>
            </div>
            <div class="col-md-3">
                <select class="form-control form-control-elegante" name="ingredientes[${index}][unidad]">
                    <option value="">Unidad</option>
                    <option value="g">Gramos (g)</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="l">Litros (l)</option>
                    <option value="taza">Taza</option>
                    <option value="cucharada">Cucharada</option>
                    <option value="cucharadita">Cucharadita</option>
                    <option value="pizca">Pizca</option>
                    <option value="unidad">Unidad</option>
                    <option value="diente">Diente</option>
                    <option value="rebanada">Rebanada</option>
                </select>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-danger btn-sm btn-elegante" onclick="eliminarIngrediente(${index})" data-tooltip="Eliminar ingrediente" class="tooltip-elegante">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', ingredienteHtml);
}

// Eliminar ingrediente del formulario
function eliminarIngrediente(index) {
    const item = document.querySelector(`.ingrediente-item[data-index="${index}"]`);
    if (item) {
        item.remove();
        // Reindexar los elementos restantes
        reindexarIngredientes();
    }
}

// Reindexar ingredientes después de eliminar
function reindexarIngredientes() {
    const items = document.querySelectorAll('.ingrediente-item');
    items.forEach((item, newIndex) => {
        item.setAttribute('data-index', newIndex);
        item.querySelectorAll('input, select').forEach(input => {
            const name = input.getAttribute('name');
            if (name) {
                input.setAttribute('name', name.replace(/\[\d+\]/, `[${newIndex}]`));
            }
        });
        const btnEliminar = item.querySelector('button[onclick^="eliminarIngrediente"]');
        if (btnEliminar) {
            btnEliminar.setAttribute('onclick', `eliminarIngrediente(${newIndex})`);
        }
    });
}

// Guardar receta
async function guardarReceta(event) {
    event.preventDefault();
    
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    if (!usuario) {
        Swal.fire('Error', 'Debes iniciar sesión para crear recetas', 'error');
        return;
    }
    
    // Validar formulario
    const formData = new FormData(event.target);
    const titulo = formData.get('titulo').trim();
    const descripcion = formData.get('descripcion').trim();
    const instrucciones = formData.get('instrucciones').trim();
    const tiempo_preparacion = parseInt(formData.get('tiempo_preparacion')) || 0;
    const dificultad = formData.get('dificultad');
    const porciones = parseInt(formData.get('porciones')) || 1;
    const categoria = formData.get('categoria');
    
    if (!titulo) {
        Swal.fire('Error', 'El título es requerido', 'error');
        return;
    }
    
    if (!instrucciones) {
        Swal.fire('Error', 'Las instrucciones son requeridas', 'error');
        return;
    }
    
    // Recopilar ingredientes
    const ingredientes = [];
    const ingredientesItems = document.querySelectorAll('.ingrediente-item');
    
    ingredientesItems.forEach(item => {
        const nombre = item.querySelector('input[name*="[nombre]"]').value.trim();
        const cantidad = parseFloat(item.querySelector('input[name*="[cantidad]"]').value) || 0;
        let unidad = item.querySelector('select[name*="[unidad]"]').value;
        if (!unidad || unidad === '0') {
            unidad = determinarUnidadAutomatica(null, nombre);
        }
        if (nombre && cantidad > 0) {
            ingredientes.push({
                nombre: nombre,
                cantidad: cantidad,
                unidad: unidad
            });
        }
    });
    
    if (ingredientes.length === 0) {
        Swal.fire('Error', 'Debe agregar al menos un ingrediente', 'error');
        return;
    }
    
    try {
        // Preparar datos para enviar
        const datosReceta = new FormData();
        datosReceta.append('usuario_id', usuario.id);
        datosReceta.append('titulo', titulo);
        datosReceta.append('descripcion', descripcion);
        datosReceta.append('instrucciones', instrucciones);
        datosReceta.append('tiempo_preparacion', tiempo_preparacion);
        datosReceta.append('dificultad', dificultad);
        datosReceta.append('porciones', porciones);
        datosReceta.append('categoria', categoria);
        datosReceta.append('ingredientes', JSON.stringify(ingredientes));
        
        const response = await fetch('php/recetas.php?action=crear', {
            method: 'POST',
            body: datosReceta
        });
        
        const data = await response.json();
        
        if (data.success) {
            Swal.fire({
                title: '¡Éxito!',
                text: data.message,
                icon: 'success',
                confirmButtonText: 'OK'
            }).then(() => {
                // Si estamos en index.html, recargar recetas automáticamente
                if (window.location.pathname.endsWith('index.html')) {
                    if (typeof cargarRecetasDestacadas === 'function') {
                        cargarRecetasDestacadas();
                    } else {
                        window.location.reload();
                    }
                } else {
                    // Redirigir a la página principal o limpiar formulario
                    window.location.href = 'index.html';
                }
            });
        } else {
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        console.error('Error al guardar receta:', error);
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
    }
}

// Ver detalles de una receta
async function verReceta(id) {
    try {
        const response = await fetch(`php/recetas.php?action=obtener&id=${id}`);
        const data = await response.json();
        
        if (data.success) {
            mostrarDetallesReceta(data.receta);
        } else {
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        console.error('Error al obtener receta:', error);
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
    }
}

// Mostrar detalles de receta en modal
function mostrarDetallesReceta(receta) {
    const ingredientesHtml = receta.ingredientes.map(ing => 
        `<li>${formatearIngrediente(ing)}</li>`
    ).join('');
    
    const modalHtml = `
        <div class="modal fade" id="recetaModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${receta.titulo}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-8">
                                <h6>Descripción</h6>
                                <p>${receta.descripcion || 'Sin descripción'}</p>
                                
                                <h6>Instrucciones</h6>
                                <p style="white-space: pre-line;">${receta.instrucciones}</p>
                            </div>
                            <div class="col-md-4">
                                <div class="card">
                                    <div class="card-body">
                                        <h6>Información</h6>
                                        <ul class="list-unstyled">
                                            <li><strong>Tiempo:</strong> ${receta.tiempo_preparacion} min</li>
                                            <li><strong>Dificultad:</strong> ${receta.dificultad}</li>
                                            <li><strong>Porciones:</strong> ${receta.porciones}</li>
                                            <li><strong>Categoría:</strong> ${receta.categoria.nombre}</li>
                                        </ul>
                                        
                                        <h6>Ingredientes</h6>
                                        <ul>
                                            ${ingredientesHtml}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary btn-elegante" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-outline-danger btn-elegante" onclick="toggleFavorito(${receta.id})">
                            <i class="fas fa-heart"></i> Favorito
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const modalAnterior = document.getElementById('recetaModal');
    if (modalAnterior) {
        modalAnterior.remove();
    }
    
    // Agregar nuevo modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('recetaModal'));
    modal.show();
    
    // Verificar estado de favorito
    verificarYActualizarFavorito(receta.id);
} 