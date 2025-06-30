<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include 'conexion.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Log de depuración
error_log("Ingredientes.php - Action: $action, Method: " . $_SERVER['REQUEST_METHOD']);

try {
    switch ($action) {
        case 'listar':
            $sql = "SELECT * FROM ingredientes ORDER BY nombre";
            $result = $conexion->query($sql);
            
            if (!$result) {
                throw new Exception("Error en consulta: " . $conexion->error);
            }
            
            $ingredientes = [];
            while ($row = $result->fetch_assoc()) {
                $ingredientes[] = $row;
            }
            
            echo json_encode([
                'success' => true,
                'ingredientes' => $ingredientes
            ]);
            break;
            
        case 'crear':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                error_log("Creando ingrediente - POST data: " . print_r($_POST, true));
                
                $nombre = isset($_POST['nombre']) ? trim($_POST['nombre']) : '';
                $descripcion = isset($_POST['descripcion']) ? trim($_POST['descripcion']) : '';
                $categoria = isset($_POST['categoria']) ? trim($_POST['categoria']) : '';
                $unidad_base = isset($_POST['unidad_base']) ? trim($_POST['unidad_base']) : '';
                
                error_log("Datos procesados: nombre=$nombre, descripcion=$descripcion, categoria=$categoria, unidad_base=$unidad_base");
                
                if (empty($nombre)) {
                    echo json_encode(['success' => false, 'message' => 'El nombre es requerido']);
                    exit;
                }
                
                // Verificar si ya existe
                $stmt = $conexion->prepare('SELECT id FROM ingredientes WHERE nombre = ?');
                if (!$stmt) {
                    throw new Exception("Error preparando consulta: " . $conexion->error);
                }
                
                $stmt->bind_param('s', $nombre);
                $stmt->execute();
                $stmt->store_result();
                
                if ($stmt->num_rows > 0) {
                    echo json_encode(['success' => false, 'message' => 'Ya existe un ingrediente con ese nombre']);
                    $stmt->close();
                    exit;
                }
                $stmt->close();
                
                // Crear ingrediente
                $stmt = $conexion->prepare('INSERT INTO ingredientes (nombre, descripcion, categoria, unidad_base) VALUES (?, ?, ?, ?)');
                if (!$stmt) {
                    throw new Exception("Error preparando inserción: " . $conexion->error);
                }
                
                $stmt->bind_param('ssss', $nombre, $descripcion, $categoria, $unidad_base);
                
                if ($stmt->execute()) {
                    $id = $conexion->insert_id;
                    error_log("Ingrediente creado exitosamente con ID: $id");
                    echo json_encode([
                        'success' => true,
                        'message' => 'Ingrediente creado correctamente',
                        'id' => $id
                    ]);
                } else {
                    throw new Exception("Error al ejecutar inserción: " . $stmt->error);
                }
                $stmt->close();
            } else {
                echo json_encode(['success' => false, 'message' => 'Método no permitido']);
            }
            break;
            
        case 'editar':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
                $nombre = isset($_POST['nombre']) ? trim($_POST['nombre']) : '';
                $descripcion = isset($_POST['descripcion']) ? trim($_POST['descripcion']) : '';
                $categoria = isset($_POST['categoria']) ? trim($_POST['categoria']) : '';
                $unidad_base = isset($_POST['unidad_base']) ? trim($_POST['unidad_base']) : '';
                
                if (!$id || empty($nombre)) {
                    echo json_encode(['success' => false, 'message' => 'ID y nombre son requeridos']);
                    exit;
                }
                
                // Verificar si ya existe otro con el mismo nombre
                $stmt = $conexion->prepare('SELECT id FROM ingredientes WHERE nombre = ? AND id != ?');
                $stmt->bind_param('si', $nombre, $id);
                $stmt->execute();
                $stmt->store_result();
                
                if ($stmt->num_rows > 0) {
                    echo json_encode(['success' => false, 'message' => 'Ya existe un ingrediente con ese nombre']);
                    $stmt->close();
                    exit;
                }
                $stmt->close();
                
                // Actualizar ingrediente
                $stmt = $conexion->prepare('UPDATE ingredientes SET nombre = ?, descripcion = ?, categoria = ?, unidad_base = ? WHERE id = ?');
                $stmt->bind_param('ssssi', $nombre, $descripcion, $categoria, $unidad_base, $id);
                
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Ingrediente actualizado correctamente']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Error al actualizar ingrediente']);
                }
                $stmt->close();
            }
            break;
            
        case 'eliminar':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
                
                if (!$id) {
                    echo json_encode(['success' => false, 'message' => 'ID requerido']);
                    exit;
                }
                
                // Verificar si hay recetas usando este ingrediente
                if ($conexion->query("SHOW TABLES LIKE 'recetas_ingredientes'")->num_rows > 0) {
                    $stmt = $conexion->prepare('SELECT COUNT(*) as total FROM recetas_ingredientes WHERE ingrediente = (SELECT nombre FROM ingredientes WHERE id = ?)');
                    $stmt->bind_param('i', $id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $row = $result->fetch_assoc();
                    $stmt->close();
                    
                    if ($row['total'] > 0) {
                        echo json_encode(['success' => false, 'message' => 'No se puede eliminar: hay recetas usando este ingrediente']);
                        exit;
                    }
                }
                
                // Eliminar ingrediente físicamente
                $stmt = $conexion->prepare('DELETE FROM ingredientes WHERE id = ?');
                $stmt->bind_param('i', $id);
                
                if ($stmt->execute()) {
                    if ($stmt->affected_rows > 0) {
                        echo json_encode(['success' => true, 'message' => 'Ingrediente eliminado correctamente']);
                    } else {
                        echo json_encode(['success' => false, 'message' => 'Ingrediente no encontrado']);
                    }
                } else {
                    echo json_encode(['success' => false, 'message' => 'Error al eliminar ingrediente']);
                }
                $stmt->close();
            }
            break;
            
        case 'obtener':
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            
            if (!$id) {
                echo json_encode(['success' => false, 'message' => 'ID requerido']);
                exit;
            }
            
            $stmt = $conexion->prepare('SELECT * FROM ingredientes WHERE id = ?');
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                echo json_encode(['success' => true, 'ingrediente' => $row]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Ingrediente no encontrado']);
            }
            $stmt->close();
            break;
            
        case 'buscar':
            $termino = isset($_GET['termino']) ? trim($_GET['termino']) : '';
            
            if (empty($termino)) {
                echo json_encode(['success' => false, 'message' => 'Término de búsqueda requerido']);
                exit;
            }
            
            $sql = "SELECT * FROM ingredientes WHERE nombre LIKE ? ORDER BY nombre LIMIT 10";
            $stmt = $conexion->prepare($sql);
            $terminoBusqueda = "%$termino%";
            $stmt->bind_param('s', $terminoBusqueda);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $ingredientes = [];
            while ($row = $result->fetch_assoc()) {
                $ingredientes[] = $row;
            }
            $stmt->close();
            
            echo json_encode([
                'success' => true,
                'ingredientes' => $ingredientes
            ]);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Acción no válida']);
            break;
    }
    
} catch (Exception $e) {
    error_log("Error en ingredientes.php: " . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => 'Error interno del servidor: ' . $e->getMessage()
    ]);
}

$conexion->close();
?> 