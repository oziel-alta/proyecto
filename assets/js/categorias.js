// categorias.js - Funcionalidad de categorías

document.addEventListener('DOMContentLoaded', function() {
    // Cargar categorías si estamos en la página de categorías
    if (window.location.pathname.includes('categorias.html')) {
        cargarCategorias();
    }
});

// Cargar lista de categorías
async function cargarCategorias() {
    try {
        const response = await fetch('php/categorias.php?action=listar');
        const data = await response.json();
        
        if (data.success) {
            mostrarCategorias(data.categorias);
        } else {
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
    }
}

// Mostrar lista de categorías
function mostrarCategorias(categorias) {
    const container = document.getElementById('listaCategorias');
    const noCategorias = document.getElementById('noCategorias');
    
    if (!container) return;
    
    if (categorias.length === 0) {
        if (noCategorias) {
            noCategorias.classList.remove('d-none');
            noCategorias.className = 'sin-contenido';
            noCategorias.innerHTML = `
                <i class="fas fa-tags"></i>
                <h4>No hay categorías disponibles</h4>
                <p>Inicia sesión para agregar nuevas categorías</p>
            `;
        }
        container.innerHTML = '';
        return;
    }
    
    if (noCategorias) noCategorias.classList.add('d-none');
    
    container.innerHTML = categorias.map((categoria, index) => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card categoria-card h-100" style="animation-delay: ${index * 0.1}s; --categoria-color: ${categoria.color || '#007bff'}">
                <div class="categoria-color-bar"></div>
                <div class="card-body">
                    <div class="text-center mb-3">
                        <i class="${categoria.icono || 'fas fa-tag'} categoria-icono" style="color: ${categoria.color || '#007bff'};"></i>
                    </div>
                    
                    <div class="text-center mb-3">
                        <h5 class="card-title mb-2">${categoria.nombre}</h5>
                        <p class="card-text text-muted small">${categoria.descripcion || 'Sin descripción'}</p>
                    </div>
                    
                    <div class="d-flex justify-content-center">
                        <span class="badge badge-elegante" style="background-color: ${categoria.color || '#007bff'}; color: white;">
                            <i class="${categoria.icono || 'fas fa-tag'} me-1"></i>
                            ${categoria.nombre}
                        </span>
                    </div>
                    
                    <div class="d-flex justify-content-center mt-3">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary btn-elegante" onclick="editarCategoria(${categoria.id})" data-tooltip="Editar categoría" class="tooltip-elegante">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-elegante" onclick="eliminarCategoria(${categoria.id}, '${categoria.nombre}')" data-tooltip="Eliminar categoría" class="tooltip-elegante">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Mostrar formulario para nueva categoría
function mostrarFormularioCategoria() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    if (!usuario) {
        Swal.fire('Error', 'Debes iniciar sesión para gestionar categorías', 'error');
        return;
    }
    
    // Limpiar formulario
    document.getElementById('categoriaId').value = '';
    document.getElementById('nombreCategoria').value = '';
    document.getElementById('descripcionCategoria').value = '';
    document.getElementById('iconoCategoria').value = '';
    document.getElementById('colorCategoria').value = '#007bff';
    
    // Cambiar título
    document.getElementById('modalCategoriaTitle').textContent = 'Nueva Categoría';
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('categoriaModal'));
    modal.show();
}

// Editar categoría
async function editarCategoria(id) {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    if (!usuario) {
        Swal.fire('Error', 'Debes iniciar sesión para editar categorías', 'error');
        return;
    }
    
    try {
        const response = await fetch(`php/categorias.php?action=obtener&id=${id}`);
        const data = await response.json();
        
        if (data.success) {
            const categoria = data.categoria;
            
            // Llenar formulario
            document.getElementById('categoriaId').value = categoria.id;
            document.getElementById('nombreCategoria').value = categoria.nombre;
            document.getElementById('descripcionCategoria').value = categoria.descripcion || '';
            document.getElementById('iconoCategoria').value = categoria.icono || '';
            document.getElementById('colorCategoria').value = categoria.color || '#007bff';
            
            // Cambiar título
            document.getElementById('modalCategoriaTitle').textContent = 'Editar Categoría';
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('categoriaModal'));
            modal.show();
        } else {
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        console.error('Error al obtener categoría:', error);
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
    }
}

// Guardar categoría (crear o editar)
async function guardarCategoria() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    if (!usuario) {
        Swal.fire('Error', 'Debes iniciar sesión para gestionar categorías', 'error');
        return;
    }
    
    const id = document.getElementById('categoriaId').value;
    const nombre = document.getElementById('nombreCategoria').value.trim();
    const descripcion = document.getElementById('descripcionCategoria').value.trim();
    const icono = document.getElementById('iconoCategoria').value;
    const color = document.getElementById('colorCategoria').value;
    
    if (!nombre) {
        Swal.fire('Error', 'El nombre es requerido', 'error');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('nombre', nombre);
        formData.append('descripcion', descripcion);
        formData.append('icono', icono);
        formData.append('color', color);
        
        let url = 'php/categorias.php?action=crear';
        if (id) {
            url = 'php/categorias.php?action=editar';
            formData.append('id', id);
        }
        
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            Swal.fire('Éxito', data.message, 'success');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('categoriaModal'));
            modal.hide();
            
            // Recargar categorías
            cargarCategorias();
        } else {
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        console.error('Error al guardar categoría:', error);
        Swal.fire('Error', 'Error al conectar con el servidor', 'error');
    }
}

// Eliminar categoría
async function eliminarCategoria(id, nombre) {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    if (!usuario) {
        Swal.fire('Error', 'Debes iniciar sesión para eliminar categorías', 'error');
        return;
    }
    
    const result = await Swal.fire({
        title: '¿Eliminar categoría?',
        text: `¿Estás seguro de que quieres eliminar la categoría "${nombre}"?`,
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
            
            const response = await fetch('php/categorias.php?action=eliminar', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                Swal.fire('Éxito', data.message, 'success');
                cargarCategorias();
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        } catch (error) {
            console.error('Error al eliminar categoría:', error);
            Swal.fire('Error', 'Error al conectar con el servidor', 'error');
        }
    }
} 