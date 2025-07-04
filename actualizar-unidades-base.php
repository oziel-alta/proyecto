<?php
require_once 'php/conexion.php';

try {
    // Mapeo de categorías a unidades base
    $unidadesPorCategoria = [
        'vegetales' => 'unidades',
        'frutas' => 'unidades',
        'carnes' => 'gramos',
        'pescados' => 'gramos',
        'lacteos' => 'mililitros',
        'cereales' => 'gramos',
        'especias' => 'cucharaditas',
        'otros' => 'unidades',
        'embutidos' => 'gramos',
        'panaderia' => 'unidades',
        'bebidas' => 'mililitros',
        'salsas' => 'mililitros',
        'mariscos' => 'gramos',
        'semillas' => 'gramos',
        'aceites' => 'mililitros',
        'frutos_secos' => 'gramos',
        'dulces' => 'unidades',
        'conservas' => 'unidades'
    ];
    
    // Obtener todos los ingredientes que no tienen unidad_base o la tienen vacía
    $sql = "SELECT id, nombre, categoria, unidad_base FROM ingredientes WHERE unidad_base IS NULL OR unidad_base = ''";
    $resultado = $conexion->query($sql);
    
    if (!$resultado) {
        throw new Exception("Error al consultar ingredientes: " . $conexion->error);
    }
    
    $ingredientes = [];
    while ($row = $resultado->fetch_assoc()) {
        $ingredientes[] = $row;
    }
    
    echo "=== ACTUALIZACIÓN DE UNIDADES BASE ===\n";
    echo "Ingredientes encontrados sin unidad base: " . count($ingredientes) . "\n\n";
    
    $actualizados = 0;
    $errores = 0;
    
    foreach ($ingredientes as $ingrediente) {
        $id = $ingrediente['id'];
        $nombre = $ingrediente['nombre'];
        $categoria = $ingrediente['categoria'];
        
        // Determinar unidad base según categoría
        $unidadBase = $unidadesPorCategoria[$categoria] ?? 'unidades';
        
        echo "Procesando: {$nombre} (ID: {$id})\n";
        echo "  Categoría: {$categoria}\n";
        echo "  Unidad base asignada: {$unidadBase}\n";
        
        // Actualizar el ingrediente
        $updateSql = "UPDATE ingredientes SET unidad_base = ? WHERE id = ?";
        $stmt = $conexion->prepare($updateSql);
        
        if ($stmt) {
            $stmt->bind_param("si", $unidadBase, $id);
            if ($stmt->execute()) {
                echo "  ✅ Actualizado correctamente\n";
                $actualizados++;
            } else {
                echo "  ❌ Error al actualizar: " . $stmt->error . "\n";
                $errores++;
            }
            $stmt->close();
        } else {
            echo "  ❌ Error al preparar consulta: " . $conexion->error . "\n";
            $errores++;
        }
        echo "\n";
    }
    
    // Mostrar resumen
    echo "=== RESUMEN ===\n";
    echo "Total de ingredientes procesados: " . count($ingredientes) . "\n";
    echo "Actualizados correctamente: {$actualizados}\n";
    echo "Errores: {$errores}\n";
    
    // Verificar ingredientes que aún no tienen unidad base
    $sqlVerificar = "SELECT COUNT(*) as total FROM ingredientes WHERE unidad_base IS NULL OR unidad_base = ''";
    $resultadoVerificar = $conexion->query($sqlVerificar);
    $rowVerificar = $resultadoVerificar->fetch_assoc();
    
    echo "Ingredientes sin unidad base restantes: " . $rowVerificar['total'] . "\n";
    
    // Mostrar todos los ingredientes con sus unidades base
    echo "\n=== LISTADO COMPLETO DE INGREDIENTES ===\n";
    $sqlCompleto = "SELECT id, nombre, categoria, unidad_base FROM ingredientes ORDER BY nombre";
    $resultadoCompleto = $conexion->query($sqlCompleto);
    
    while ($ingrediente = $resultadoCompleto->fetch_assoc()) {
        $unidad = $ingrediente['unidad_base'] ?: 'SIN UNIDAD';
        echo "ID: {$ingrediente['id']} | {$ingrediente['nombre']} | {$ingrediente['categoria']} | {$unidad}\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

$conexion->close();
?>
