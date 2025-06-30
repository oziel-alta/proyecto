<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include 'conexion.php';
include 'auth-check.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($action) {
        case 'add':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $usuario_id = getCurrentUserId();
                $receta_id = isset($_POST['receta_id']) ? (int)$_POST['receta_id'] : 0;
                
                if (!$usuario_id || !$receta_id) {
                    echo json_encode(['success' => false, 'message' => 'Usuario no autenticado o receta no válida']);
                    exit;
                }
                
                // Verificar si ya existe
                $stmt = $conexion->prepare('SELECT id FROM favoritos WHERE usuario_id = ? AND receta_id = ?');
                $stmt->bind_param('ii', $usuario_id, $receta_id);
                $stmt->execute();
                $stmt->store_result();
                
                if ($stmt->num_rows > 0) {
                    echo json_encode(['success' => false, 'message' => 'La receta ya está en favoritos']);
                    $stmt->close();
                    exit;
                }
                $stmt->close();
                
                // Agregar a favoritos
                $stmt = $conexion->prepare('INSERT INTO favoritos (usuario_id, receta_id) VALUES (?, ?)');
                $stmt->bind_param('ii', $usuario_id, $receta_id);
                
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Receta agregada a favoritos']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Error al agregar favorito']);
                }
                $stmt->close();
            }
            break;
            
        case 'remove':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $usuario_id = getCurrentUserId();
                $receta_id = isset($_POST['receta_id']) ? (int)$_POST['receta_id'] : 0;
                
                if (!$usuario_id || !$receta_id) {
                    echo json_encode(['success' => false, 'message' => 'Usuario no autenticado o receta no válida']);
                    exit;
                }
                
                $stmt = $conexion->prepare('DELETE FROM favoritos WHERE usuario_id = ? AND receta_id = ?');
                $stmt->bind_param('ii', $usuario_id, $receta_id);
                
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Receta removida de favoritos']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Error al quitar favorito']);
                }
                $stmt->close();
            }
            break;
            
        case 'list':
            $usuario_id = getCurrentUserId();
            
            if (!$usuario_id) {
                echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
                exit;
            }
            
            $sql = "SELECT r.*, c.nombre as categoria_nombre, c.color as categoria_color,
                           u.nombre as usuario_nombre
                    FROM favoritos f
                    INNER JOIN recetas r ON f.receta_id = r.id
                    LEFT JOIN categorias c ON r.tipo_comida = c.nombre
                    LEFT JOIN usuarios u ON r.creado_por = u.id
                    WHERE f.usuario_id = ? AND r.activo = 1
                    ORDER BY f.fecha_agregado DESC";
            
            $stmt = $conexion->prepare($sql);
            $stmt->bind_param('i', $usuario_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $favoritos = [];
            while ($row = $result->fetch_assoc()) {
                // Obtener ingredientes
                $stmt2 = $conexion->prepare("
                    SELECT ingrediente, cantidad, unidad
                    FROM recetas_ingredientes
                    WHERE receta_id = ?
                ");
                $stmt2->bind_param('i', $row['id']);
                $stmt2->execute();
                $ingredientes_result = $stmt2->get_result();
                
                $ingredientes = [];
                while ($ing = $ingredientes_result->fetch_assoc()) {
                    $ingredientes[] = [
                        'nombre' => $ing['ingrediente'],
                        'cantidad' => $ing['cantidad'],
                        'unidad' => $ing['unidad']
                    ];
                }
                $stmt2->close();
                
                $favoritos[] = [
                    'id' => $row['id'],
                    'titulo' => $row['nombre'],
                    'descripcion' => $row['descripcion'],
                    'instrucciones' => $row['instrucciones'],
                    'tiempo_preparacion' => $row['tiempo_preparacion'],
                    'dificultad' => $row['dificultad'],
                    'porciones' => $row['porciones'],
                    'categoria' => [
                        'nombre' => $row['categoria_nombre'] ?: $row['tipo_comida'],
                        'color' => $row['categoria_color'] ?: '#007bff'
                    ],
                    'usuario' => [
                        'id' => $row['creado_por'],
                        'nombre' => $row['usuario_nombre'] ?: 'Usuario'
                    ],
                    'fecha_creacion' => $row['fecha_creacion'],
                    'ingredientes' => $ingredientes
                ];
            }
            $stmt->close();
            
            echo json_encode([
                'success' => true,
                'favoritos' => $favoritos,
                'total' => count($favoritos)
            ]);
            break;
            
        case 'verificar':
            $usuario_id = getCurrentUserId();
            $receta_id = isset($_GET['receta_id']) ? (int)$_GET['receta_id'] : 0;
            
            if (!$usuario_id || !$receta_id) {
                echo json_encode(['success' => false, 'message' => 'Usuario no autenticado o receta no válida']);
                exit;
            }
            
            $stmt = $conexion->prepare('SELECT id FROM favoritos WHERE usuario_id = ? AND receta_id = ?');
            $stmt->bind_param('ii', $usuario_id, $receta_id);
            $stmt->execute();
            $stmt->store_result();
            
            $esFavorito = $stmt->num_rows > 0;
            $stmt->close();
            
            echo json_encode([
                'success' => true,
                'es_favorito' => $esFavorito
            ]);
            break;
            
        // Mantener compatibilidad con acciones anteriores
        case 'agregar':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $usuario_id = isset($_POST['usuario_id']) ? (int)$_POST['usuario_id'] : 0;
                $receta_id = isset($_POST['receta_id']) ? (int)$_POST['receta_id'] : 0;
                
                if (!$usuario_id || !$receta_id) {
                    echo json_encode(['success' => false, 'message' => 'Faltan datos requeridos']);
                    exit;
                }
                
                // Verificar si ya existe
                $stmt = $conexion->prepare('SELECT id FROM favoritos WHERE usuario_id = ? AND receta_id = ?');
                $stmt->bind_param('ii', $usuario_id, $receta_id);
                $stmt->execute();
                $stmt->store_result();
                
                if ($stmt->num_rows > 0) {
                    echo json_encode(['success' => false, 'message' => 'La receta ya está en favoritos']);
                    $stmt->close();
                    exit;
                }
                $stmt->close();
                
                // Agregar a favoritos
                $stmt = $conexion->prepare('INSERT INTO favoritos (usuario_id, receta_id) VALUES (?, ?)');
                $stmt->bind_param('ii', $usuario_id, $receta_id);
                
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Receta agregada a favoritos']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Error al agregar favorito']);
                }
                $stmt->close();
            }
            break;
            
        case 'quitar':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $usuario_id = isset($_POST['usuario_id']) ? (int)$_POST['usuario_id'] : 0;
                $receta_id = isset($_POST['receta_id']) ? (int)$_POST['receta_id'] : 0;
                
                if (!$usuario_id || !$receta_id) {
                    echo json_encode(['success' => false, 'message' => 'Faltan datos requeridos']);
                    exit;
                }
                
                $stmt = $conexion->prepare('DELETE FROM favoritos WHERE usuario_id = ? AND receta_id = ?');
                $stmt->bind_param('ii', $usuario_id, $receta_id);
                
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Receta quitada de favoritos']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Error al quitar favorito']);
                }
                $stmt->close();
            }
            break;
            
        case 'listar':
            $usuario_id = isset($_GET['usuario_id']) ? (int)$_GET['usuario_id'] : 0;
            
            if (!$usuario_id) {
                echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
                exit;
            }
            
            $sql = "SELECT r.*, c.nombre as categoria_nombre, c.color as categoria_color,
                           u.nombre as usuario_nombre
                    FROM favoritos f
                    INNER JOIN recetas r ON f.receta_id = r.id
                    LEFT JOIN categorias c ON r.tipo_comida = c.nombre
                    LEFT JOIN usuarios u ON r.creado_por = u.id
                    WHERE f.usuario_id = ? AND r.activo = 1
                    ORDER BY f.fecha_agregado DESC";
            
            $stmt = $conexion->prepare($sql);
            $stmt->bind_param('i', $usuario_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $favoritos = [];
            while ($row = $result->fetch_assoc()) {
                // Obtener ingredientes
                $stmt2 = $conexion->prepare("
                    SELECT ingrediente, cantidad, unidad
                    FROM recetas_ingredientes
                    WHERE receta_id = ?
                ");
                $stmt2->bind_param('i', $row['id']);
                $stmt2->execute();
                $ingredientes_result = $stmt2->get_result();
                
                $ingredientes = [];
                while ($ing = $ingredientes_result->fetch_assoc()) {
                    $ingredientes[] = [
                        'nombre' => $ing['ingrediente'],
                        'cantidad' => $ing['cantidad'],
                        'unidad' => $ing['unidad']
                    ];
                }
                $stmt2->close();
                
                $favoritos[] = [
                    'id' => $row['id'],
                    'titulo' => $row['nombre'],
                    'descripcion' => $row['descripcion'],
                    'instrucciones' => $row['instrucciones'],
                    'tiempo_preparacion' => $row['tiempo_preparacion'],
                    'dificultad' => $row['dificultad'],
                    'porciones' => $row['porciones'],
                    'categoria' => [
                        'nombre' => $row['categoria_nombre'] ?: $row['tipo_comida'],
                        'color' => $row['categoria_color'] ?: '#007bff'
                    ],
                    'usuario' => [
                        'id' => $row['creado_por'],
                        'nombre' => $row['usuario_nombre'] ?: 'Usuario'
                    ],
                    'fecha_creacion' => $row['fecha_creacion'],
                    'ingredientes' => $ingredientes
                ];
            }
            $stmt->close();
            
            echo json_encode([
                'success' => true,
                'favoritos' => $favoritos,
                'total' => count($favoritos)
            ]);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
            break;
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?> 