const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Crear la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Permitir peticiones sin origen (como apps móviles, peticiones curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://allseo.xyz',
      'https://allseo.xyz/websap',
      'http://localhost:8080',
      'http://localhost:8081'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.warn(`CORS bloqueó petición de origen: ${origin}`);
      // En desarrollo, permitir todos los orígenes
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Parsear application/json
app.use(bodyParser.json({ limit: '10mb' }));
// Parsear application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos desde el directorio 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint de verificación de salud
app.get('/api/test/ping', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date() });
});

// Endpoint de prueba CORS
app.options('/api/test/cors', cors());
app.get('/api/test/cors', (req, res) => {
  res.json({ cors: 'enabled', origin: req.get('origin') || 'unknown' });
});

// Configurar rutas
app.use('/api/platos', require('./routes/platoRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Crear un manejador de fallback - redirigir todas las peticiones a index.html para enrutamiento del lado del cliente
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error del servidor:', err.stack);
  res.status(500).json({
    error: 'Algo salió mal',
    message: process.env.NODE_ENV === 'production' ? 'Error del servidor' : err.message
  });
});

// Iniciar el servidor
const server = app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

// Manejar apagado del servidor
process.on('SIGINT', () => {
  console.log('Servidor apagándose graciosamente...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

module.exports = server;