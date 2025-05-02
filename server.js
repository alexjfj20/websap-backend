// Servidor principal WebSAP
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { initializeDatabase } = require('./src/database/connection');
const morgan = require('morgan');

// Configuración del servidor
const app = express();
const PORT = process.env.PORT || 10000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://allseo.xyz';

// Cabeceras CORS configurables
const corsOrigins = [
  CORS_ORIGIN,
  'https://www.allseo.xyz',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:3000'
];

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Origen CORS bloqueado: ${origin}`);
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  credentials: true
}));

// Logging en modo de desarrollo
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Crear directorio de logs si no existe
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  
  // Crear stream de escritura para logs
  const accessLogStream = fs.createWriteStream(
    path.join(logDir, 'access.log'),
    { flags: 'a' }
  );
  
  // Usar morgan para logging en archivo
  app.use(morgan('combined', { stream: accessLogStream }));
}

// Iniciar la aplicación
async function startServer() {
  console.log('--- Configuración del servidor ---');
  console.log('NODE_ENV:', NODE_ENV);
  console.log('Puerto:', PORT);
  console.log('CORS Origin:', CORS_ORIGIN);
  
  console.log('Iniciando carga de rutas API...');
  
  // Verificar si existen los archivos de rutas
  const apiRoutesPath = './src/server/routes/api.js';
  const publicRoutesPath = './src/server/routes/public-api.js';
  const authRoutesPath = './src/server/routes/auth.js';
  
  if (fs.existsSync(apiRoutesPath)) {
    console.log(`Verificando rutas API: ${apiRoutesPath} - Existe`);
  } else {
    console.error(`Verificando rutas API: ${apiRoutesPath} - NO EXISTE`);
    process.exit(1);
  }
  
  if (fs.existsSync(publicRoutesPath)) {
    console.log(`Verificando rutas públicas: ${publicRoutesPath} - Existe`);
  } else {
    console.error(`Verificando rutas públicas: ${publicRoutesPath} - NO EXISTE`);
    process.exit(1);
  }
  
  if (fs.existsSync(authRoutesPath)) {
    console.log(`Verificando rutas auth: ${authRoutesPath} - Existe`);
  } else {
    console.error(`Verificando rutas auth: ${authRoutesPath} - NO EXISTE`);
    process.exit(1);
  }
  
  // Inicializar la base de datos
  console.log('Importando rutas API principales...');
  console.log('Intentando importar el módulo de conexión a la base de datos...');
  console.log('Ruta de búsqueda:', path.resolve(__dirname, 'src/database/connection'));
  
  try {
    // Inicializar la base de datos
    console.log('Iniciando servicio de base de datos');
    const dbConnected = await initializeDatabase();
    
    if (dbConnected) {
      console.log('✅ Módulo de base de datos importado correctamente');
    } else {
      console.warn('⚠️ Usando modo de simulación para la base de datos.');
    }
    
    // Cargar rutas API
    const apiRoutes = require('./src/server/routes/api');
    app.use('/api', apiRoutes);
    console.log('✅ Rutas API principales cargadas correctamente');
    
    // Cargar rutas API públicas
    console.log('Importando rutas API públicas...');
    console.log('Intentando importar el módulo de conexión a la base de datos para rutas públicas...');
    console.log('Ruta de búsqueda para public-api:', path.resolve(__dirname, 'src/database/connection'));
    
    const publicApiRoutes = require('./src/server/routes/public-api');
    app.use('/api/public', publicApiRoutes);
    console.log('✅ Rutas API públicas cargadas correctamente');
    
    // Cargar rutas de autenticación
    console.log('Importando rutas de autenticación...');
    const authRoutes = require('./src/server/routes/auth');
    app.use('/api/auth', authRoutes);
    console.log('✅ Rutas de autenticación cargadas correctamente');
    
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log('✅ Servidor iniciado correctamente');
      console.log(`Servidor corriendo en el puerto ${PORT}`);
      console.log(`API lista para manejar peticiones${dbConnected ? ' con acceso a la base de datos' : ' (MODO SIMULACIÓN)'}`);
      console.log(`Orígenes CORS permitidos: ${corsOrigins.join(', ')}`);
    });
    
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();