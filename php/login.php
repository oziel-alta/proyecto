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
    $email = isset($_POST['email']) ? trim($_POST['email']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';

    if ($email === '' || $password === '') {
        echo json_encode(['success' => false, 'message' => 'Faltan datos.']);
        exit;
    }

    $stmt = $conexion->prepare('SELECT id, username, nombre, email, password FROM usuarios WHERE email = ? LIMIT 1');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        if (password_verify($password, $row['password'])) {
            // Iniciar sesión PHP
            session_start();
            $_SESSION['usuario_id'] = $row['id'];
            $_SESSION['usuario_nombre'] = $row['nombre'];
            $_SESSION['usuario_email'] = $row['email'];
            
            // Login correcto
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $row['id'],
                    'username' => $row['username'],
                    'nombre' => $row['nombre'],
                    'email' => $row['email']
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta.']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado.']);
    }
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
} 