<?php
// Simula la API de menú con datos de ejemplo
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Si es una solicitud OPTIONS, devolver solo los encabezados CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Datos simulados del menú
$menu_items = [
    [
        "id" => 1,
        "nombre" => "Pizza Margarita",
        "descripcion" => "Pizza clásica con tomate y queso mozzarella",
        "precio" => 8.99,
        "categoria" => "Pizzas",
        "disponible" => true,
        "imagen" => "pizza-margarita.jpg"
    ],
    [
        "id" => 2,
        "nombre" => "Hamburguesa Clásica",
        "descripcion" => "Carne de res, lechuga, tomate y queso cheddar",
        "precio" => 7.50,
        "categoria" => "Hamburguesas",
        "disponible" => true,
        "imagen" => "hamburguesa-clasica.jpg"
    ],
    [
        "id" => 3,
        "nombre" => "Ensalada César",
        "descripcion" => "Lechuga romana, crutones, queso parmesano y aderezo César",
        "precio" => 6.25,
        "categoria" => "Ensaladas",
        "disponible" => true,
        "imagen" => "ensalada-cesar.jpg"
    ],
    [
        "id" => 4,
        "nombre" => "Pasta Carbonara",
        "descripcion" => "Espaguetis con salsa de huevo, queso, panceta y pimienta negra",
        "precio" => 9.75,
        "categoria" => "Pastas",
        "disponible" => true,
        "imagen" => "pasta-carbonara.jpg"
    ],
    [
        "id" => 5,
        "nombre" => "Sushi Mixto",
        "descripcion" => "Selección de 12 piezas de sushi variado",
        "precio" => 14.50,
        "categoria" => "Sushi",
        "disponible" => true,
        "imagen" => "sushi-mixto.jpg"
    ]
];

// Añadir información de debug
$response = [
    "items" => $menu_items,
    "_debug" => [
        "timestamp" => date("Y-m-d H:i:s"),
        "source" => "local_php_api_simulator",
        "server" => $_SERVER['SERVER_NAME'],
        "php_version" => phpversion()
    ]
];

// Devolver los datos como JSON
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>