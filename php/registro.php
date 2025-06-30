<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre = isset($_POST['nombre']) ? trim($_POST['nombre']) : '';
    $email = isset($_POST['email']) ? trim($_POST['email']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    
    // Generar username basado en el email o nombre
    $username = isset($_POST['username']) ? trim($_POST['username']) : '';
    if (empty($username)) {
        // Si no se proporciona username, usar la parte antes del @ del email
        $username = explode('@', $email)[0];
    }

    if ($nombre === '' || $email === '' || $password === '') {
        echo json_encode(['success' => false, 'message' => 'Faltan datos.']);
        exit;
    }

    try {
        // Verificar si el email ya existe
        $stmt = $conexion->prepare('SELECT id FROM usuarios WHERE email = ? LIMIT 1');
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => 'El correo ya está registrado.']);
            $stmt->close();
            exit;
        }
        $stmt->close();

        // Verificar si el username ya existe
        $stmt = $conexion->prepare('SELECT id FROM usuarios WHERE username = ? LIMIT 1');
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows > 0) {
            // Si el username existe, agregar un número al final
            $originalUsername = $username;
            $counter = 1;
            do {
                $username = $originalUsername . $counter;
                $stmt->close();
                $stmt = $conexion->prepare('SELECT id FROM usuarios WHERE username = ? LIMIT 1');
                $stmt->bind_param('s', $username);
                $stmt->execute();
                $stmt->store_result();
                $counter++;
            } while ($stmt->num_rows > 0);
        }
        $stmt->close();

        // Insertar nuevo usuario
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conexion->prepare('INSERT INTO usuarios (username, nombre, email, password) VALUES (?, ?, ?, ?)');
        $stmt->bind_param('ssss', $username, $nombre, $email, $passwordHash);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Usuario registrado correctamente.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al registrar usuario: ' . $stmt->error]);
        }
        $stmt->close();
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
} 