// src/server/routes/api.js
const express = require('express');
const router = express.Router();
const db = require('../database/connection'); // Asegúrate de que la ruta es correcta

// Endpoint para sincronización de platos
router.post('/api/sync/platos', async (req, res) => {
  try {
    console.log('Recibida solicitud de sincronización de platos', req.body);

    // Validar que tenemos datos básicos
    if (!req.body || !req.body.id) {
      return res.status(400).json({
        success: false,
        message: 'Datos de plato incompletos'
      });
    }

    // Log de los datos recibidos (sin imágenes para evitar logs enormes)
    const logData = { ...req.body };
    if (logData.image) {
      logData.image = `[Imagen: ${logData.image.substring(0, 20)}...]`;
    }
    console.log('Datos recibidos para sincronización:', logData);

    // Verificar si el plato ya existe
    let [plato] = await db.execute('SELECT * FROM menu_items WHERE id = ?', [req.body.id]);

    if (plato.length > 0) {
      // Actualizar plato existente
      await db.execute('UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, image_url = ?, is_available = ? WHERE id = ?',
        [
          req.body.name,
          req.body.description || '',
          Number(req.body.price) || 0,
          req.body.category || 'principal',
          req.body.image_url || '',
          req.body.is_available !== false ? 1 : 0,
          req.body.id
        ]);
      console.log(`Plato actualizado: ${req.body.id}`);
    } else {
      // Crear nuevo plato
      const [result] = await db.execute('INSERT INTO menu_items (id, name, description, price, category, image_url, is_available) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          req.body.id,
          req.body.name,
          req.body.description || '',
          Number(req.body.price) || 0,
          req.body.category || 'principal',
          req.body.image_url || '',
          req.body.is_available !== false ? 1 : 0
        ]);
      console.log(`Nuevo plato creado: ${result.insertId}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Plato sincronizado correctamente',
      data: { id: req.body.id }
    });
  } catch (error) {
    console.error('Error al sincronizar plato:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al sincronizar plato',
      error: error.message
    });
  }
});

// Endpoint de prueba
router.get('/test/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Servidor disponible',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;