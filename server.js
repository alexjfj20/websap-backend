// Servidor principal de la aplicación
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Crear la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS para permitir peticiones desde tu frontend
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://allseo.xyz', 
      'https://www.allseo.xyz',
      // Incluir cualquier otro dominio de producción
      // 'https://otrodominio.com',
      
      // En desarrollo, permitir peticiones del servidor local
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:3000'
    ];
    
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
try {
  // Rutas que requieren autenticación
  const apiRoutes = require('./src/server/routes/api');
  app.use('/api', apiRoutes);
  
  // Rutas públicas (no requieren autenticación)
  const publicApiRoutes = require('./src/server/routes/public-api');
  app.use('/api/public', publicApiRoutes);
  
  console.log('✅ Rutas API cargadas correctamente');
} catch (error) {
  console.error('❌ Error al cargar las rutas de la API:', error);
  // Ruta de contingencia
  app.use('/api', (req, res) => {
    res.status(500).json({ error: 'Error al cargar las rutas de la API' });
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