const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken } = require('../middleware/authMiddleware');

// Middleware de protección para todas las rutas
router.use(verifyToken);

// Ruta para obtener usuarios
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Ruta para obtener roles
router.get('/roles', adminController.getRoles);

// Ruta para obtener estadísticas del dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Ruta para obtener elementos del menú
router.get('/menu-items', adminController.getMenuItems);

module.exports = router;
