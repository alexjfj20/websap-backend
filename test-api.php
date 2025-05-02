<?php
// Script para probar la conectividad de la API
header('Content-Type: text/html; charset=utf-8');

// Configuración
$api_url = "https://websap-backend.onrender.com/api/public/menu";
$local_api_url = "https://allseo.xyz/api/public/menu"; // Cambiado a URL completa
$timeout = 10; // segundos

// Función para realizar solicitudes HTTP
function make_request($url, $timeout = 10) {
    $start_time = microtime(true);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json',
        'User-Agent: WebSAP API Test'
    ]);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);
    
    $time_taken = microtime(true) - $start_time;
    
    return [
        'status' => $http_code,
        'response' => $response,
        'error' => $error,
        'time' => $time_taken,
        'info' => $info
    ];
}

// Realizar las solicitudes
$remote_result = make_request($api_url, $timeout);
$local_result = make_request($local_api_url, $timeout);

// Mostrar resultados
echo "<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Prueba de API WebSAP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        h1, h2 { color: #333; }
        .card { border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin-bottom: 20px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        pre { background: #f5f5f5; padding: 10px; overflow: auto; }
    </style>
</head>
<body>
    <h1>Prueba de conectividad de API WebSAP</h1>
    
    <div class='card'>
        <h2>Información del servidor</h2>
        <p><strong>Nombre del servidor:</strong> " . $_SERVER['SERVER_NAME'] . "</p>
        <p><strong>Software del servidor:</strong> " . $_SERVER['SERVER_SOFTWARE'] . "</p>
        <p><strong>PHP Version:</strong> " . phpversion() . "</p>
    </div>
    
    <div class='card'>
        <h2>API remota: " . $api_url . "</h2>
        <p><strong>Estado: </strong> 
            " . ($remote_result['status'] >= 200 && $remote_result['status'] < 300 ? 
                "<span class='success'>✅ OK (" . $remote_result['status'] . ")</span>" : 
                "<span class='error'>❌ Error (" . $remote_result['status'] . ")</span>") . "
        </p>
        <p><strong>Tiempo de respuesta:</strong> " . round($remote_result['time'], 2) . " segundos</p>";

if ($remote_result['error']) {
    echo "<p class='error'><strong>Error:</strong> " . $remote_result['error'] . "</p>";
}

echo "<p><strong>Respuesta:</strong></p>
        <pre>" . htmlspecialchars(substr($remote_result['response'], 0, 1000)) . (strlen($remote_result['response']) > 1000 ? '...' : '') . "</pre>
    </div>
    
    <div class='card'>
        <h2>API local: " . $local_api_url . "</h2>
        <p><strong>Estado: </strong> 
            " . ($local_result['status'] >= 200 && $local_result['status'] < 300 ? 
                "<span class='success'>✅ OK (" . $local_result['status'] . ")</span>" : 
                "<span class='error'>❌ Error (" . $local_result['status'] . ")</span>") . "
        </p>
        <p><strong>Tiempo de respuesta:</strong> " . round($local_result['time'], 2) . " segundos</p>";

if ($local_result['error']) {
    echo "<p class='error'><strong>Error:</strong> " . $local_result['error'] . "</p>";
}

echo "<p><strong>Respuesta:</strong></p>
        <pre>" . htmlspecialchars(substr($local_result['response'], 0, 1000)) . (strlen($local_result['response']) > 1000 ? '...' : '') . "</pre>
    </div>
    
    <div class='card'>
        <h2>Recomendaciones</h2>
        <ul>";

if ($remote_result['status'] >= 200 && $remote_result['status'] < 300) {
    echo "<li class='success'>La API remota está funcionando correctamente.</li>";
} else {
    echo "<li class='error'>La API remota no está respondiendo correctamente. Verifica que el servidor backend esté en funcionamiento.</li>";
}

if ($local_result['status'] >= 200 && $local_result['status'] < 300) {
    echo "<li class='success'>La API local está funcionando correctamente.</li>";
} else {
    echo "<li class='error'>La API local no está respondiendo correctamente. Verifica la configuración de proxy en tu servidor web.</li>";
}

echo "
        </ul>
    </div>
</body>
</html>";
?>