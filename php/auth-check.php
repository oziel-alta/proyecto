<?php
// auth-check.php - Verificar autenticación del usuario

function getCurrentUserId() {
    session_start();
    return isset($_SESSION['usuario_id']) ? (int)$_SESSION['usuario_id'] : 0;
}

function getCurrentUserName() {
    session_start();
    return isset($_SESSION['usuario_nombre']) ? $_SESSION['usuario_nombre'] : '';
}

function isAuthenticated() {
    return getCurrentUserId() > 0;
}

function requireAuth() {
    if (!isAuthenticated()) {
        echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
        exit;
    }
}
?> 