/**
 * Servidor de inicialización para Render.com
 * Este archivo inicia el servidor Express con la configuración correcta para Render
 */
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

// Información del entorno para diagnóstico
console.log('--- Información del entorno de despliegue ---');
console.log('Directorio actual:', process.cwd());
console.log('Archivos en el directorio raíz:', fs.readdirSync(process.cwd()));

// Verificar estructura de carpetas
console.log('--- Verificando estructura de carpetas ---');

const dbDir = path.join(process.cwd(), 'src/database');
const routesDir = path.join(process.cwd(), 'src/server/routes');

if (fs.existsSync(dbDir)) {
  console.log('✅ src/database existe');
  console.log('   Archivos:', fs.readdirSync(dbDir).join(', '));
} else {
  console.log('❌ src/database NO existe');
}

if (fs.existsSync(routesDir)) {
  console.log('✅ src/server/routes existe');
  console.log('   Archivos:', fs.readdirSync(routesDir).join(', '));
} else {
  console.log('❌ src/server/routes NO existe');
}

// Buscar archivo principal
console.log('--- Buscando archivo principal ---');
const serverFile = path.join(process.cwd(), 'server.js');

if (fs.existsSync(serverFile)) {
  console.log('✅ Encontrado: server.js');

  // Configurar variables de entorno si no existen
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
  process.env.PORT = process.env.PORT || 10000;
  process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://allseo.xyz';

  // Mostrar configuración
  console.log('--- Configuración del servidor ---');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Puerto:', process.env.PORT);
  console.log('CORS Origin:', process.env.CORS_ORIGIN);

  try {
    // Cargar el corrector dinámico de rutas ANTES de cargar el servidor principal
    const dynamicPathFixerFile = path.join(process.cwd(), 'dynamic-path-fixer.js');
    if (fs.existsSync(dynamicPathFixerFile)) {
      console.log('✅ Encontrado: dynamic-path-fixer.js');
      console.log('🔄 Activando corrector dinámico de rutas de importación...');
      require('./dynamic-path-fixer');
    } else {
      console.log('⚠️ No se encontró el corrector dinámico de rutas. Las importaciones podrían fallar.');
    }

    // Cargar el servidor principal
    console.log('🚀 Iniciando servidor principal desde server.js...');
    require('./server'); // Carga directa de server.js

  } catch (error) {
    console.error('❌ Error CRÍTICO al cargar el servidor principal:', error);

    // Iniciar un servidor de emergencia SIMPLIFICADO si falla la carga principal
    console.log('⚠️ Iniciando servidor de emergencia...');
    const app = express();
    const PORT = process.env.PORT || 10000;

    app.use(cors({ origin: process.env.CORS_ORIGIN }));
    app.use(express.json());

    // Ruta raíz de emergencia
    app.get('/', (req, res) => {
      res.json({
        status: 'online',
        mode: 'emergency',
        message: 'El servidor WebSAP está en modo de emergencia debido a un error de inicio.',
        error: error.message,
        stack: error.stack // Incluir stack trace para depuración
      });
    });

    // Ruta de estado de emergencia
    app.get('/api/status', (req, res) => {
      res.json({ status: 'online', mode: 'emergency' });
    });
    
    // Ruta de login de emergencia (solo para permitir intentos)
    app.post('/api/auth/login', (req, res) => {
        res.status(503).json({ 
            success: false, 
            error: 'Servidor en modo de emergencia. No se puede procesar el login.',
            details: error.message 
        });
    });

    // Iniciar servidor de emergencia
    app.listen(PORT, () => {
      console.log(`⚠️ Servidor de emergencia iniciado en el puerto ${PORT}`);
      console.log('   El servidor principal falló al iniciar. Revisa los logs de error.');
    });
  }
} else {
  // Caso MUY RARO: No se encuentra server.js
  console.log('❌ ERROR FATAL: No se encontró server.js en el directorio raíz.');
  
  // Iniciar un servidor mínimo absoluto
  const app = express();
  const PORT = process.env.PORT || 10000;
  app.get('/', (req, res) => {
    res.status(500).json({
      status: 'error',
      mode: 'fatal',
      message: 'Error fatal: No se encontró el archivo principal del servidor (server.js).',
      files: fs.readdirSync(process.cwd())
    });
  });
  app.listen(PORT, () => {
    console.log(`❌ Servidor mínimo iniciado en el puerto ${PORT} debido a la falta de server.js`);
  });
}