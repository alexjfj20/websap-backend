const express = require('express');
const router = express.Router();
const { Plato } = require('../models'); // Ajusta según tu modelo real

/**
 * Ruta para sincronización básica de platos
 * POST /api/platos/minimal
 */
router.post('/minimal', async (req, res) => {
  try {
    console.log('Recibida solicitud de sincronización minimalista de plato');
    
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
    let plato = await Plato.findOne({ where: { id: req.body.id } });
    
    if (plato) {
      // Actualizar plato existente
      await plato.update(req.body);
      console.log(`Plato actualizado: ${plato.id}`);
    } else {
      // Crear nuevo plato
      plato = await Plato.create(req.body);
      console.log(`Nuevo plato creado: ${plato.id}`);
    }
    
    return res.status(200).json({
      success: true,
      message: plato ? 'Plato sincronizado correctamente' : 'Error al sincronizar plato',
      data: { id: plato.id }
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

// Otras rutas de sincronización de emergencia y diagnóstico aquí...

module.exports = router;