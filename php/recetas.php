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

$action = isset($_POST['action']) ? $_POST['action'] : (isset($_GET['action']) ? $_GET['action'] : '');

// Log de debug
error_log("Recetas.php - Action: $action, Method: " . $_SERVER['REQUEST_METHOD']);

error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    switch ($action) {
        case 'create':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Obtener el usuario autenticado
                $usuario_id = getCurrentUserId();
                
                if (!$usuario_id) {
                    echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
                    exit;
                }
                
                $nombre = isset($_POST['nombre']) ? trim($_POST['nombre']) : '';
                $descripcion = isset($_POST['descripcion']) ? trim($_POST['descripcion']) : '';
                $categoria_id = isset($_POST['categoria_id']) ? (int)$_POST['categoria_id'] : 0;
                $tiempo = isset($_POST['tiempo']) ? (int)$_POST['tiempo'] : 0;
                $porciones = isset($_POST['porciones']) ? (int)$_POST['porciones'] : 4;
                $dificultad = isset($_POST['dificultad']) ? trim($_POST['dificultad']) : 'Fácil';
                $ingredientes = isset($_POST['ingredientes']) ? json_decode($_POST['ingredientes'], true) : [];
                $pasos = isset($_POST['pasos']) ? json_decode($_POST['pasos'], true) : [];
                
                // Validaciones
                if (empty($nombre)) {
                    echo json_encode(['success' => false, 'message' => 'El nombre es requerido']);
                    exit;
                }
                
                if (empty($descripcion)) {
                    echo json_encode(['success' => false, 'message' => 'La descripción es requerida']);
                    exit;
                }
                
                if (!$categoria_id) {
                    echo json_encode(['success' => false, 'message' => 'La categoría es requerida']);
                    exit;
                }
                
                if (empty($ingredientes)) {
                    echo json_encode(['success' => false, 'message' => 'Debe agregar al menos un ingrediente']);
                    exit;
                }
                
                if (empty($pasos)) {
                    echo json_encode(['success' => false, 'message' => 'Debe agregar al menos un paso de preparación']);
                    exit;
                }
                
                // Obtener el nombre de la categoría
                $stmt = $conexion->prepare('SELECT nombre FROM categorias WHERE id = ?');
                $stmt->bind_param('i', $categoria_id);
                $stmt->execute();
                $result = $stmt->get_result();
                $categoria = $result->fetch_assoc();
                $stmt->close();
                
                if (!$categoria) {
                    echo json_encode(['success' => false, 'message' => 'Categoría no válida']);
                    exit;
                }
                
                // Convertir pasos a instrucciones
                $instrucciones = '';
                foreach ($pasos as $paso) {
                    $instrucciones .= $paso['numero'] . '. ' . $paso['descripcion'] . "\n\n";
                }
                $instrucciones = trim($instrucciones);
                
                // Iniciar transacción
                $conexion->begin_transaction();
                
                try {
                    // Insertar receta
                    $stmt = $conexion->prepare('INSERT INTO recetas (nombre, descripcion, instrucciones, tiempo_preparacion, dificultad, porciones, tipo_comida, creado_por) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                    $stmt->bind_param('sssisssi', $nombre, $descripcion, $instrucciones, $tiempo, $dificultad, $porciones, $categoria['nombre'], $usuario_id);
                    
                    if (!$stmt->execute()) {
                        throw new Exception('Error al crear la receta');
                    }
                    
                    $receta_id = $conexion->insert_id;
                    $stmt->close();
                    
                    // Insertar ingredientes
                    $stmt = $conexion->prepare('INSERT INTO recetas_ingredientes (receta_id, ingrediente, cantidad, unidad) VALUES (?, ?, ?, ?)');
                    
                    foreach ($ingredientes as $ingrediente) {
                        // Obtener el nombre del ingrediente por ID
                        $ingrediente_id = $ingrediente['ingrediente_id'];
                        $stmt_ing = $conexion->prepare('SELECT nombre FROM ingredientes WHERE id = ?');
                        $stmt_ing->bind_param('i', $ingrediente_id);
                        $stmt_ing->execute();
                        $result_ing = $stmt_ing->get_result();
                        $ingrediente_nombre = $result_ing->fetch_assoc();
                        $stmt_ing->close();
                        
                        if ($ingrediente_nombre) {
                            $nombre_ing = $ingrediente_nombre['nombre'];
                            $cantidad = $ingrediente['cantidad'];
                            $unidad = $ingrediente['unidad'];
                            
                            $stmt->bind_param('issd', $receta_id, $nombre_ing, $cantidad, $unidad);
                            
                            if (!$stmt->execute()) {
                                throw new Exception('Error al agregar ingrediente: ' . $nombre_ing);
                            }
                        }
                    }
                    $stmt->close();
                    
                    // Confirmar transacción
                    $conexion->commit();
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Receta creada correctamente',
                        'receta_id' => $receta_id
                    ]);
                    
                } catch (Exception $e) {
                    // Revertir transacción en caso de error
                    $conexion->rollback();
                    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
                }
            }
            break;
            
        case 'crear':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $usuario_id = isset($_POST['usuario_id']) ? (int)$_POST['usuario_id'] : 0;
                if (!$usuario_id) {
                    echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
                    exit;
                }
                
                $titulo = isset($_POST['titulo']) ? trim($_POST['titulo']) : '';
                $descripcion = isset($_POST['descripcion']) ? trim($_POST['descripcion']) : '';
                $instrucciones = isset($_POST['instrucciones']) ? trim($_POST['instrucciones']) : '';
                $tiempo_preparacion = isset($_POST['tiempo_preparacion']) ? (int)$_POST['tiempo_preparacion'] : 0;
                $dificultad = isset($_POST['dificultad']) ? trim($_POST['dificultad']) : 'Fácil';
                $porciones = isset($_POST['porciones']) ? (int)$_POST['porciones'] : 1;
                $categoria = isset($_POST['categoria']) ? trim($_POST['categoria']) : '';
                $ingredientes = isset($_POST['ingredientes']) ? json_decode($_POST['ingredientes'], true) : [];
                
                if (empty($titulo)) {
                    echo json_encode(['success' => false, 'message' => 'El título es requerido']);
                    exit;
                }
                
                if (empty($instrucciones)) {
                    echo json_encode(['success' => false, 'message' => 'Las instrucciones son requeridas']);
                    exit;
                }
                
                if (empty($ingredientes)) {
                    echo json_encode(['success' => false, 'message' => 'Debe agregar al menos un ingrediente']);
                    exit;
                }
                
                // Iniciar transacción
                $conexion->begin_transaction();
                
                try {
                    // Insertar receta
                    $stmt = $conexion->prepare('INSERT INTO recetas (nombre, descripcion, instrucciones, tiempo_preparacion, dificultad, porciones, tipo_comida, creado_por) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                    $stmt->bind_param('sssisssi', $titulo, $descripcion, $instrucciones, $tiempo_preparacion, $dificultad, $porciones, $categoria, $usuario_id);
                    
                    if (!$stmt->execute()) {
                        throw new Exception('Error al crear la receta');
                    }
                    
                    $receta_id = $conexion->insert_id;
                    $stmt->close();
                    
                    // Insertar ingredientes
                    $stmt = $conexion->prepare('INSERT INTO recetas_ingredientes (receta_id, ingrediente, cantidad, unidad) VALUES (?, ?, ?, ?)');
                    
                    foreach ($ingredientes as $ingrediente) {
                        $nombre = $ingrediente['nombre'];
                        $cantidad = $ingrediente['cantidad'];
                        $unidad = $ingrediente['unidad'];
                        
                        $stmt->bind_param('issd', $receta_id, $nombre, $cantidad, $unidad);
                        
                        if (!$stmt->execute()) {
                            throw new Exception('Error al agregar ingrediente: ' . $nombre);
                        }
                    }
                    $stmt->close();
                    
                    // Confirmar transacción
                    $conexion->commit();
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Receta creada correctamente',
                        'receta_id' => $receta_id
                    ]);
                    
                } catch (Exception $e) {
                    // Revertir transacción en caso de error
                    $conexion->rollback();
                    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
                }
            }
            break;
            
        case 'obtener':
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            
            if (!$id) {
                echo json_encode(['success' => false, 'message' => 'ID requerido']);
                exit;
            }
            
            // Obtener receta
            $sql = "SELECT r.*, c.nombre as categoria_nombre, c.color as categoria_color,
                           u.nombre as usuario_nombre
                    FROM recetas r
                    LEFT JOIN categorias c ON r.tipo_comida = c.nombre
                    LEFT JOIN usuarios u ON r.creado_por = u.id
                    WHERE r.id = ?";
            
            $stmt = $conexion->prepare($sql);
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                // Obtener ingredientes
                $stmt2 = $conexion->prepare("
                    SELECT ri.ingrediente, ri.cantidad, ri.unidad, i.id as ingrediente_id
                    FROM recetas_ingredientes ri
                    LEFT JOIN ingredientes i ON ri.ingrediente = i.nombre
                    WHERE ri.receta_id = ?
                ");
                $stmt2->bind_param('i', $id);
                $stmt2->execute();
                $ingredientes_result = $stmt2->get_result();
                
                $ingredientes = [];
                while ($ing = $ingredientes_result->fetch_assoc()) {
                    $ingredientes[] = [
                        'nombre' => $ing['ingrediente'],
                        'cantidad' => $ing['cantidad'],
                        'unidad' => $ing['unidad'],
                        'ingrediente_id' => $ing['ingrediente_id']
                    ];
                }
                $stmt2->close();
                
                $receta = [
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
                
                echo json_encode(['success' => true, 'receta' => $receta]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Receta no encontrada']);
            }
            $stmt->close();
            break;
            
        case 'mis_recetas':
            // Obtener el usuario autenticado
            $usuario_id = getCurrentUserId();
            
            if (!$usuario_id) {
                echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
                exit;
            }
            
            $sql = "SELECT r.*, c.nombre as categoria_nombre, c.color as categoria_color
                    FROM recetas r
                    LEFT JOIN categorias c ON r.tipo_comida = c.nombre
                    WHERE r.creado_por = ?
                    ORDER BY r.fecha_creacion DESC";
            
            $stmt = $conexion->prepare($sql);
            $stmt->bind_param('i', $usuario_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $recetas = [];
            while ($row = $result->fetch_assoc()) {
                $recetas[] = [
                    'id' => $row['id'],
                    'titulo' => $row['nombre'],
                    'descripcion' => $row['descripcion'],
                    'tiempo_preparacion' => $row['tiempo_preparacion'],
                    'dificultad' => $row['dificultad'],
                    'porciones' => $row['porciones'],
                    'categoria' => [
                        'nombre' => $row['categoria_nombre'] ?: $row['tipo_comida'],
                        'color' => $row['categoria_color'] ?: '#007bff'
                    ],
                    'fecha_creacion' => $row['fecha_creacion']
                ];
            }
            $stmt->close();
            
            echo json_encode([
                'success' => true,
                'recetas' => $recetas,
                'total' => count($recetas)
            ]);
            break;
            
        case 'editar':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $usuario_id = isset($_POST['usuario_id']) ? (int)$_POST['usuario_id'] : 0;
                $receta_id = isset($_POST['receta_id']) ? (int)$_POST['receta_id'] : 0;
                
                if (!$usuario_id || !$receta_id) {
                    echo json_encode(['success' => false, 'message' => 'Usuario no autenticado o ID de receta requerido']);
                    exit;
                }
                
                // Verificar que el usuario sea el creador de la receta
                $stmt = $conexion->prepare('SELECT creado_por FROM recetas WHERE id = ?');
                $stmt->bind_param('i', $receta_id);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($row = $result->fetch_assoc()) {
                    if ($row['creado_por'] != $usuario_id) {
                        echo json_encode(['success' => false, 'message' => 'No tienes permisos para editar esta receta']);
                        exit;
                    }
                } else {
                    echo json_encode(['success' => false, 'message' => 'Receta no encontrada']);
                    exit;
                }
                $stmt->close();
                
                $titulo = isset($_POST['titulo']) ? trim($_POST['titulo']) : '';
                $descripcion = isset($_POST['descripcion']) ? trim($_POST['descripcion']) : '';
                $instrucciones = isset($_POST['instrucciones']) ? trim($_POST['instrucciones']) : '';
                $tiempo_preparacion = isset($_POST['tiempo_preparacion']) ? (int)$_POST['tiempo_preparacion'] : 0;
                $dificultad = isset($_POST['dificultad']) ? trim($_POST['dificultad']) : 'Fácil';
                $porciones = isset($_POST['porciones']) ? (int)$_POST['porciones'] : 1;
                $categoria = isset($_POST['categoria']) ? trim($_POST['categoria']) : '';
                $ingredientes = isset($_POST['ingredientes']) ? json_decode($_POST['ingredientes'], true) : [];
                
                if (empty($titulo)) {
                    echo json_encode(['success' => false, 'message' => 'El título es requerido']);
                    exit;
                }
                
                if (empty($instrucciones)) {
                    echo json_encode(['success' => false, 'message' => 'Las instrucciones son requeridas']);
                    exit;
                }
                
                if (empty($ingredientes)) {
                    echo json_encode(['success' => false, 'message' => 'Debe agregar al menos un ingrediente']);
                    exit;
                }
                
                // Iniciar transacción
                $conexion->begin_transaction();
                
                try {
                    // Actualizar receta
                    $stmt = $conexion->prepare('UPDATE recetas SET nombre = ?, descripcion = ?, instrucciones = ?, tiempo_preparacion = ?, dificultad = ?, porciones = ?, tipo_comida = ?, fecha_modificacion = NOW() WHERE id = ?');
                    $stmt->bind_param('sssisssi', $titulo, $descripcion, $instrucciones, $tiempo_preparacion, $dificultad, $porciones, $categoria, $receta_id);
                    
                    if (!$stmt->execute()) {
                        throw new Exception('Error al actualizar la receta');
                    }
                    $stmt->close();
                    
                    // Eliminar ingredientes existentes
                    $stmt = $conexion->prepare('DELETE FROM recetas_ingredientes WHERE receta_id = ?');
                    $stmt->bind_param('i', $receta_id);
                    $stmt->execute();
                    $stmt->close();
                    
                    // Insertar nuevos ingredientes
                    $stmt = $conexion->prepare('INSERT INTO recetas_ingredientes (receta_id, ingrediente, cantidad, unidad) VALUES (?, ?, ?, ?)');
                    
                    foreach ($ingredientes as $ingrediente) {
                        $nombre = $ingrediente['nombre'];
                        $cantidad = $ingrediente['cantidad'];
                        $unidad = $ingrediente['unidad'];
                        
                        $stmt->bind_param('issd', $receta_id, $nombre, $cantidad, $unidad);
                        
                        if (!$stmt->execute()) {
                            throw new Exception('Error al agregar ingrediente: ' . $nombre);
                        }
                    }
                    $stmt->close();
                    
                    // Confirmar transacción
                    $conexion->commit();
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Receta actualizada correctamente'
                    ]);
                    
                } catch (Exception $e) {
                    // Revertir transacción en caso de error
                    $conexion->rollback();
                    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
                }
            }
            break;
            
        case 'update':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Obtener el usuario autenticado
                $usuario_id = getCurrentUserId();
                $receta_id = isset($_POST['receta_id']) ? (int)$_POST['receta_id'] : 0;
                
                if (!$usuario_id || !$receta_id) {
                    echo json_encode(['success' => false, 'message' => 'Usuario no autenticado o ID de receta requerido']);
                    exit;
                }
                
                // Verificar que el usuario sea el creador de la receta
                $stmt = $conexion->prepare('SELECT creado_por FROM recetas WHERE id = ?');
                $stmt->bind_param('i', $receta_id);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($row = $result->fetch_assoc()) {
                    if ($row['creado_por'] != $usuario_id) {
                        echo json_encode(['success' => false, 'message' => 'No tienes permisos para editar esta receta']);
                        exit;
                    }
                } else {
                    echo json_encode(['success' => false, 'message' => 'Receta no encontrada']);
                    exit;
                }
                $stmt->close();
                
                $nombre = isset($_POST['nombre']) ? trim($_POST['nombre']) : '';
                $descripcion = isset($_POST['descripcion']) ? trim($_POST['descripcion']) : '';
                $categoria_id = isset($_POST['categoria_id']) ? (int)$_POST['categoria_id'] : 0;
                $tiempo = isset($_POST['tiempo']) ? (int)$_POST['tiempo'] : 0;
                $porciones = isset($_POST['porciones']) ? (int)$_POST['porciones'] : 4;
                $dificultad = isset($_POST['dificultad']) ? trim($_POST['dificultad']) : 'Fácil';
                $ingredientes = isset($_POST['ingredientes']) ? json_decode($_POST['ingredientes'], true) : [];
                $pasos = isset($_POST['pasos']) ? json_decode($_POST['pasos'], true) : [];
                
                // Validaciones
                if (empty($nombre)) {
                    echo json_encode(['success' => false, 'message' => 'El nombre es requerido']);
                    exit;
                }
                
                if (empty($descripcion)) {
                    echo json_encode(['success' => false, 'message' => 'La descripción es requerida']);
                    exit;
                }
                
                if (!$categoria_id) {
                    echo json_encode(['success' => false, 'message' => 'La categoría es requerida']);
                    exit;
                }
                
                if (empty($ingredientes)) {
                    echo json_encode(['success' => false, 'message' => 'Debe agregar al menos un ingrediente']);
                    exit;
                }
                
                if (empty($pasos)) {
                    echo json_encode(['success' => false, 'message' => 'Debe agregar al menos un paso de preparación']);
                    exit;
                }
                
                // Obtener el nombre de la categoría
                $stmt = $conexion->prepare('SELECT nombre FROM categorias WHERE id = ?');
                $stmt->bind_param('i', $categoria_id);
                $stmt->execute();
                $result = $stmt->get_result();
                $categoria = $result->fetch_assoc();
                $stmt->close();
                
                if (!$categoria) {
                    echo json_encode(['success' => false, 'message' => 'Categoría no válida']);
                    exit;
                }
                
                // Convertir pasos a instrucciones
                $instrucciones = '';
                foreach ($pasos as $paso) {
                    $instrucciones .= $paso['numero'] . '. ' . $paso['descripcion'] . "\n\n";
                }
                $instrucciones = trim($instrucciones);
                
                // Iniciar transacción
                $conexion->begin_transaction();
                
                try {
                    // Actualizar receta
                    $stmt = $conexion->prepare('UPDATE recetas SET nombre = ?, descripcion = ?, instrucciones = ?, tiempo_preparacion = ?, dificultad = ?, porciones = ?, tipo_comida = ?, fecha_modificacion = NOW() WHERE id = ?');
                    $stmt->bind_param('sssisssi', $nombre, $descripcion, $instrucciones, $tiempo, $dificultad, $porciones, $categoria['nombre'], $receta_id);
                    
                    if (!$stmt->execute()) {
                        throw new Exception('Error al actualizar la receta');
                    }
                    $stmt->close();
                    
                    // Eliminar ingredientes existentes
                    $stmt = $conexion->prepare('DELETE FROM recetas_ingredientes WHERE receta_id = ?');
                    $stmt->bind_param('i', $receta_id);
                    $stmt->execute();
                    $stmt->close();
                    
                    // Insertar nuevos ingredientes
                    $stmt = $conexion->prepare('INSERT INTO recetas_ingredientes (receta_id, ingrediente, cantidad, unidad) VALUES (?, ?, ?, ?)');
                    
                    foreach ($ingredientes as $ingrediente) {
                        // Obtener el nombre del ingrediente por ID
                        $ingrediente_id = $ingrediente['ingrediente_id'];
                        $stmt_ing = $conexion->prepare('SELECT nombre FROM ingredientes WHERE id = ?');
                        $stmt_ing->bind_param('i', $ingrediente_id);
                        $stmt_ing->execute();
                        $result_ing = $stmt_ing->get_result();
                        $ingrediente_nombre = $result_ing->fetch_assoc();
                        $stmt_ing->close();
                        
                        if ($ingrediente_nombre) {
                            $nombre_ing = $ingrediente_nombre['nombre'];
                            $cantidad = $ingrediente['cantidad'];
                            $unidad = $ingrediente['unidad'];
                            
                            $stmt->bind_param('issd', $receta_id, $nombre_ing, $cantidad, $unidad);
                            
                            if (!$stmt->execute()) {
                                throw new Exception('Error al agregar ingrediente: ' . $nombre_ing);
                            }
                        }
                    }
                    $stmt->close();
                    
                    // Confirmar transacción
                    $conexion->commit();
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Receta actualizada correctamente'
                    ]);
                    
                } catch (Exception $e) {
                    // Revertir transacción en caso de error
                    $conexion->rollback();
                    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
                }
            }
            break;
            
        case 'eliminar':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Obtener el usuario autenticado
                $usuario_id = getCurrentUserId();
                $receta_id = isset($_POST['receta_id']) ? (int)$_POST['receta_id'] : 0;
                
                if (!$usuario_id || !$receta_id) {
                    echo json_encode(['success' => false, 'message' => 'Usuario no autenticado o ID de receta requerido']);
                    exit;
                }
                
                // Verificar que el usuario sea el creador de la receta
                $stmt = $conexion->prepare('SELECT creado_por FROM recetas WHERE id = ?');
                $stmt->bind_param('i', $receta_id);
                $stmt->execute();
                $result = $stmt->get_result();
                
                if ($row = $result->fetch_assoc()) {
                    if ($row['creado_por'] != $usuario_id) {
                        echo json_encode(['success' => false, 'message' => 'No tienes permisos para eliminar esta receta']);
                        exit;
                    }
                } else {
                    echo json_encode(['success' => false, 'message' => 'Receta no encontrada']);
                    exit;
                }
                $stmt->close();
                
                // Iniciar transacción
                $conexion->begin_transaction();
                
                try {
                    // Eliminar ingredientes de la receta
                    $stmt = $conexion->prepare('DELETE FROM recetas_ingredientes WHERE receta_id = ?');
                    $stmt->bind_param('i', $receta_id);
                    $stmt->execute();
                    $stmt->close();
                    
                    // Eliminar favoritos de la receta
                    $stmt = $conexion->prepare('DELETE FROM favoritos WHERE receta_id = ?');
                    $stmt->bind_param('i', $receta_id);
                    $stmt->execute();
                    $stmt->close();
                    
                    // Eliminar la receta (eliminación física)
                    $stmt = $conexion->prepare('DELETE FROM recetas WHERE id = ?');
                    $stmt->bind_param('i', $receta_id);
                    
                    if (!$stmt->execute()) {
                        throw new Exception('Error al eliminar la receta');
                    }
                    $stmt->close();
                    
                    // Confirmar transacción
                    $conexion->commit();
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Receta eliminada correctamente'
                    ]);
                    
                } catch (Exception $e) {
                    // Revertir transacción en caso de error
                    $conexion->rollback();
                    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
                }
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