// ingredientes.js - Funcionalidad de ingredientes

document.addEventListener('DOMContentLoaded', function() {
    // Cargar ingredientes si estamos en la página de ingredientes
    if (window.location.pathname.includes('ingredientes.html')) {
        cargarIngredientes();
    }
});

// Cargar lista de ingredientes
async function cargarIngredientes() {
    try {
        const response = await fetch('php/ingredientes.php?action=listar');
        const data = await response.json();
        
        if (data.success) {
            mostrarIngredientes(data.ingredientes);
        } else {
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        console.error('Error al cargar ingredientes:', error);
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
    }
}

// Mostrar lista de ingredientes
function mostrarIngredientes(ingredientes, terminoBusqueda = '') {
    const container = document.getElementById('listaIngredientes');
    const noIngredientes = document.getElementById('noIngredientes');
    
    if (!container) return;
    
    if (ingredientes.length === 0) {
        if (noIngredientes) noIngredientes.classList.remove('d-none');
        container.innerHTML = '';
        return;
    }
    
    if (noIngredientes) noIngredientes.classList.add('d-none');
    
    // Función para resaltar términos de búsqueda
    function resaltarTermino(texto, termino) {
        if (!termino) return texto;
        const regex = new RegExp(`(${termino})`, 'gi');
        return texto.replace(regex, '<span class="resaltado-busqueda">$1</span>');
    }
    
    container.innerHTML = ingredientes.map((ingrediente, index) => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card ingrediente-card resultado-busqueda h-100" style="animation-delay: ${index * 0.1}s;">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        <div class="me-3">
                            <i class="fas fa-carrot" style="color: #28a745; font-size: 2rem;"></i>
                        </div>
                        <div>
                            <h5 class="card-title mb-1">${resaltarTermino(ingrediente.nombre, terminoBusqueda)}</h5>
                        </div>
                    </div>
                    
                    <div class="row mb-3">
                        <div class="col-6">
                            <small class="text-muted">Categoría:</small>
                            <div class="fw-bold">${ingrediente.categoria || 'Sin categoría'}</div>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">Unidad base:</small>
                            <div class="fw-bold">${ingrediente.unidad_base || 'N/A'}</div>
                        </div>
                    </div>
                    
                    <div class="d-flex justify-content-end">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary btn-elegante" onclick="editarIngrediente(${ingrediente.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-elegante" onclick="eliminarIngrediente(${ingrediente.id}, '${ingrediente.nombre}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Mostrar formulario para nuevo ingrediente
function mostrarFormularioIngrediente() {
    console.log('Iniciando mostrarFormularioIngrediente...');
    
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    if (!usuario) {
        console.log('Usuario no autenticado');
        Swal.fire('Error', 'Debes iniciar sesión para gestionar ingredientes', 'error');
        return;
    }
    
    // Verificar que todos los elementos existan antes de limpiarlos
    const elementos = {
        ingredienteId: document.getElementById('ingredienteId'),
        nombreIngrediente: document.getElementById('nombreIngrediente'),
        categoriaIngrediente: document.getElementById('categoriaIngrediente'),
        unidadIngrediente: document.getElementById('unidadIngrediente'),
        modalIngredienteTitle: document.getElementById('modalIngredienteTitle')
    };
    
    console.log('Elementos encontrados:', elementos);
    
    // Verificar si algún elemento es null (ya no se valida descripcionIngrediente)
    for (const [key, element] of Object.entries(elementos)) {
        if (!element) {
            console.error(`Elemento ${key} no encontrado`);
            Swal.fire('Error', `Error interno: elemento ${key} no encontrado`, 'error');
            return;
        }
    }
    
    // Limpiar formulario
    elementos.ingredienteId.value = '';
    elementos.nombreIngrediente.value = '';
    elementos.categoriaIngrediente.value = '';
    elementos.unidadIngrediente.value = '';
    
    // Cambiar título
    elementos.modalIngredienteTitle.textContent = 'Nuevo Ingrediente';
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('ingredienteModal'));
    modal.show();
    
    console.log('Modal mostrado correctamente');
}

// Función para actualizar unidad base según categoría
function actualizarUnidadBase() {
    const categoria = document.getElementById('categoriaIngrediente').value;
    const unidadSelect = document.getElementById('unidadIngrediente');
    
    // Mapeo de categorías a unidades base
    const unidadesPorCategoria = {
        'vegetales': 'unidades',
        'frutas': 'unidades', 
        'carnes': 'gramos',
        'pescados': 'gramos',
        'lacteos': 'mililitros',
        'cereales': 'gramos',
        'especias': 'cucharaditas',
        'otros': 'unidades',
        'embutidos': 'gramos',
        'panaderia': 'unidades',
        'bebidas': 'mililitros',
        'salsas': 'mililitros',
        'mariscos': 'gramos',
        'semillas': 'gramos',
        'aceites': 'mililitros',
        'frutos_secos': 'gramos',
        'dulces': 'unidades',
        'conservas': 'unidades'
    };
    
    if (categoria && unidadesPorCategoria[categoria]) {
        unidadSelect.value = unidadesPorCategoria[categoria];
        console.log(`Unidad base actualizada a: ${unidadesPorCategoria[categoria]} para categoría: ${categoria}`);
    }
}

// Editar ingrediente
async function editarIngrediente(id) {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    if (!usuario) {
        Swal.fire('Error', 'Debes iniciar sesión para editar ingredientes', 'error');
        return;
    }
    
    try {
        const response = await fetch(`php/ingredientes.php?action=obtener&id=${id}`);
        const data = await response.json();
        
        if (data.success) {
            const ingrediente = data.ingrediente;
            
            // Llenar formulario
            document.getElementById('ingredienteId').value = ingrediente.id;
            document.getElementById('nombreIngrediente').value = ingrediente.nombre;
            document.getElementById('categoriaIngrediente').value = ingrediente.categoria || '';
            document.getElementById('unidadIngrediente').value = ingrediente.unidad_base || '';
            
            // Actualizar unidad base según la categoría
            actualizarUnidadBase();
            
            // Cambiar título
            document.getElementById('modalIngredienteTitle').textContent = 'Editar Ingrediente';
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('ingredienteModal'));
            modal.show();
        } else {
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        console.error('Error al obtener ingrediente:', error);
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
    }
}

// Guardar ingrediente (crear o editar)
async function guardarIngrediente() {
    console.log('=== INICIANDO GUARDAR INGREDIENTE ===');
    
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    if (!usuario) {
        console.log('❌ Usuario no autenticado');
        Swal.fire('Error', 'Debes iniciar sesión para gestionar ingredientes', 'error');
        return;
    }
    
    console.log('✅ Usuario autenticado:', usuario);
    
    // Obtener valores del formulario
    const id = document.getElementById('ingredienteId')?.value || '';
    const nombre = document.getElementById('nombreIngrediente')?.value?.trim() || '';
    const categoria = document.getElementById('categoriaIngrediente')?.value?.trim() || '';
    const unidadBase = document.getElementById('unidadIngrediente')?.value?.trim() || '';
    
    console.log('📝 Datos del formulario:', { 
        id, 
        nombre, 
        categoria, 
        unidadBase,
        nombreLength: nombre.length,
    });
    
    // Validaciones
    if (!nombre) {
        console.log('❌ Nombre vacío');
        Swal.fire('Error', 'El nombre es requerido', 'error');
        return;
    }
    
    if (nombre.length < 2) {
        console.log('❌ Nombre muy corto');
        Swal.fire('Error', 'El nombre debe tener al menos 2 caracteres', 'error');
        return;
    }
    
    console.log('✅ Validaciones pasadas');
    
    try {
        // Preparar datos
        const formData = new FormData();
        formData.append('nombre', nombre);
        formData.append('categoria', categoria);
        formData.append('unidad_base', unidadBase);
        
        let url = 'php/ingredientes.php?action=crear';
        if (id) {
            url = 'php/ingredientes.php?action=editar';
            formData.append('id', id);
        }
        
        console.log('🌐 URL de destino:', url);
        console.log('📦 Datos a enviar:', Object.fromEntries(formData));
        
        // Mostrar indicador de carga
        Swal.fire({
            title: 'Guardando...',
            text: 'Por favor espera',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Enviar petición
        console.log('🚀 Enviando petición...');
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        
        console.log('📨 Respuesta recibida:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            url: response.url
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseText = await response.text();
        console.log('📄 Respuesta completa:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('❌ Error al parsear JSON:', e);
            console.log('Respuesta no válida:', responseText);
            throw new Error('Respuesta del servidor no válida');
        }
        
        console.log('📊 Datos parseados:', data);
        
        if (data.success) {
            console.log('✅ Guardado exitoso');
            Swal.fire('Éxito', data.message, 'success');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('ingredienteModal'));
            if (modal) {
                modal.hide();
            }
            
            // Recargar ingredientes
            await cargarIngredientes();
        } else {
            console.log('❌ Error del servidor:', data.message);
            Swal.fire('Error', data.message || 'Error desconocido', 'error');
        }
    } catch (error) {
        console.error('💥 Error completo:', error);
        Swal.fire('Error', `Error al conectar con el servidor: ${error.message}`, 'error');
    }
    
    console.log('=== FINALIZADO GUARDAR INGREDIENTE ===');
}

// Eliminar ingrediente
async function eliminarIngrediente(id, nombre) {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    if (!usuario) {
        Swal.fire('Error', 'Debes iniciar sesión para eliminar ingredientes', 'error');
        return;
    }
    
    const result = await Swal.fire({
        title: '¿Eliminar ingrediente?',
        text: `¿Estás seguro de que quieres eliminar el ingrediente "${nombre}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
        try {
            const formData = new FormData();
            formData.append('id', id);
            
            const response = await fetch('php/ingredientes.php?action=eliminar', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                Swal.fire('Éxito', data.message, 'success');
                cargarIngredientes();
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        } catch (error) {
            console.error('Error al eliminar ingrediente:', error);
            Swal.fire('Error', 'Error al conectar con el servidor', 'error');
        }
    }
}

// Buscar ingredientes en tiempo real
let timeoutBusqueda = null;

function inicializarBusqueda() {
    console.log('🔍 Inicializando búsqueda en tiempo real...');
    const inputBusqueda = document.getElementById('buscarIngrediente');
    console.log('📝 Campo de búsqueda encontrado:', inputBusqueda);
    
    if (inputBusqueda) {
        console.log('✅ Agregando event listener para búsqueda en tiempo real');
        inputBusqueda.addEventListener('input', function() {
            const termino = this.value.trim();
            console.log('📝 Usuario escribió:', termino);
            
            // Cancelar búsqueda anterior si existe
            if (timeoutBusqueda) {
                clearTimeout(timeoutBusqueda);
                console.log('⏹️ Cancelando búsqueda anterior');
            }
            
            // Esperar 300ms después de que el usuario deje de escribir
            timeoutBusqueda = setTimeout(() => {
                if (termino.length >= 1) {
                    console.log('🔍 Iniciando búsqueda con término:', termino);
                    buscarIngredientesEnTiempoReal(termino);
                } else {
                    console.log('🔄 Mostrando todos los ingredientes');
                    cargarIngredientes();
                }
            }, 300);
        });
        console.log('✅ Event listener agregado correctamente');
    } else {
        console.error('❌ Error: No se encontró el campo de búsqueda');
    }
}

// Buscar ingredientes en tiempo real
async function buscarIngredientesEnTiempoReal(termino) {
    try {
        console.log('🔍 Buscando ingredientes con término:', termino);
        
        // Mostrar indicador de carga
        const indicadorBusqueda = document.getElementById('indicadorBusqueda');
        if (indicadorBusqueda) {
            indicadorBusqueda.innerHTML = '<small class="text-muted"><i class="fas fa-spinner fa-spin"></i> Buscando...</small>';
            indicadorBusqueda.style.display = 'block';
        }
        
        const response = await fetch(`php/ingredientes.php?action=buscar&termino=${encodeURIComponent(termino)}`);
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Resultados encontrados:', data.ingredientes.length);
            
            // Actualizar indicador
            if (indicadorBusqueda) {
                indicadorBusqueda.innerHTML = `<small class="text-success"><i class="fas fa-check"></i> ${data.ingredientes.length} resultado(s) encontrado(s)</small>`;
                
                // Ocultar indicador después de 2 segundos
                setTimeout(() => {
                    indicadorBusqueda.style.display = 'none';
                }, 2000);
            }
            
            mostrarIngredientes(data.ingredientes, termino);
        } else {
            console.log('❌ Error en búsqueda:', data.message);
            if (indicadorBusqueda) {
                indicadorBusqueda.innerHTML = '<small class="text-danger"><i class="fas fa-exclamation-triangle"></i> Error en la búsqueda</small>';
            }
            mostrarIngredientes([], termino);
        }
    } catch (error) {
        console.error('💥 Error al buscar ingredientes:', error);
        const indicadorBusqueda = document.getElementById('indicadorBusqueda');
        if (indicadorBusqueda) {
            indicadorBusqueda.innerHTML = '<small class="text-danger"><i class="fas fa-exclamation-triangle"></i> Error de conexión</small>';
        }
        mostrarIngredientes([], termino);
    }
}

// Función de búsqueda original (para el botón de búsqueda)
async function buscarIngredientes() {
    const termino = document.getElementById('buscarIngrediente').value.trim();
    if (termino.length >= 1) {
        await buscarIngredientesEnTiempoReal(termino);
    } else {
        await cargarIngredientes();
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando página de ingredientes...');
    
    // Verificar autenticación
    checkAuthStatus();
    
    // Cargar ingredientes
    cargarIngredientes();
    
    // Inicializar búsqueda en tiempo real
    inicializarBusqueda();
    
    console.log('✅ Página de ingredientes inicializada correctamente');
}); 