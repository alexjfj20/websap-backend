<?php
// Simula la API de verificación de tokens
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Si es una solicitud OPTIONS, devolver solo los encabezados CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Obtener los datos de la solicitud
$request_body = file_get_contents('php://input');
$data = json_decode($request_body, true);

// Si no hay datos o falta el token
if (!$data || !isset($data['token'])) {
    http_response_code(400);
    echo json_encode([
        "valid" => false,
        "error" => "Token no proporcionado",
        "_debug" => [
            "timestamp" => date("Y-m-d H:i:s"),
            "source" => "local_php_api_simulator"
        ]
    ]);
    exit;
}

// Verificar si el token comienza con nuestro prefijo (simulación)
$token = $data['token'];
$is_valid = strpos($token, 'simulated-jwt-token-') === 0;

echo json_encode([
    "valid" => $is_valid,
    "_debug" => [
        "timestamp" => date("Y-m-d H:i:s"),
        "source" => "local_php_api_simulator",
        "token_prefix" => substr($token, 0, 19) . '...'
    ]
]);
?>