/**
 * web-server.js
 * Servidor web simplificado para servir la aplicación frontend en Render.com
 * sin depender de módulos de base de datos
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Directorio para archivos estáticos
const staticDir = path.join(__dirname, 'static');

// Si la carpeta static no existe, usar public
if (!fs.existsSync(staticDir)) {
  console.log('📂 La carpeta static no existe. Usando public como alternativa...');
}

// Determinar qué carpeta usar
const serveDir = fs.existsSync(staticDir) ? staticDir : path.join(__dirname, 'public');
console.log(`📂 Sirviendo archivos estáticos desde: ${serveDir}`);

// Servir archivos estáticos
app.use(express.static(serveDir));

// Configurar manejo de rutas para SPA
app.get('/', (req, res) => {
  res.sendFile(path.join(serveDir, 'index.html'));
});

// Manejar la ruta /websap
app.get('/websap', (req, res) => {
  const websapIndexPath = path.join(serveDir, 'websap', 'index.html');
  
  if (fs.existsSync(websapIndexPath)) {
    res.sendFile(websapIndexPath);
  } else {
    res.sendFile(path.join(serveDir, 'index.html'));
  }
});

// Capturar todas las rutas no definidas para manejarlas con SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(serveDir, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor web iniciado en puerto ${PORT}`);
  console.log(`📱 Aplicación disponible en: http://localhost:${PORT}`);
});
