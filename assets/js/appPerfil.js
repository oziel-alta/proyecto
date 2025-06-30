if(!JSON.parse(localStorage.getItem('usuario'))){
     window.location.href = "index.html";
}

const cargarDatos=()=>{
    let usuario=JSON.parse(localStorage.getItem('usuario'));
    document.getElementById("nombreUsuario").innerHTML=usuario.nombre
    document.getElementById("nombre").value=usuario.nombre
    document.getElementById("email").innerHTML=usuario.email
document.getElementById("foto_perfil3").src = usuario.fotoPerfil;
    document.getElementById("profilePreview4").src=usuario.fotoPerfil
   
}


const actualizarUsuario = async () => {
    // Obtener elementos del DOM
    const nombreInput = document.querySelector("#nombre");
    const passwordInput = document.querySelector("#password");
    const fotoInput = document.querySelector("#fotoPerfil");
   
    // Obtener valores y usuario actual
    const nombre = nombreInput.value.trim();
    const password = passwordInput.value;
    const usuario = JSON.parse(localStorage.getItem('usuario'))|| {
        
    };

    // Validaciones básicas
    if (!nombre) {
        await Swal.fire({ title: "ERROR!", text: "El nombre es requerido", icon: "error" });
        return;
    }

    // Actualizar datos básicos
    usuario.nombre = nombre;
    if (password) usuario.password = password;

    // Procesar imagen si existe
    if (fotoInput.files.length > 0) {
        const file = fotoInput.files[0];
       
        // Validar tamaño de imagen (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            await Swal.fire({ title: "ERROR!", text: "La imagen es demasiado grande (máx 5MB)", icon: "error" });
            return;
        }

        // Leer imagen como Base64
        const fotoBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
           
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
           
            reader.readAsDataURL(file);
        });

        // Comprimir imagen si es necesario
        usuario.fotoPerfil = await comprimirImagen(fotoBase64);
    }

    // Enviar datos al servidor
    try {
        const response = await fetch('php/usuario/actualizarPerfil.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuario)
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Error al actualizar perfil");
        }

        // Actualizar localStorage y mostrar éxito
        localStorage.setItem("usuario", JSON.stringify(usuario));
        await Swal.fire({ title: "ÉXITO!", text: "Perfil actualizado correctamente", icon: "success" });
       
        // Redirigir después de 2 segundos
       setTimeout(() => window.location.href = "perfil.html", 2000);
    } catch (error) {
        console.error("Error:", error);
        await Swal.fire({ title: "ERROR!", text: error.message, icon: "error" });
    }
};

// Función para comprimir imagen (opcional)
const comprimirImagen = async (base64Str, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
       
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Redimensionar si es necesario
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
           
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
           
            // Convertir a JPEG con calidad ajustable
            resolve(canvas.toDataURL('image/jpeg', quality));
        };

        // Si hay error, devolver el original
        img.onerror = () => resolve(base64Str);
    });
};

const cerrarSesion=(redirectUrl = "index.html") =>{
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: '¿Cerrar sesión?',
            text: "¿Estás seguro de que deseas salir?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, cerrar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.clear();
                window.location.href = redirectUrl;
            }
        });
    } else {
        if (confirm('¿Cerrar sesión?')) {
            localStorage.clear();
            window.location.href = redirectUrl;
        }
    }
}


cargarDatos();
