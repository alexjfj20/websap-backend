const express = require('express');
const router = express.Router();

// Endpoint simple para ping
router.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ping exitoso',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para verificar headers
router.get('/headers', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Headers recibidos',
    data: {
      headers: req.headers,
      count: Object.keys(req.headers).length
    }
  });
});

module.exports = router;
