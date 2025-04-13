/**
 * prepare-static-files.js
 * Script simplificado para preparar los archivos estáticos del frontend
 * para ser servidos por una aplicación web Node.js en Render.com
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparando archivos estáticos para WebSAP...');

// Carpeta que contendrá los archivos estáticos
const staticFolder = path.join(__dirname, 'static');

try {
  // 1. Crear carpeta static si no existe
  if (!fs.existsSync(staticFolder)) {
    console.log('📁 Creando carpeta static...');
    fs.mkdirSync(staticFolder, { recursive: true });
  } else {
    console.log('📁 Limpiando carpeta static existente...');
    // Limpiar carpeta si ya existe
    const files = fs.readdirSync(staticFolder);
    for (const file of files) {
      const curPath = path.join(staticFolder, file);
      if (fs.statSync(curPath).isDirectory()) {
        fs.rmSync(curPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(curPath);
      }
    }
  }

  // 2. Crear subcarpeta websap
  const websapFolder = path.join(staticFolder, 'websap');
  if (!fs.existsSync(websapFolder)) {
    console.log('📁 Creando subcarpeta websap...');
    fs.mkdirSync(websapFolder, { recursive: true });
  }
  
  // 3. Copiar todos los archivos de public a static
  const publicFolder = path.join(__dirname, 'public');
  if (fs.existsSync(publicFolder)) {
    console.log('📋 Copiando archivos estáticos...');
    fs.readdirSync(publicFolder).forEach(file => {
      const srcPath = path.join(publicFolder, file);
      const destPath = path.join(staticFolder, file);
      
      if (fs.statSync(srcPath).isDirectory()) {
        // Si es directorio, copiar recursivamente
        fs.mkdirSync(destPath, { recursive: true });
        copyDirRecursive(srcPath, destPath);
      } else {
        // Si es archivo, copiar directamente
        fs.copyFileSync(srcPath, destPath);
        console.log(`✓ Copiado: ${file}`);
      }
    });
  } else {
    console.log('⚠️ La carpeta public no existe. Creando archivos básicos...');
    // Crear archivo index.html básico
    const indexContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebSAP</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
    h1 { color: #3498db; }
    .button { display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>WebSAP</h1>
  <p>Bienvenido a WebSAP. La aplicación está funcionando correctamente.</p>
  <a href="/websap/" class="button">Ir a la aplicación</a>
</body>
</html>`;
    fs.writeFileSync(path.join(staticFolder, 'index.html'), indexContent);
    
    // Crear archivo index.html básico para websap
    const websapIndexContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebSAP - Aplicación</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
    h1 { color: #3498db; }
  </style>
</head>
<body>
  <h1>WebSAP - Aplicación</h1>
  <p>La aplicación está cargando...</p>
</body>
</html>`;
    fs.writeFileSync(path.join(websapFolder, 'index.html'), websapIndexContent);
  }

  // 4. Instalar dependencias necesarias
  console.log('📦 Instalando dependencias necesarias...');
  execSync('npm install express compression serve-static --save', { stdio: 'inherit' });

  // 5. Crear un archivo de servidor web simple
  console.log('📝 Creando archivo de servidor web...');
  const serverContent = `const express = require('express');
const path = require('path');
const compression = require('compression');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Usar compresión para mejorar el rendimiento
app.use(compression());

// Configurar cabeceras de seguridad básicas
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'static')));

// Ruta específica para /websap
app.use('/websap', express.static(path.join(__dirname, 'static/websap')));

// Configurar manejo de rutas para SPA
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.get('/websap', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'websap', 'index.html'));
});

// Capturar todas las rutas no definidas bajo /websap
app.get('/websap/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'websap', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(\`🚀 Servidor WebSAP iniciado en puerto \${PORT}\`);
  console.log(\`📱 Aplicación disponible en: http://localhost:\${PORT}/websap\`);
});`;
  
  fs.writeFileSync(path.join(__dirname, 'web-server.js'), serverContent);
  
  // 6. Crear un archivo Procfile para Render (opcional)
  console.log('📝 Creando archivo Procfile...');
  fs.writeFileSync(path.join(__dirname, 'Procfile'), 'web: node web-server.js');
  
  console.log('✅ Proceso completado con éxito');
  console.log('🔹 Archivos estáticos preparados en carpeta "static"');
  console.log('🔹 Servidor web configurado para servir estos archivos');
  console.log('🔹 IMPORTANTE: Este servicio debe ser desplegado como Web Service, no como Static Site');

} catch (error) {
  console.error('❌ Error durante la preparación:', error.message);
  process.exit(1);
}

// Función para copiar directorios recursivamente
function copyDirRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  entries.forEach(entry => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✓ Copiado: ${path.relative(__dirname, destPath)}`);
    }
  });
}
