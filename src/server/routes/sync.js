const express = require('express');
const router = express.Router();
const db = require('../database/connection');

// Helper para sanitizar y validar datos
const sanitizeMenuItem = (body) => ({
  name: body.name || '',
  description: body.description || '',
  price: Number(body.price) || 0,
  cost: Number(body.cost) || 0,
  category: body.category || 'principal',
  image_url: body.image_url || '',
  preparation_time: Number(body.preparation_time) || 0,
  is_available: body.is_available ? 1 : 0,
  special_offer: body.special_offer ? 1 : 0,
  discount_percentage: Number(body.discount_percentage) || 0,
  allergens: body.allergens ? JSON.stringify(body.allergens) : '[]',
  nutritional_info: body.nutritional_info ? JSON.stringify(body.nutritional_info) : '{}'
});

// 📌 Endpoint para agregar un plato
router.post('/', (req, res) => {
  const { name, description, price, category, image_url, is_available } = req.body;
  // Lógica para procesar y guardar estos datos en la base de datos
  res.status(201).json({ message: 'Plato sincronizado correctamente' });
});

// 📌 Endpoint para sincronización de platos
router.post('/platos', async (req, res) => {
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

// 📌 Obtener todos los platos
router.get('/platos', async (req, res) => {
  try {
    const [platos] = await db.execute('SELECT * FROM menu_items WHERE is_deleted = 0 OR is_deleted IS NULL');
    res.status(200).json({ success: true, data: platos });
  } catch (error) {
    console.error('❌ Error al obtener platos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener platos', error: error.message });
  }
});

// 📌 Obtener un solo plato
router.get('/platos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [platos] = await db.execute('SELECT * FROM menu_items WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)', [id]);

    if (platos.length === 0) {
      return res.status(404).json({ success: false, message: `No se encontró el plato con ID ${id}` });
    }

    res.status(200).json({ success: true, data: platos[0] });
  } catch (error) {
    console.error(`❌ Error al obtener plato con ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Error al obtener plato', error: error.message });
  }
});

// 📌 Actualizar un plato
router.put('/platos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body.name) {
      return res.status(400).json({ success: false, message: 'El nombre del plato es obligatorio' });
    }

    const sanitizedItem = sanitizeMenuItem(req.body);
    const [result] = await db.execute(
      `UPDATE menu_items SET name = ?, description = ?, price = ?, cost = ?, category = ?, image_url = ?, 
        preparation_time = ?, is_available = ?, special_offer = ?, discount_percentage = ?, 
        allergens = ?, nutritional_info = ?, updated_at = NOW() WHERE id = ?`,
      [...Object.values(sanitizedItem), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: `No se encontró el plato con ID ${id}` });
    }

    res.status(200).json({ success: true, message: 'Plato actualizado', data: { id, ...sanitizedItem } });
  } catch (error) {
    console.error(`❌ Error al actualizar plato con ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Error al actualizar plato', error: error.message });
  }
});

// 📌 Eliminar un plato (Soft delete)
router.delete('/platos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.execute(
      `UPDATE menu_items SET is_deleted = 1, is_available = 0, updated_at = NOW() WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: `No se encontró el plato con ID ${id}` });
    }

    res.status(200).json({ success: true, message: 'Plato eliminado' });
  } catch (error) {
    console.error(`❌ Error al eliminar plato con ID ${req.params.id}:`, error);
    res.status(500).json({ success: false, message: 'Error al eliminar plato', error: error.message });
  }
});

// 📌 Ping para verificar estado del servicio
router.get('/ping', (req, res) => {
  res.status(200).json({ success: true, message: 'Servicio activo', timestamp: new Date().toISOString() });
});

module.exports = router;
