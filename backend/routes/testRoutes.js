// Endpoint para verificar la conexión con el servidor
const express = require('express');
const router = express.Router();

router.get('/ping', (req, res) => {
  res.status(200).json({ success: true, message: 'Conexión exitosa con el servidor' });
});

module.exports = router;
