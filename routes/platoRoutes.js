// backend/routes/platoRoutes.js

const express = require('express');
const router = express.Router();
const platoController = require('../controllers/platoController');

// Ruta de prueba para verificar que las rutas de platos funcionan
router.get('/test', (req, res) => {
  res.json({ message: 'Rutas de platos funcionando correctamente' });
});

// Ruta pública para menús compartidos - NO requiere autenticación
router.get('/menu/:menuId', async (req, res) => {
  try {
    const { menuId } = req.params;
    console.log(`Solicitud pública de menú compartido con ID: ${menuId}`);

    // Buscar los platos asociados a este menú
    const platos = await platoController.getPlatosByMenuId(menuId);
    
    if (!platos || platos.length === 0) {
      console.log(`No se encontraron platos para el menú ${menuId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Menú no encontrado' 
      });
    }
    
    console.log(`Menú ${menuId} encontrado, enviando ${platos.length} platos`);
    return res.status(200).json({
      success: true,
      data: {
        id: menuId,
        items: platos,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Error al obtener menú compartido ${req.params.menuId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener menú compartido',
      error: error.message
    });
  }
});

// Ruta pública para obtener información del negocio para un menú compartido
router.get('/menu/:menuId/info', async (req, res) => {
  try {
    const { menuId } = req.params;
    console.log(`Solicitud pública de información de negocio para menú: ${menuId}`);

    // Obtener la información del negocio asociada a este menú
    const businessInfo = await platoController.getBusinessInfoByMenuId(menuId);
    
    if (!businessInfo) {
      console.log(`No se encontró información de negocio para el menú ${menuId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Información de negocio no encontrada' 
      });
    }
    
    console.log(`Información de negocio encontrada para el menú ${menuId}`);
    return res.status(200).json({
      success: true,
      data: {
        businessInfo
      }
    });
  } catch (error) {
    console.error(`Error al obtener información de negocio para menú ${req.params.menuId}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener información de negocio',
      error: error.message
    });
  }
});

// Rutas principales
router.get('/', platoController.getPlatos);
router.get('/:id', platoController.getPlatoById);
router.post('/', platoController.createPlato);
router.put('/:id', platoController.updatePlato);
router.delete('/:id', platoController.deletePlato);

module.exports = router;