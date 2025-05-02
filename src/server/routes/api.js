// src/server/routes/api.js
const express = require('express');
const router = express.Router();

// Importar la conexión a la base de datos con manejo de errores
let db;
try {
  console.log('Intentando importar el módulo de conexión a la base de datos...');
  // Usar path.join para crear una ruta absoluta que funcione en cualquier entorno
  const path = require('path');
  const dbPath = path.join(__dirname, '../../database/connection');
  console.log(`Ruta de búsqueda: ${dbPath}`);
  
  db = require(dbPath);
  console.log('✅ Módulo de base de datos importado correctamente');
} catch (error) {
  console.error('❌ Error al importar el módulo de base de datos:', error);
  // Crear un objeto de sustitución para evitar errores
  db = {
    sequelize: null,
    testConnection: () => Promise.resolve(false)
  };
}

// Verificar la conexión a la base de datos
db.testConnection()
  .then(success => {
    if (success) {
      console.log('API lista para manejar peticiones con acceso a la base de datos');
    } else {
      console.warn('API iniciada pero con problemas en la conexión a la base de datos');
    }
  });

// Rutas de la API
router.get('/test', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Ruta para obtener información del sistema
router.get('/system-info', (req, res) => {
  res.json({
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
    dbConnected: db.sequelize !== null
  });
});

// Aquí irían el resto de tus rutas de API

module.exports = router;