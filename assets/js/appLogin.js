

if(JSON.parse(localStorage.getItem('usuario'))){
    window.location.href = "home.html";
}



const esEmailValido = email => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

const esPasswordValido = password => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[0-9!$*&@])[A-Za-z\d!$*&@]{8,}$/;
    return regex.test(password);
}

const crearCuenta = async () => {
    let email = document.querySelector("#remail").value;
    let password = document.querySelector("#rpassword").value;
    let nombre = document.querySelector("#rnombre").value;

    if (!esEmailValido(email)) {
        Swal.fire({ title: "ERROR!", text: "Email incorrecto!", icon: "error" });
        return;
    }

    if (!esPasswordValido(password)) {
        Swal.fire({ title: "ERROR!", text: "Password incorrecto!", icon: "error" });
        return;
    }

    if (nombre.trim() === '') {
        Swal.fire({ title: "ERROR!", text: "Falta Nombre!!", icon: "error" });
        return;
    }

    let usuario = { email, password, nombre };
const formData = new FormData();
formData.append('email', usuario.email);
formData.append('password', usuario.password);
formData.append('nombre', usuario.nombre);

    try {
      const response = await fetch('php/usuario/registro.php', {
    method: 'POST',
    body: formData
});

        const data = await response.json();

        if (data.success) {
            Swal.fire({ title: "EXITO!", text: "SE CREO CORRECTAMENTE!!!", icon: "success" });
        } else {
            Swal.fire('Error', data.message, 'error');
        }
    } catch (error) {
        Swal.fire('Error', 'Hubo un problema al conectar con el servidor', 'error');
        console.error('Error:', error);
    }

}

 const loginUsuario= async ()=> {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        Swal.fire("Error", "Por favor, completa todos los campos.", "error");
        return;
    }

    try {
        const response = await fetch("php/usuario/login.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        
if (data.success) {
    Swal.fire({
        title: "ÉXITO",
        text: "Bienvenido " + data.usuario.nombre,
        icon: "success",
        showConfirmButton: false,  // Oculta el botón "OK"
        timer: 1000                // Cierra automáticamente después de 1 segundo
    });

    localStorage.setItem("usuario", JSON.stringify(data.usuario));

    setTimeout(function () {
        window.location.href = "home.html";
    }, 1000);

} else {
    Swal.fire("Error", data.message, "error");
}

    } catch (error) {
        console.error("Error en login:", error);
        Swal.fire("Error", "Error al conectar con el servidor.", "error");
    }
}
