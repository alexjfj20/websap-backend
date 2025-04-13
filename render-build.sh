#!/bin/bash

# Este script se ejecutará en Render y debe usar la sintaxis de Bash

echo "===== INICIO DEL SCRIPT DE RENDER ====="

# Crear directorio dist si no existe
mkdir -p dist

# Copiar archivos públicos al directorio dist
echo "Copiando archivos públicos a dist..."
cp -r public/* dist/ || echo "No se pudieron copiar archivos de public/"

# Crear index.html básico en dist
echo "Creando index.html..."
cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebSAP</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      max-width: 600px;
    }
    h1 {
      color: #3498db;
    }
    p {
      line-height: 1.6;
      color: #444;
    }
    .btn {
      display: inline-block;
      margin-top: 1rem;
      padding: 0.5rem 1.5rem;
      background-color: #3498db;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
    }
    .btn:hover {
      background-color: #2980b9;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>WebSAP</h1>
    <p>Bienvenido a WebSAP. La aplicación está funcionando correctamente.</p>
    <p>Para acceder a la aplicación, haga clic en el siguiente botón:</p>
    <a href="/websap/" class="btn">Ir a WebSAP</a>
  </div>
</body>
</html>
EOF

# Crear .htaccess para manejo de rutas
echo "Creando .htaccess..."
cat > dist/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
EOF

# Crear directorio websap dentro de dist
mkdir -p dist/websap

# Crear index.html en el directorio websap
echo "Creando index.html en websap..."
cat > dist/websap/index.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebSAP - Aplicación</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #3498db;
    }
    .app-content {
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>WebSAP</h1>
    <div class="app-content">
      <p>La aplicación WebSAP está cargando...</p>
      <p>Si esta pantalla persiste, compruebe la conexión a internet y que el servidor backend esté funcionando correctamente.</p>
    </div>
  </div>
</body>
</html>
EOF

# Instalar dependencias necesarias para el servidor
echo "Instalando express y connect-history-api-fallback..."
npm install express connect-history-api-fallback --save

# Mostrar estructura de directorios para verificar
echo "Contenido del directorio actual:"
ls -la

echo "Contenido del directorio dist:"
ls -la dist

echo "===== FIN DEL SCRIPT DE RENDER ====="
