const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// Endpoint simple para ping (sin autenticación)
router.get('/ping', healthController.ping);

// Endpoint para obtener estado de salud del sistema
router.get('/status', healthController.getHealthStatus);

module.exports = router;
