const express = require('express');
const router = express.Router();

/**
 * Ruta para obtener datos del dashboard de administración
 * GET /api/admin/dashboard
 */
router.get('/dashboard', (req, res) => {
  try {
    // Datos simulados para el dashboard
    const dashboardData = {
      estadisticas: {
        totalUsuarios: 18,
        totalRestaurantes: 6,
        totalPedidos: 142,
        totalVentas: 4250
      },
      graficoVentas: [
        { mes: 'Ene', ventas: 320 },
        { mes: 'Feb', ventas: 350 },
        { mes: 'Mar', ventas: 420 },
        { mes: 'Abr', ventas: 380 },
        { mes: 'May', ventas: 450 },
        { mes: 'Jun', ventas: 520 },
        { mes: 'Jul', ventas: 610 },
        { mes: 'Ago', ventas: 590 },
        { mes: 'Sep', ventas: 620 },
        { mes: 'Oct', ventas: 670 }
      ],
      restaurantesPopulares: [
        { nombre: 'Restaurante La Buena Mesa', pedidos: 45 },
        { nombre: 'Pizzería Bella Italia', pedidos: 32 },
        { nombre: 'El Rincón del Sabor', pedidos: 28 },
        { nombre: 'Marisquería El Puerto', pedidos: 22 },
        { nombre: 'Taco Fiesta', pedidos: 15 }
      ],
      usuariosActivos: [
        { nombre: 'María García', rol: 'Administrador', ultimoAcceso: '2023-10-15' },
        { nombre: 'Juan Pérez', rol: 'Empleado', ultimoAcceso: '2023-10-16' },
        { nombre: 'Ana Rodríguez', rol: 'Empleado', ultimoAcceso: '2023-10-14' },
        { nombre: 'Luis Martínez', rol: 'Superadministrador', ultimoAcceso: '2023-10-16' },
        { nombre: 'Carlos Sánchez', rol: 'Administrador', ultimoAcceso: '2023-10-13' }
      ]
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos del dashboard',
      error: error.message
    });
  }
});

/**
 * Ruta para obtener la lista de roles
 * GET /api/roles
 */
router.get('/roles', (req, res) => {
  try {
    // Lista de roles del sistema
    const roles = [
      { id: 1, nombre: 'Administrador', descripcion: 'Gestiona el restaurante' },
      { id: 2, nombre: 'Empleado', descripcion: 'Atiende pedidos y clientes' },
      { id: 3, nombre: 'Superadministrador', descripcion: 'Control total del sistema' }
    ];

    res.json({
      success: true,
      message: 'Roles obtenidos correctamente',
      data: roles
    });
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener roles',
      error: error.message
    });
  }
});

/**
 * Ruta para obtener la lista de usuarios
 * GET /api/usuarios
 */
router.get('/usuarios', (req, res) => {
  try {
    // Lista de usuarios del sistema
    const usuarios = [
      { id: 1, nombre: 'Admin', email: 'admin@example.com', rolId: 3, activo: true },
      { id: 2, nombre: 'María García', email: 'maria@example.com', rolId: 1, activo: true },
      { id: 3, nombre: 'Juan Pérez', email: 'juan@example.com', rolId: 2, activo: true },
      { id: 4, nombre: 'Ana Rodríguez', email: 'ana@example.com', rolId: 2, activo: true },
      { id: 5, nombre: 'Luis Martínez', email: 'luis@example.com', rolId: 1, activo: true },
      { id: 6, nombre: 'Carlos Sánchez', email: 'carlos@example.com', rolId: 1, activo: false }
    ];

    res.json({
      success: true,
      message: 'Usuarios obtenidos correctamente',
      data: usuarios
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
});

module.exports = router;