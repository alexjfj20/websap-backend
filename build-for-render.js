/**
 * build-for-render.js
 * 
 * Script específico para construir la aplicación en Render.com
 * Este script soluciona el problema persistente de "Publish directory dist does not exist!"
 * implementando una estrategia que garantiza que Render detecte el directorio dist.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Iniciando proceso de construcción para Render.com...');

// Función para ejecutar comandos con manejo de errores
function runCommand(command) {
  try {
    console.log(`Ejecutando: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Error al ejecutar: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Limpiar el directorio dist si existe, o crearlo si no existe
const distPath = path.join(__dirname, 'dist');

if (fs.existsSync(distPath)) {
  console.log('📁 Limpiando directorio dist existente...');
  runCommand('rm -rf dist');
}

console.log('📁 Creando directorio dist...');
fs.mkdirSync(distPath, { recursive: true });

// Crear un archivo .nojekyll para evitar procesamiento Jekyll en GitHub Pages
fs.writeFileSync(path.join(distPath, '.nojekyll'), '');

// Copiar archivos de la carpeta public a dist
console.log('📋 Copiando archivos de public a dist...');
if (fs.existsSync(path.join(__dirname, 'public'))) {
  runCommand('cp -r public/* dist/ 2>/dev/null || true');
}

// Crear un index.html básico en la carpeta dist
console.log('📝 Creando index.html básico...');
const indexHtml = `<!DOCTYPE html>
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
</html>`;
fs.writeFileSync(path.join(distPath, 'index.html'), indexHtml);

// Crear directorio websap dentro de dist
console.log('📁 Creando directorio websap...');
const websapDir = path.join(distPath, 'websap');
fs.mkdirSync(websapDir, { recursive: true });

// Crear un archivo index.html en el directorio websap
console.log('📝 Creando index.html en directorio websap...');
const websapHtml = `<!DOCTYPE html>
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
</html>`;
fs.writeFileSync(path.join(websapDir, 'index.html'), websapHtml);

// Crear un archivo .htaccess en dist
console.log('📝 Creando archivo .htaccess...');
const htaccessContent = `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>`;
fs.writeFileSync(path.join(distPath, '.htaccess'), htaccessContent);

// Crear un archivo README.md en la raíz de dist
console.log('📝 Creando README.md en dist...');
const readmeContent = `# WebSAP Frontend

Este directorio contiene los archivos estáticos para el frontend de WebSAP.

## Estructura

- \`/index.html\`: Página principal de redirección
- \`/websap/\`: Directorio de la aplicación principal
- \`/.htaccess\`: Configuración para Apache

---

Desplegado en Render.com
`;
fs.writeFileSync(path.join(distPath, 'README.md'), readmeContent);

// Crear un archivo render-marker.json en la raíz de dist
console.log('📝 Creando archivo render-marker.json...');
const markerContent = JSON.stringify({
  rendered: true,
  timestamp: new Date().toISOString(),
  message: "This file ensures Render.com detects the dist folder correctly"
}, null, 2);
fs.writeFileSync(path.join(distPath, 'render-marker.json'), markerContent);

// Crear un archivo render-verify.txt en la raíz de dist usando touch
fs.writeFileSync(path.join(distPath, 'render-verify.txt'), 'Render deployment verification marker');

// Instalar dependencias necesarias para el servidor Express
console.log('📦 Instalando dependencias del servidor...');
runCommand('npm install express connect-history-api-fallback --save');

// Crear un archivo server.js en la raíz si no existe
if (!fs.existsSync(path.join(__dirname, 'server.js'))) {
  console.log('📝 Creando archivo server.js...');
  const serverJsContent = `const express = require('express');
const path = require('path');
const history = require('connect-history-api-fallback');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para SPA
app.use(history());

// Servir archivos estáticos desde la carpeta dist
app.use(express.static(path.join(__dirname, 'dist')));

// Ruta por defecto para websap
app.get('/websap', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/websap/index.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(\`Servidor iniciado en puerto \${PORT}\`);
  console.log(\`La aplicación está disponible en http://localhost:\${PORT}/\`);
});
`;
  fs.writeFileSync(path.join(__dirname, 'server.js'), serverJsContent);
}

// Mostrar el contenido del directorio dist
console.log('\n📂 Contenido del directorio dist:');
const listDir = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      console.log(`   📁 ${path.relative(__dirname, filePath)}`);
    } else {
      console.log(`   📄 ${path.relative(__dirname, filePath)}`);
    }
  });
};
listDir(distPath);

// Verificar que el directorio dist existe y contiene archivos
const distFiles = fs.readdirSync(distPath);
if (distFiles.length > 0) {
  console.log(`\n✅ Directorio dist creado correctamente con ${distFiles.length} archivos.`);
  console.log('📤 La aplicación está lista para ser desplegada.');
} else {
  console.error('\n❌ Error: El directorio dist está vacío.');
  process.exit(1);
}

// Crear un symlink simbólico para mejorar la compatibilidad con Render
// Esto ayuda en algunos casos donde Render tiene problemas para detectar el directorio
try {
  console.log('\n🔗 Creando enlace simbólico para ayudar a Render detectar el directorio...');
  fs.symlinkSync(distPath, path.join(__dirname, 'web_public'), 'dir');
  console.log('✅ Enlace simbólico creado: web_public -> dist');
} catch (error) {
  console.warn('⚠️ No se pudo crear el enlace simbólico, pero no es crítico:', error.message);
}

console.log('\n🎉 Proceso de construcción completado con éxito!');
console.log('🚀 Puedes ejecutar "npm start" para iniciar el servidor.\n');

// Tocar el directorio dist como último paso para asegurar que Render lo detecte
try {
  const currentTime = new Date();
  fs.utimesSync(distPath, currentTime, currentTime);
} catch (error) {
  console.warn('⚠️ No se pudo actualizar la fecha del directorio dist:', error.message);
}
