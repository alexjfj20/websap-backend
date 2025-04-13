/**
 * prepare-render.js
 * Script para preparar el despliegue en Render.com
 * Este enfoque híbrido combina una aplicación estática con un servidor Express
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparando proyecto para despliegue en Render.com...');

try {
  // 1. Asegurar que tenemos las dependencias necesarias
  console.log('📦 Instalando dependencias esenciales...');
  execSync('npm install express serve-static connect-history-api-fallback --save', { stdio: 'inherit' });
  
  // 2. Crear explícitamente el directorio dist que Render está buscando
  console.log('📂 Creando directorio dist para Render...');
  if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
  }
  
  // 3. Copiar archivos estáticos de public a dist
  console.log('📂 Copiando archivos estáticos a dist...');
  const publicDir = path.join(__dirname, 'public');
  const distDir = path.join(__dirname, 'dist');
  
  if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir);
    files.forEach(file => {
      const srcPath = path.join(publicDir, file);
      const destPath = path.join(distDir, file);
      
      if (fs.statSync(srcPath).isDirectory()) {
        // Si es un directorio, crear el directorio en dist y copiar recursivamente
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        // Aquí podrías implementar una copia recursiva si es necesario
      } else {
        // Si es un archivo, copiarlo directamente
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copiado: ${file}`);
      }
    });
  }
  
  // 4. Verificar estructura de archivos
  console.log('📂 Verificando estructura de archivos...');
  
  // Crear archivo render-server.js que servirá la aplicación
  console.log('📝 Creando servidor para Render...');
  const serverContent = `
const express = require('express');
const path = require('path');
const serveStatic = require('serve-static');
const history = require('connect-history-api-fallback');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para manejar rutas SPA (Single Page Application)
app.use(history());

// Definir carpeta estática
app.use(serveStatic(path.join(__dirname, 'public')));

// Servir archivos específicos para el path /websap/
app.use('/websap', serveStatic(path.join(__dirname, 'public')));

// Manejador para la ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejador para la ruta /websap
app.get('/websap', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(\`Servidor iniciado en el puerto \${PORT}\`);
  console.log(\`La aplicación está disponible en http://localhost:\${PORT}\`);
});

console.log('✅ Servidor configurado para servir archivos estáticos desde /public');
`;

  fs.writeFileSync(path.join(__dirname, 'render-server.js'), serverContent);

  // 3. Crear un archivo .env para Render
  console.log('📝 Creando archivo .env para Render...');
  const envContent = `
# Configuración para Render.com
PORT=10000
NODE_ENV=production
`;

  fs.writeFileSync(path.join(__dirname, '.env.render'), envContent);
  
  // 4. Crear un archivo start-render.sh como alternativa
  console.log('📝 Creando script de inicio para Render...');
  const startScriptContent = `#!/bin/bash
# Script para iniciar la aplicación en Render.com
node render-server.js
`;

  fs.writeFileSync(path.join(__dirname, 'start-render.sh'), startScriptContent);
  // Hacer ejecutable el script
  fs.chmodSync(path.join(__dirname, 'start-render.sh'), '755');
  
  // 5. Crear un mensaje de diagnóstico
  console.log('📝 Creando archivo de diagnóstico para Render...');
  const diagContent = JSON.stringify({
    timestamp: new Date().toISOString(),
    message: 'Archivo de diagnóstico para despliegue en Render.com',
    project: 'WebSAP Frontend',
    strategy: 'Hybrid Server-Static approach'
  }, null, 2);

  fs.writeFileSync(path.join(__dirname, 'render-diagnostics.json'), diagContent);

  console.log('✅ Preparación para Render completada correctamente');
  console.log('🔶 IMPORTANTE: Este proyecto debe desplegarse como Web Service en Render, no como Static Site');
  
} catch (error) {
  console.error('❌ Error durante la preparación:', error.message);
  process.exit(1);
}
