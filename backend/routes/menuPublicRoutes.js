// backend/routes/menuPublicRoutes.js

const express = require('express');
const router = express.Router();
const { Restaurante, Plato } = require('../models');

/**
 * Ruta pública para obtener el menú de un restaurante por su ID
 * GET /api/menu-publico/:restauranteId
 */
router.get('/:restauranteId', async (req, res) => {
  try {
    const restauranteId = req.params.restauranteId;
    
    console.log(`Solicitud de menú público para restaurante ID: ${restauranteId}`);
    
    if (!restauranteId) {
      console.log('ID de restaurante no proporcionado');
      return res.status(400).json({
        success: false,
        message: 'ID de restaurante no proporcionado'
      });
    }
    
    // Buscar el restaurante por ID
    let restaurante = await Restaurante.findByPk(restauranteId, {
      include: [
        {
          model: Plato,
          as: 'platos',
          attributes: ['id', 'nombre', 'descripcion', 'precio', 'imagen', 'categoria', 'disponible', 'especial']
        }
      ]
    });
    
    // Si no se encuentra el restaurante, intentar buscar cualquier restaurante disponible
    if (!restaurante) {
      console.log(`Restaurante con ID ${restauranteId} no encontrado. Buscando cualquier restaurante disponible.`);
      
      restaurante = await Restaurante.findOne({
        include: [
          {
            model: Plato,
            as: 'platos',
            attributes: ['id', 'nombre', 'descripcion', 'precio', 'imagen', 'categoria', 'disponible', 'especial']
          }
        ]
      });
      
      // Si aún no hay restaurantes disponibles, devolver datos de demostración
      if (!restaurante) {
        console.log('No se encontraron restaurantes. Devolviendo datos de demostración.');
        
        // Crear datos de demostración
        const demoData = {
          restaurante: {
            id: 'demo',
            nombre: 'Restaurante de Demostración',
            descripcion: 'Este es un restaurante de demostración para probar la aplicación',
            direccion: 'Calle Principal #123',
            telefono: '123-456-7890',
            logo: 'https://via.placeholder.com/150',
            horarios: 'Lunes a Domingo: 8:00 AM - 10:00 PM'
          },
          platos: [
            {
              id: 'demo-1',
              nombre: 'Hamburguesa Clásica',
              descripcion: 'Deliciosa hamburguesa con carne, queso, lechuga y tomate',
              precio: 15000,
              imagen: 'https://via.placeholder.com/300',
              categoria: 'Hamburguesas',
              disponible: true,
              especial: true
            },
            {
              id: 'demo-2',
              nombre: 'Pizza Margarita',
              descripcion: 'Pizza tradicional con salsa de tomate, queso mozzarella y albahaca',
              precio: 25000,
              imagen: 'https://via.placeholder.com/300',
              categoria: 'Pizzas',
              disponible: true,
              especial: false
            },
            {
              id: 'demo-3',
              nombre: 'Ensalada César',
              descripcion: 'Ensalada fresca con lechuga, pollo, crutones y aderezo césar',
              precio: 12000,
              imagen: 'https://via.placeholder.com/300',
              categoria: 'Ensaladas',
              disponible: true,
              especial: false
            }
          ]
        };
        
        return res.status(200).json({
          success: true,
          menu: demoData,
          demo: true
        });
      }
    }
    
    console.log(`Restaurante encontrado: ${restaurante.nombre}`);
    
    // Formatear la respuesta
    const menuData = {
      restaurante: {
        id: restaurante.id,
        nombre: restaurante.nombre,
        descripcion: restaurante.descripcion,
        direccion: restaurante.direccion,
        telefono: restaurante.telefono,
        logo: restaurante.logo,
        horarios: restaurante.horarios
      },
      platos: restaurante.platos.map(plato => ({
        id: plato.id,
        nombre: plato.nombre,
        descripcion: plato.descripcion,
        precio: plato.precio,
        imagen: plato.imagen,
        categoria: plato.categoria,
        disponible: plato.disponible,
        especial: plato.especial === true || plato.especial === 1
      }))
    };
    
    return res.status(200).json({
      success: true,
      menu: menuData
    });
    
  } catch (error) {
    console.error('Error al obtener menú público:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener menú público',
      error: error.message
    });
  }
});

module.exports = router;
