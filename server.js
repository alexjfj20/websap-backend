// Servidor principal de la aplicación
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Mostrar información sobre las variables de entorno cargadas
console.log('--- Configuración del servidor ---');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'No definido'}`);
console.log(`Puerto: ${process.env.PORT || '3000 (default)'}`);
console.log(`CORS Origin: ${process.env.CORS_ORIGIN || 'No definido (permitirá cualquier origen)'}`)

// Crear la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS para permitir peticiones desde tu frontend
const corsOptions = {
  origin: function (origin, callback) {
    // Obtener orígenes permitidos desde variables de entorno o usar valores predeterminados
    const corsOrigin = process.env.CORS_ORIGIN;
    let allowedOrigins = [];
    
    if (corsOrigin) {
      // Si hay varios orígenes separados por comas, dividirlos
      if (corsOrigin.includes(',')) {
        allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());
      } else {
        allowedOrigins = [corsOrigin.trim()];
      }
    }
    
    // Añadir orígenes adicionales
    allowedOrigins = [
      ...allowedOrigins,
      'https://allseo.xyz', 
      'https://www.allseo.xyz',
      // En desarrollo, permitir peticiones del servidor local
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:3000'
    ];
    
    console.log(`Orígenes CORS permitidos: ${allowedOrigins.join(', ')}`);
    
    // Permitir solicitudes sin origin (como aplicaciones móviles o Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.warn(`Solicitud CORS bloqueada desde: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas básicas
app.get('/', (req, res) => {
  res.json({ message: 'API de WebSAP Backend funcionando' });
});

// Importar y usar rutas de la API
console.log('Iniciando carga de rutas API...');

// Verificar la existencia de los archivos de rutas antes de cargarlos
const fs = require('fs');
const apiPath = './src/server/routes/api.js';
const publicApiPath = './src/server/routes/public-api.js';

// Función para verificar la existencia de un archivo
function fileExists(path) {
  try {
    return fs.existsSync(path);
  } catch (error) {
    console.error(`Error al verificar si existe ${path}:`, error);
    return false;
  }
}

console.log(`Verificando rutas API: ${apiPath} - ${fileExists(apiPath) ? 'Existe' : 'No existe'}`);
console.log(`Verificando rutas públicas: ${publicApiPath} - ${fileExists(publicApiPath) ? 'Existe' : 'No existe'}`);

// Importar y usar las rutas API principales
try {
  // Rutas que requieren autenticación
  console.log('Importando rutas API principales...');
  const apiRoutes = require('./src/server/routes/api');
  app.use('/api', apiRoutes);
  console.log('✅ Rutas API principales cargadas correctamente');
} catch (error) {
  console.error('❌ Error al cargar las rutas principales de la API:', error);
  // Ruta de contingencia
  app.use('/api', (req, res) => {
    res.status(500).json({ 
      error: 'Error al cargar las rutas de la API',
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  });
}

// Importar y usar las rutas públicas de manera independiente
try {
  // Rutas públicas (no requieren autenticación)
  console.log('Importando rutas API públicas...');
  const publicApiRoutes = require('./src/server/routes/public-api');
  app.use('/api/public', publicApiRoutes);
  console.log('✅ Rutas API públicas cargadas correctamente');
} catch (error) {
  console.error('❌ Error al cargar las rutas públicas de la API:', error);
  // Ruta de contingencia específica para las rutas públicas
  app.use('/api/public', (req, res) => {
    res.status(500).json({ 
      error: 'Error al cargar las rutas públicas de la API',
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  });
}

// Manejador de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});