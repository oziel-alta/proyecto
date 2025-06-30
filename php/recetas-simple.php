<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include 'conexion.php';
include 'auth-check.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

echo json_encode([
    'success' => true,
    'message' => 'Acción recibida: ' . $action,
    'method' => $_SERVER['REQUEST_METHOD'],
    'post_data' => $_POST
]);

try {
    switch ($action) {
        case 'update':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                echo json_encode([
                    'success' => true,
                    'message' => 'Acción update reconocida correctamente',
                    'receta_id' => isset($_POST['receta_id']) ? $_POST['receta_id'] : 'no encontrado'
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Método no permitido para update']);
            }
            break;
            
        case 'create':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                echo json_encode([
                    'success' => true,
                    'message' => 'Acción create reconocida correctamente'
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Método no permitido para create']);
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida: ' . $action]);
            break;
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?> 