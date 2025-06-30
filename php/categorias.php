<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include 'conexion.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($action) {
        case 'listar':
            // Verificar si existe el campo activo
            $stmt = $conexion->prepare("SHOW COLUMNS FROM categorias LIKE 'activo'");
            $stmt->execute();
            $result_check = $stmt->get_result();
            $stmt->close();
            
            if ($result_check->num_rows > 0) {
                // Usar filtro de activo
                $sql = "SELECT * FROM categorias WHERE activo = 1 ORDER BY nombre";
            } else {
                // Sin filtro de activo
                $sql = "SELECT * FROM categorias ORDER BY nombre";
            }
            
            $result = $conexion->query($sql);
            
            $categorias = [];
            while ($row = $result->fetch_assoc()) {
                $categorias[] = $row;
            }
            
            echo json_encode([
                'success' => true,
                'categorias' => $categorias
            ]);
            break;
            
        case 'crear':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $nombre = isset($_POST['nombre']) ? trim($_POST['nombre']) : '';
                $descripcion = isset($_POST['descripcion']) ? trim($_POST['descripcion']) : '';
                $color = isset($_POST['color']) ? trim($_POST['color']) : '#007bff';
                $icono = isset($_POST['icono']) ? trim($_POST['icono']) : '';
                
                if (empty($nombre)) {
                    echo json_encode(['success' => false, 'message' => 'El nombre es requerido']);
                    exit;
                }
                
                // Verificar si ya existe
                $stmt = $conexion->prepare('SELECT id FROM categorias WHERE nombre = ?');
                $stmt->bind_param('s', $nombre);
                $stmt->execute();
                $stmt->store_result();
                
                if ($stmt->num_rows > 0) {
                    echo json_encode(['success' => false, 'message' => 'Ya existe una categoría con ese nombre']);
                    $stmt->close();
                    exit;
                }
                $stmt->close();
                
                // Crear categoría
                $stmt = $conexion->prepare('INSERT INTO categorias (nombre, descripcion, color, icono) VALUES (?, ?, ?, ?)');
                $stmt->bind_param('ssss', $nombre, $descripcion, $color, $icono);
                
                if ($stmt->execute()) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Categoría creada correctamente',
                        'id' => $conexion->insert_id
                    ]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Error al crear categoría']);
                }
                $stmt->close();
            }
            break;
            
        case 'editar':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
                $nombre = isset($_POST['nombre']) ? trim($_POST['nombre']) : '';
                $descripcion = isset($_POST['descripcion']) ? trim($_POST['descripcion']) : '';
                $color = isset($_POST['color']) ? trim($_POST['color']) : '#007bff';
                $icono = isset($_POST['icono']) ? trim($_POST['icono']) : '';
                
                if (!$id || empty($nombre)) {
                    echo json_encode(['success' => false, 'message' => 'ID y nombre son requeridos']);
                    exit;
                }
                
                // Verificar si ya existe otro con el mismo nombre
                $stmt = $conexion->prepare('SELECT id FROM categorias WHERE nombre = ? AND id != ?');
                $stmt->bind_param('si', $nombre, $id);
                $stmt->execute();
                $stmt->store_result();
                
                if ($stmt->num_rows > 0) {
                    echo json_encode(['success' => false, 'message' => 'Ya existe una categoría con ese nombre']);
                    $stmt->close();
                    exit;
                }
                $stmt->close();
                
                // Actualizar categoría
                $stmt = $conexion->prepare('UPDATE categorias SET nombre = ?, descripcion = ?, color = ?, icono = ? WHERE id = ?');
                $stmt->bind_param('ssssi', $nombre, $descripcion, $color, $icono, $id);
                
                if ($stmt->execute()) {
                    echo json_encode(['success' => true, 'message' => 'Categoría actualizada correctamente']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Error al actualizar categoría']);
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
                
                // Verificar si la categoría existe
                $stmt = $conexion->prepare('SELECT id, nombre FROM categorias WHERE id = ?');
                $stmt->bind_param('i', $id);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($result->num_rows == 0) {
                    echo json_encode(['success' => false, 'message' => 'Categoría no encontrada']);
                    $stmt->close();
                    exit;
                }
                
                $categoria = $result->fetch_assoc();
                $stmt->close();
                
                // Verificar si hay recetas usando esta categoría
                $stmt = $conexion->prepare('SELECT COUNT(*) as total FROM recetas WHERE tipo_comida = ? AND activo = 1');
                $stmt->bind_param('s', $categoria['nombre']);
                $stmt->execute();
                $result = $stmt->get_result();
                $row = $result->fetch_assoc();
                $stmt->close();
                
                if ($row['total'] > 0) {
                    echo json_encode(['success' => false, 'message' => 'No se puede eliminar: hay ' . $row['total'] . ' recetas usando esta categoría']);
                    exit;
                }
                
                // Intentar eliminación directa primero
                $stmt = $conexion->prepare('DELETE FROM categorias WHERE id = ?');
                $stmt->bind_param('i', $id);
                
                if ($stmt->execute()) {
                    if ($stmt->affected_rows > 0) {
                        echo json_encode(['success' => true, 'message' => 'Categoría eliminada correctamente']);
                    } else {
                        echo json_encode(['success' => false, 'message' => 'No se pudo eliminar la categoría']);
                    }
                } else {
                    echo json_encode(['success' => false, 'message' => 'Error al eliminar categoría: ' . $stmt->error]);
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
            
            // Verificar si existe el campo activo
            $stmt = $conexion->prepare("SHOW COLUMNS FROM categorias LIKE 'activo'");
            $stmt->execute();
            $result_check = $stmt->get_result();
            $stmt->close();
            
            if ($result_check->num_rows > 0) {
                // Usar filtro de activo
                $stmt = $conexion->prepare('SELECT * FROM categorias WHERE id = ? AND activo = 1');
            } else {
                // Sin filtro de activo
                $stmt = $conexion->prepare('SELECT * FROM categorias WHERE id = ?');
            }
            
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                echo json_encode(['success' => true, 'categoria' => $row]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Categoría no encontrada']);
            }
            $stmt->close();
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