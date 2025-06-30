// Variables globales
let categorias = [];
let ingredientes = [];
let modoEdicion = false;
let recetaId = null;

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar si el usuario está autenticado
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // Verificar si estamos en modo edición
    const urlParams = new URLSearchParams(window.location.search);
    recetaId = urlParams.get('id');
    
    if (recetaId) {
        modoEdicion = true;
        actualizarInterfazEdicion();
    }

    // Cargar datos necesarios primero
    await cargarCategorias();
    await cargarIngredientes();
    
    // Si estamos en modo edición, cargar la receta después de tener los datos
    if (recetaId) {
        await cargarRecetaParaEditar(recetaId);
    }
    
    // Configurar el formulario
    configurarFormulario();
});

// Función para actualizar la interfaz en modo edición
function actualizarInterfazEdicion() {
    document.getElementById('pageTitle').textContent = 'Editar Receta - ¿Qué Cocino Hoy?';
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Receta';
    document.getElementById('submitButton').innerHTML = '<i class="fas fa-save"></i> Actualizar Receta';
    document.getElementById('recetaId').value = recetaId;
}

// Función para cargar una receta para editar
async function cargarRecetaParaEditar(id) {
    try {
        console.log('Cargando receta para editar:', id);
        const response = await fetch(`php/recetas.php?action=obtener&id=${id}`);
        const data = await response.json();
        
        if (data.success) {
            console.log('Receta cargada:', data.receta);
            llenarFormularioConReceta(data.receta);
        } else {
            Swal.fire('Error', data.message || 'Error al cargar la receta', 'error');
            window.location.href = 'mis-recetas.html';
        }
    } catch (error) {
        console.error('Error al cargar receta:', error);
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
        window.location.href = 'mis-recetas.html';
    }
}

// Función para llenar el formulario con los datos de la receta
function llenarFormularioConReceta(receta) {
    console.log('Llenando formulario con receta:', receta);
    
    // Llenar campos básicos
    document.getElementById('nombre').value = receta.titulo;
    document.getElementById('descripcion').value = receta.descripcion;
    document.getElementById('tiempo').value = receta.tiempo_preparacion;
    document.getElementById('dificultad').value = receta.dificultad;
    
    // Llenar categoría
    if (receta.categoria && receta.categoria.nombre) {
        console.log('Buscando categoría:', receta.categoria.nombre);
        const selectCategoria = document.getElementById('categoria');
        for (let i = 0; i < selectCategoria.options.length; i++) {
            if (selectCategoria.options[i].text === receta.categoria.nombre) {
                selectCategoria.value = selectCategoria.options[i].value;
                console.log('Categoría encontrada:', selectCategoria.options[i].value);
                break;
            }
        }
    }
    
    // Llenar ingredientes
    if (receta.ingredientes && receta.ingredientes.length > 0) {
        console.log('Llenando ingredientes:', receta.ingredientes);
        const container = document.getElementById('ingredientesContainer');
        
        // Limpiar todos los ingredientes excepto el primero
        const ingredientesExistentes = container.querySelectorAll('.ingrediente-item');
        for (let i = 1; i < ingredientesExistentes.length; i++) {
            ingredientesExistentes[i].remove();
        }
        
        receta.ingredientes.forEach((ingrediente, index) => {
            if (index === 0) {
                // Usar el primer ingrediente existente
                const primerItem = container.querySelector('.ingrediente-item');
                if (primerItem) {
                    console.log('Llenando primer ingrediente:', ingrediente.nombre);
                    const selectIngrediente = primerItem.querySelector('.ingrediente-select');
                    for (let i = 0; i < selectIngrediente.options.length; i++) {
                        if (selectIngrediente.options[i].text === ingrediente.nombre) {
                            selectIngrediente.value = selectIngrediente.options[i].value;
                            console.log('Ingrediente encontrado:', selectIngrediente.options[i].value);
                            break;
                        }
                    }
                    primerItem.querySelector('.cantidad-input').value = ingrediente.cantidad;
                    primerItem.querySelector('.unidad-select').value = ingrediente.unidad;
                }
            } else {
                // Agregar nuevos ingredientes
                agregarIngrediente();
                const items = container.querySelectorAll('.ingrediente-item');
                const ultimoItem = items[items.length - 1];
                
                const selectIngrediente = ultimoItem.querySelector('.ingrediente-select');
                for (let i = 0; i < selectIngrediente.options.length; i++) {
                    if (selectIngrediente.options[i].text === ingrediente.nombre) {
                        selectIngrediente.value = selectIngrediente.options[i].value;
                        break;
                    }
                }
                ultimoItem.querySelector('.cantidad-input').value = ingrediente.cantidad;
                ultimoItem.querySelector('.unidad-select').value = ingrediente.unidad;
            }
        });
    }
    
    // Llenar pasos
    if (receta.instrucciones) {
        const pasos = receta.instrucciones.split('\n').filter(paso => paso.trim());
        if (pasos.length > 0) {
            const container = document.getElementById('pasosContainer');
            container.innerHTML = '';
            
            pasos.forEach((paso, index) => {
                if (index === 0) {
                    const primerPaso = container.querySelector('.paso-item');
                    if (primerPaso) {
                        primerPaso.querySelector('.paso-texto').value = paso.trim();
                    }
                } else {
                    agregarPaso();
                    const pasosItems = container.querySelectorAll('.paso-item');
                    const ultimoPaso = pasosItems[pasosItems.length - 1];
                    ultimoPaso.querySelector('.paso-texto').value = paso.trim();
                }
            });
            actualizarNumeracionPasos();
        }
    }
}

// Función para cargar categorías
async function cargarCategorias() {
    try {
        const response = await fetch('php/categorias.php?action=list');
        const data = await response.json();
        
        if (data.success) {
            categorias = data.categorias;
            const selectCategoria = document.getElementById('categoria');
            
            selectCategoria.innerHTML = '<option value="">Seleccionar categoría</option>';
            
            categorias.forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria.id;
                option.textContent = categoria.nombre;
                selectCategoria.appendChild(option);
            });
        } else {
            console.error('Error al cargar categorías:', data.message);
        }
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

// Función para cargar ingredientes
async function cargarIngredientes() {
    try {
        const response = await fetch('php/ingredientes.php?action=list');
        const data = await response.json();
        
        if (data.success) {
            ingredientes = data.ingredientes;
            actualizarSelectsIngredientes();
        } else {
            console.error('Error al cargar ingredientes:', data.message);
        }
    } catch (error) {
        console.error('Error al cargar ingredientes:', error);
    }
}

// Función para actualizar todos los selects de ingredientes
function actualizarSelectsIngredientes() {
    const selects = document.querySelectorAll('.ingrediente-select');
    
    selects.forEach(select => {
        const valorSeleccionado = select.value;
        
        select.innerHTML = '<option value="">Seleccionar ingrediente</option>';
        
        ingredientes.forEach(ingrediente => {
            const option = document.createElement('option');
            option.value = ingrediente.id;
            option.textContent = ingrediente.nombre;
            select.appendChild(option);
        });
        
        select.value = valorSeleccionado;
    });
}

// Función para configurar el formulario
function configurarFormulario() {
    const form = document.getElementById('formReceta');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (validarFormulario()) {
            await guardarReceta();
        }
    });
}

// Función para validar el formulario
function validarFormulario() {
    const nombre = document.getElementById('nombre').value.trim();
    const descripcion = document.getElementById('descripcion').value.trim();
    const categoria = document.getElementById('categoria').value;
    const tiempo = document.getElementById('tiempo').value;
    const dificultad = document.getElementById('dificultad').value;
    
    if (!nombre || !descripcion || !categoria || !tiempo || !dificultad) {
        Swal.fire({
            icon: 'error',
            title: 'Campos requeridos',
            text: 'Por favor completa todos los campos obligatorios.'
        });
        return false;
    }
    
    const ingredientesItems = document.querySelectorAll('.ingrediente-item');
    let ingredientesValidos = true;
    
    ingredientesItems.forEach(item => {
        const ingrediente = item.querySelector('.ingrediente-select').value;
        const cantidad = item.querySelector('.cantidad-input').value;
        const unidad = item.querySelector('.unidad-select').value;
        
        if (!ingrediente || !cantidad || !unidad) {
            ingredientesValidos = false;
        }
    });
    
    if (!ingredientesValidos) {
        Swal.fire({
            icon: 'error',
            title: 'Ingredientes incompletos',
            text: 'Por favor completa todos los campos de ingredientes.'
        });
        return false;
    }
    
    const pasos = document.querySelectorAll('.paso-texto');
    let pasosValidos = true;
    
    pasos.forEach(paso => {
        if (!paso.value.trim()) {
            pasosValidos = false;
        }
    });
    
    if (!pasosValidos) {
        Swal.fire({
            icon: 'error',
            title: 'Pasos incompletos',
            text: 'Por favor completa todos los pasos de preparación.'
        });
        return false;
    }
    
    return true;
}

// Función para guardar la receta
async function guardarReceta() {
    try {
        const loadingTitle = modoEdicion ? 'Actualizando receta...' : 'Guardando receta...';
        Swal.fire({
            title: loadingTitle,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const formData = new FormData();
        formData.append('action', modoEdicion ? 'update' : 'create');
        
        if (modoEdicion) {
            formData.append('receta_id', recetaId);
        }
        
        formData.append('nombre', document.getElementById('nombre').value.trim());
        formData.append('descripcion', document.getElementById('descripcion').value.trim());
        formData.append('categoria_id', document.getElementById('categoria').value);
        formData.append('tiempo', document.getElementById('tiempo').value);
        formData.append('dificultad', document.getElementById('dificultad').value);
        
        const ingredientesData = [];
        const ingredientesItems = document.querySelectorAll('.ingrediente-item');
        
        ingredientesItems.forEach(item => {
            const ingredienteId = item.querySelector('.ingrediente-select').value;
            const cantidad = item.querySelector('.cantidad-input').value;
            let unidad = item.querySelector('.unidad-select').value;
            // Obtener nombre del ingrediente para unidad automática
            let nombre = '';
            if (ingredientes && ingredientes.length > 0) {
                const ingObj = ingredientes.find(ing => ing.id == ingredienteId);
                if (ingObj) nombre = ingObj.nombre;
            }
            if (!unidad || unidad === '0') {
                // Si no hay unidad, usar la automática
                unidad = determinarUnidadAutomatica(ingredienteId, nombre);
            }
            ingredientesData.push({
                ingrediente_id: ingredienteId,
                cantidad: cantidad,
                unidad: unidad
            });
        });
        
        formData.append('ingredientes', JSON.stringify(ingredientesData));
        
        const pasosData = [];
        const pasos = document.querySelectorAll('.paso-texto');
        
        pasos.forEach((paso, index) => {
            pasosData.push({
                numero: index + 1,
                descripcion: paso.value.trim()
            });
        });
        
        formData.append('pasos', JSON.stringify(pasosData));
        
        const response = await fetch('php/recetas.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            const successTitle = modoEdicion ? '¡Receta actualizada!' : '¡Receta guardada!';
            const successText = modoEdicion ? 'Tu receta se ha actualizado exitosamente.' : 'Tu receta se ha guardado exitosamente.';
            
            Swal.fire({
                icon: 'success',
                title: successTitle,
                text: successText,
                confirmButtonText: 'Ver mis recetas'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'mis-recetas.html';
                }
            });
        } else {
            throw new Error(data.message || 'Error al guardar la receta');
        }
        
    } catch (error) {
        console.error('Error al guardar receta:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Ocurrió un error al guardar la receta.'
        });
    }
}

// Función para agregar ingrediente
function agregarIngrediente() {
    const container = document.getElementById('ingredientesContainer');
    const nuevoItem = document.createElement('div');
    nuevoItem.className = 'row ingrediente-item mb-2';
    
    nuevoItem.innerHTML = `
        <div class="col-md-4">
            <select class="form-select ingrediente-select" required>
                <option value="">Seleccionar ingrediente</option>
            </select>
        </div>
        <div class="col-md-3">
            <input type="number" class="form-control cantidad-input" placeholder="Cantidad" min="0.1" step="0.1" required>
        </div>
        <div class="col-md-3">
            <select class="form-select unidad-select" required>
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
            </select>
        </div>
        <div class="col-md-2">
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="eliminarIngrediente(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    container.appendChild(nuevoItem);
    
    const nuevoSelect = nuevoItem.querySelector('.ingrediente-select');
    ingredientes.forEach(ingrediente => {
        const option = document.createElement('option');
        option.value = ingrediente.id;
        option.textContent = ingrediente.nombre;
        nuevoSelect.appendChild(option);
    });
}

// Función para eliminar ingrediente
function eliminarIngrediente(button) {
    const item = button.closest('.ingrediente-item');
    const container = document.getElementById('ingredientesContainer');
    
    if (container.children.length > 1) {
        item.remove();
    } else {
        Swal.fire({
            icon: 'warning',
            title: 'No se puede eliminar',
            text: 'Debe haber al menos un ingrediente en la receta.'
        });
    }
}

// Función para agregar paso
function agregarPaso() {
    const container = document.getElementById('pasosContainer');
    const pasosExistentes = container.children.length;
    const nuevoPaso = document.createElement('div');
    nuevoPaso.className = 'paso-item mb-3';
    
    nuevoPaso.innerHTML = `
        <div class="d-flex align-items-start">
            <span class="badge bg-primary me-2 mt-1">${pasosExistentes + 1}</span>
            <textarea class="form-control paso-texto" rows="2" placeholder="Describe el paso ${pasosExistentes + 1}..." required></textarea>
            <button type="button" class="btn btn-outline-danger btn-sm ms-2" onclick="eliminarPaso(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    container.appendChild(nuevoPaso);
    actualizarNumeracionPasos();
}

// Función para eliminar paso
function eliminarPaso(button) {
    const paso = button.closest('.paso-item');
    const container = document.getElementById('pasosContainer');
    
    if (container.children.length > 1) {
        paso.remove();
        actualizarNumeracionPasos();
    } else {
        Swal.fire({
            icon: 'warning',
            title: 'No se puede eliminar',
            text: 'Debe haber al menos un paso en la preparación.'
        });
    }
}

// Función para actualizar numeración de pasos
function actualizarNumeracionPasos() {
    const pasos = document.querySelectorAll('.paso-item');
    
    pasos.forEach((paso, index) => {
        const badge = paso.querySelector('.badge');
        const textarea = paso.querySelector('.paso-texto');
        
        badge.textContent = index + 1;
        textarea.placeholder = `Describe el paso ${index + 1}...`;
    });
} 