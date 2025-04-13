// Si existe este archivo en vez de server.js, añadir:
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const { closePool } = require('./config/dbPool'); // Importamos la función para cerrar el pool

// Configurar bodyParser para manejar JSON
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Importar rutas
const syncRoutes = require('./routes/syncRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');

// Configuración CORS mejorada
const cors = require('cors');
const corsOptions = require('./cors-config');
app.use(cors(corsOptions));

// Middleware adicional para asegurar que los headers CORS estén siempre presentes
app.use((req, res, next) => {
  // Asegurar que OPTIONS siempre se maneje correctamente
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Manejador de errores para cualquier error relacionado con headers
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    console.error('Payload demasiado grande');
    return res.status(413).send('Payload demasiado grande');
  }
  
  if (err.name === 'SyntaxError') {
    console.error('Error de sintaxis en la solicitud:', err.message);
    return res.status(400).send('Solicitud malformada');
  }
  
  next(err);
});

// Registrar rutas
app.use('/api/sync', syncRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Puerto para el servidor
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});

// Manejar el cierre adecuado del servidor y las conexiones
process.on('SIGINT', async () => {
  console.log('Cerrando servidor...');
  
  try {
    // Cerrar el pool de conexiones
    await closePool();
    console.log('Pool de conexiones cerrado correctamente');
    
    // Cerrar el servidor
    server.close(() => {
      console.log('Servidor cerrado correctamente');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error al cerrar el servidor:', error);
    process.exit(1);
  }
});

module.exports = app;
