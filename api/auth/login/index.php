<?php
// Simula la API de autenticación con datos de ejemplo
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

// Usuarios simulados para pruebas
$users = [
    [
        "id" => 1,
        "username" => "admin",
        "password" => "admin123",
        "name" => "Administrador",
        "role" => "admin",
        "email" => "admin@example.com"
    ],
    [
        "id" => 2,
        "username" => "empleado",
        "password" => "empleado123",
        "name" => "Empleado Demo",
        "role" => "employee",
        "email" => "empleado@example.com"
    ],
    [
        "id" => 3,
        "username" => "usuario",
        "password" => "usuario123",
        "name" => "Usuario Regular",
        "role" => "user",
        "email" => "usuario@example.com"
    ]
];

// Función para buscar un usuario
function find_user($username, $password, $users) {
    foreach ($users as $user) {
        if ($user['username'] === $username && $user['password'] === $password) {
            // No devolver la contraseña
            unset($user['password']);
            return $user;
        }
    }
    return null;
}

// Si no hay datos o falta username/password
if (!$data || !isset($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Usuario y contraseña son requeridos",
        "_debug" => [
            "received_data" => $data,
            "timestamp" => date("Y-m-d H:i:s")
        ]
    ]);
    exit;
}

// Intentar autenticar
$user = find_user($data['username'], $data['password'], $users);

if ($user) {
    // Éxito - Usuario encontrado
    echo json_encode([
        "success" => true,
        "message" => "Login exitoso",
        "user" => $user,
        "token" => "simulated-jwt-token-" . time(),
        "_debug" => [
            "timestamp" => date("Y-m-d H:i:s"),
            "source" => "local_php_api_simulator"
        ]
    ]);
} else {
    // Error - Usuario no encontrado o contraseña incorrecta
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "error" => "Credenciales inválidas",
        "_debug" => [
            "timestamp" => date("Y-m-d H:i:s"),
            "source" => "local_php_api_simulator",
            "attempted_username" => $data['username']
        ]
    ]);
}
?>