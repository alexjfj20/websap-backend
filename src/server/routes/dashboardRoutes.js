const express = require('express');
const router = express.Router();

/**
 * Ruta para obtener estadísticas del dashboard
 * GET /api/dashboard/stats 
 */
router.get('/stats', async (req, res) => {
  try {
    // En una implementación real, estos datos vendrían de una base de datos
    // Aquí generamos datos de ejemplo
    
    // Generar fechas para los últimos 7 días
    const today = new Date();
    const dates = Array(7).fill().map((_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });
    
    // Datos para el dashboard
    const dashboardData = {
      totalPlatos: Math.floor(Math.random() * 50) + 30,
      totalVentas: Math.floor(Math.random() * 3000) + 2000,
      
      platosMasVendidos: [
        { nombre: 'Paella Valenciana', cantidad: Math.floor(Math.random() * 20) + 25 },
        { nombre: 'Tortilla Española', cantidad: Math.floor(Math.random() * 15) + 20 },
        { nombre: 'Croquetas de Jamón', cantidad: Math.floor(Math.random() * 10) + 15 },
        { nombre: 'Pulpo a la Gallega', cantidad: Math.floor(Math.random() * 10) + 12 },
        { nombre: 'Gazpacho', cantidad: Math.floor(Math.random() * 8) + 10 }
      ],
      
      ventasPorDia: dates.map(fecha => ({
        fecha,
        total: Math.floor(Math.random() * 600) + 200
      })),
      
      clientesFrecuentes: [
        { nombre: 'María García', telefono: '612345678', visitas: Math.floor(Math.random() * 5) + 5, totalGastado: Math.floor(Math.random() * 200) + 300 },
        { nombre: 'Juan Pérez', telefono: '623456789', visitas: Math.floor(Math.random() * 3) + 4, totalGastado: Math.floor(Math.random() * 150) + 200 },
        { nombre: 'Ana Rodríguez', telefono: '634567890', visitas: Math.floor(Math.random() * 3) + 3, totalGastado: Math.floor(Math.random() * 100) + 150 },
        { nombre: 'Luis Martínez', telefono: '645678901', visitas: Math.floor(Math.random() * 2) + 3, totalGastado: Math.floor(Math.random() * 100) + 100 }
      ]
    };
    
    // Responder con los datos
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas del dashboard'
    });
  }
});

module.exports = router;