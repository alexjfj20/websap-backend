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
console.log('Archivos en el directorio raíz:');
console.log(fs.readdirSync(process.cwd()));

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
  console.log('🚀 Iniciando servidor desde server.js...');
  
  // Configurar variables de entorno si no existen
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
  process.env.PORT = process.env.PORT || 10000;
  process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://allseo.xyz';

  // Mostrar configuración
  console.log('--- Configuración del servidor ---');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Puerto:', process.env.PORT);
  console.log('CORS Origin:', process.env.CORS_ORIGIN);
  // Cargar el servidor principal
  try {
    // Primero intentar con server-fixed.js si existe
    const serverFixedFile = path.join(process.cwd(), 'server-fixed.js');
    if (fs.existsSync(serverFixedFile)) {
      console.log('✅ Encontrado: server-fixed.js');
      console.log('🚀 Usando servidor con rutas corregidas...');
      require('./server-fixed');
    } else {
      console.log('🚀 Usando servidor original...');
      require('./server');
    }
  } catch (error) {
    console.error('❌ Error al cargar servidor:', error);
    
    // Iniciar un servidor de emergencia
    console.log('⚠️ Iniciando servidor de emergencia...');
    const app = express();
    const PORT = process.env.PORT || 10000;
    
    app.use(cors());
    app.use(express.json());
    
    // Ruta por defecto
    app.get('/', (req, res) => {
      res.json({
        status: 'online',
        mode: 'emergency',
        message: 'El servidor WebSAP está en modo de emergencia',
        error: error.message
      });
    });
    
    // Rutas API mínimas
    app.get('/api/status', (req, res) => {
      res.json({ status: 'online', mode: 'emergency' });
    });
    
    app.get('/api/public/menu', (req, res) => {
      res.json([
        { id: 1, name: "Pizza Margherita", price: 8.99, category: "Pizzas" },
        { id: 2, name: "Hamburguesa Clásica", price: 7.50, category: "Hamburguesas" }
      ]);
    });
    
    app.post('/api/auth/login', (req, res) => {
      const { username, password } = req.body;
      
      if (username === 'admin' && password === 'admin123') {
        res.json({
          success: true,
          user: { id: 1, username: 'admin', name: 'Administrador', role: 'admin' },
          token: 'emergency-token-' + Date.now()
        });
      } else {
        res.status(401).json({ success: false, error: 'Credenciales inválidas' });
      }
    });
    
    // Iniciar servidor de emergencia
    app.listen(PORT, () => {
      console.log(`⚠️ Servidor de emergencia iniciado en el puerto ${PORT}`);
      console.log('API básica disponible en /api/status, /api/public/menu, /api/auth/login');
    });
  }
} else {
  console.log('❌ No se encontró server.js');
  
  // Iniciar un servidor mínimo
  console.log('⚠️ Iniciando servidor mínimo...');
  const app = express();
  const PORT = process.env.PORT || 10000;
  
  app.use(cors());
  app.use(express.json());
  
  // Ruta por defecto
  app.get('/', (req, res) => {
    res.json({
      status: 'online',
      mode: 'minimal',
      message: 'El servidor WebSAP está en modo mínimo',
      files: fs.readdirSync(process.cwd())
    });
  });
  
  // API mínima
  app.get('/api/status', (req, res) => {
    res.json({ status: 'online', mode: 'minimal' });
  });
  
  app.get('/api/public/menu', (req, res) => {
    res.json([
      { id: 1, name: "Pizza Margherita", price: 8.99, category: "Pizzas" },
      { id: 2, name: "Hamburguesa Clásica", price: 7.50, category: "Hamburguesas" }
    ]);
  });
  
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'admin123') {
      res.json({
        success: true,
        user: { id: 1, username: 'admin', name: 'Administrador', role: 'admin' },
        token: 'minimal-token-' + Date.now()
      });
    } else {
      res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }
  });
  
  // Iniciar servidor mínimo
  app.listen(PORT, () => {
    console.log(`⚠️ Servidor mínimo iniciado en el puerto ${PORT}`);
    console.log('API básica disponible en /api/status, /api/public/menu, /api/auth/login');
  });
}