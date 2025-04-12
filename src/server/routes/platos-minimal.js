// Endpoint para sincronización de emergencia con estructura mínima
const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// Endpoint de prueba para verificar disponibilidad
router.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Endpoint para sincronizar platos con parámetros mínimos (GET)
router.get('/minimal', async (req, res) => {
  try {
    const { id, name, price } = req.query;
    
    if (!id || !name) {
      return res.status(400).json({ error: 'ID y nombre son requeridos' });
    }
    
    console.log('Recibida sincronización de emergencia para:', { id, name, price });
    
    // Consultar si el plato ya existe
    const [existingPlatos] = await db.execute(
      'SELECT * FROM platos WHERE id = ?',
      [id]
    );
    
    if (existingPlatos.length > 0) {
      // Actualizar plato existente con datos mínimos
      await db.execute(
        'UPDATE platos SET name = ?, price = ?, updated_at = NOW() WHERE id = ?',
        [name, price || 0, id]
      );
      
      console.log(`Plato ${id} actualizado mediante sincronización de emergencia`);
      return res.status(200).json({ success: true, message: 'Plato actualizado', id });
    } else {
      // Crear nuevo plato con datos mínimos
      await db.execute(
        'INSERT INTO platos (id, name, price, is_available, created_at, updated_at) VALUES (?, ?, ?, 1, NOW(), NOW())',
        [id, name, price || 0]
      );
      
      console.log(`Plato ${id} creado mediante sincronización de emergencia`);
      return res.status(201).json({ success: true, message: 'Plato creado', id });
    }
  } catch (error) {
    console.error('Error en sincronización de emergencia:', error);
    return res.status(500).json({ error: 'Error en el servidor', details: error.message });
  }
});

module.exports = router;
