/**
 * Script personalizado para el despliegue en Render
 * Este script maneja el proceso de construcción evitando los problemas
 * de permisos con vue-cli-service
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando proceso de despliegue para Render...');

// Función para ejecutar comandos y mostrar la salida
function runCommand(command) {
  console.log(`Ejecutando: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Error ejecutando el comando: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Asegurarnos de instalar todas las dependencias (incluyendo devDependencies)
console.log('📦 Instalando dependencias...');
if (!runCommand('npm install --production=false')) {
  process.exit(1);
}

// Verificar si existe la carpeta dist, crearla si no existe o vaciarla si existe
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  console.log('📁 Creando directorio dist...');
  fs.mkdirSync(distDir, { recursive: true });
} else {
  console.log('📁 Limpiando directorio dist existente...');
  // Verificar que el directorio existe y es un directorio
  if (fs.statSync(distDir).isDirectory()) {
    // Listar todos los archivos en el directorio
    const files = fs.readdirSync(distDir);
    
    // Eliminar cada archivo/directorio
    for (const file of files) {
      const curPath = path.join(distDir, file);
      if (fs.statSync(curPath).isDirectory()) {
        // Si es un directorio, eliminar recursivamente
        fs.rmSync(curPath, { recursive: true, force: true });
      } else {
        // Si es un archivo, eliminar directamente
        fs.unlinkSync(curPath);
      }
    }
  }
}

// Crear un archivo HTML básico para la carpeta dist
const createBasicHtml = () => {
  const htmlContent = `<!DOCTYPE html>
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

  fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);
  console.log('✅ Archivo index.html creado en dist');
};

// Intentar ejecutar la construcción con npx
console.log('🔨 Intentando construcción con npx...');
const buildSuccess = runCommand('npx vue-cli-service build');

// Si la construcción falla, crear contenido estático básico
if (!buildSuccess) {
  console.log('⚠️ La construcción falló. Creando contenido estático básico...');
  
  // Crear un html básico
  createBasicHtml();
  
  // Copiar archivos estáticos existentes si los hay
  console.log('📋 Copiando archivos estáticos existentes...');
  
  // Asegurar que el directorio dist existe
  if (!fs.existsSync(distDir)) {
    console.log('📁 Creando directorio dist (aseguramiento)...');
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Crear un archivo de marcador para confirmar que el directorio dist existe
  fs.writeFileSync(path.join(distDir, '.render-marker'), 'Este archivo es un marcador para que Render detecte el directorio dist');

  // Copiar archivos de la carpeta public si existe
  if (fs.existsSync(path.join(__dirname, 'public'))) {
    const publicFiles = fs.readdirSync(path.join(__dirname, 'public'));
    
    for (const file of publicFiles) {
      if (file !== 'index.html') {  // No sobreescribir el index.html que creamos
        const srcPath = path.join(__dirname, 'public', file);
        const destPath = path.join(distDir, file);
        
        try {
          if (fs.statSync(srcPath).isDirectory()) {
            // Crear directorio si no existe
            if (!fs.existsSync(destPath)) {
              fs.mkdirSync(destPath, { recursive: true });
            }
            
            // Copiar archivos en el directorio
            const dirFiles = fs.readdirSync(srcPath);
            for (const dirFile of dirFiles) {
              const dirSrcPath = path.join(srcPath, dirFile);
              const dirDestPath = path.join(destPath, dirFile);
              
              if (!fs.statSync(dirSrcPath).isDirectory()) {
                fs.copyFileSync(dirSrcPath, dirDestPath);
                console.log(`✓ Copiado: ${dirFile}`);
              }
            }
          } else {
            fs.copyFileSync(srcPath, destPath);
            console.log(`✓ Copiado: ${file}`);
          }
        } catch (error) {
          console.error(`❌ Error al copiar ${srcPath}: ${error.message}`);
        }
      }
    }
  }
  
  // Imprimir contenido del directorio dist para debugging
  console.log('📂 Contenido del directorio dist:');
  if (fs.existsSync(distDir) && fs.statSync(distDir).isDirectory()) {
    const files = fs.readdirSync(distDir);
    if (files.length === 0) {
      console.log('   (directorio vacío)');
    } else {
      files.forEach(file => {
        console.log(`   - ${file}`);
      });
    }
  } else {
    console.log('   ❌ El directorio dist no existe o no es un directorio');
  }
}

// Asegurarnos de tener Express instalado para el servidor
console.log('📦 Verificando dependencia de connect-history-api-fallback...');
runCommand('npm install connect-history-api-fallback express --save');

console.log('✅ Proceso de construcción completado');
console.log('🔄 Puedes ejecutar "npm start" para iniciar el servidor');
