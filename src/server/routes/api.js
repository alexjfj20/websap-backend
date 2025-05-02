// src/server/routes/api.js
const express = require('express');
const router = express.Router();

// Importar la conexión a la base de datos
try {
  const db = require('../database/connection');
  
  // Verificar la conexión a la base de datos al iniciar
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

  // Aquí irían el resto de tus rutas de API
  
} catch (error) {
  console.error('Error al cargar el módulo de base de datos:', error);
  
  // Rutas de contingencia si hay problemas con la BD
  router.get('*', (req, res) => {
    res.status(500).json({ 
      error: 'Error de configuración en el servidor',
      message: 'Problema con la conexión a la base de datos'
    });
  });
}

module.exports = router;