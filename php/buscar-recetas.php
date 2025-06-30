<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Habilitar reporte de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include 'conexion.php';

try {
    $nombre = isset($_GET['nombre']) ? trim($_GET['nombre']) : '';
    $ingrediente = isset($_GET['ingrediente']) ? trim($_GET['ingrediente']) : '';
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

    $sql = "SELECT DISTINCT r.*, c.nombre as categoria_nombre, c.color as categoria_color,
                   u.nombre as usuario_nombre
            FROM recetas r
            LEFT JOIN categorias c ON r.tipo_comida = c.nombre
            LEFT JOIN usuarios u ON r.creado_por = u.id
            WHERE 1=1";

    $params = [];
    $types = '';

    // Buscar por nombre de receta
    if (!empty($nombre)) {
        $sql .= " AND (r.nombre LIKE ? OR r.descripcion LIKE ?)";
        $searchTerm = "%$nombre%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= 'ss';
    }

    // Buscar por ingrediente
    if (!empty($ingrediente)) {
        $sql .= " AND EXISTS (
            SELECT 1 FROM recetas_ingredientes ri
            WHERE ri.receta_id = r.id AND ri.ingrediente LIKE ?
        )";
        $searchTerm = "%$ingrediente%";
        $params[] = $searchTerm;
        $types .= 's';
    }

    $sql .= " ORDER BY r.fecha_creacion DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    $types .= 'ii';

    $stmt = $conexion->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();

    $recetas = [];
    while ($row = $result->fetch_assoc()) {
        // Obtener ingredientes de la receta
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
            $unidad = ($ing['unidad'] === '0') ? '' : $ing['unidad'];
            $ingredientes[] = [
                'nombre' => $ing['ingrediente'],
                'cantidad' => $ing['cantidad'],
                'unidad' => $unidad
            ];
        }
        $stmt2->close();

        $recetas[] = [
            'id' => $row['id'],
            'titulo' => $row['nombre'],
            'descripcion' => $row['descripcion'],
            'instrucciones' => $row['instrucciones'],
            'tiempo_preparacion' => $row['tiempo_preparacion'],
            'dificultad' => $row['dificultad'],
            'porciones' => $row['porciones'],
            'imagen' => null, // Tu tabla no tiene campo imagen
            'categoria' => [
                'id' => null,
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
        'recetas' => $recetas,
        'total' => count($recetas)
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al buscar recetas: ' . $e->getMessage()
    ]);
}
?> 