// Rutas públicas de la API (no requieren autenticación)
const express = require('express');
const router = express.Router();

// Importar la conexión a la base de datos con manejo de errores
let db;
try {
  console.log('Intentando importar el módulo de conexión a la base de datos para rutas públicas...');
  // Usar path.join para crear una ruta absoluta que funcione en cualquier entorno
  const path = require('path');
  const dbPath = path.join(__dirname, '../../database/connection');
  console.log(`Ruta de búsqueda para public-api: ${dbPath}`);
  
  db = require(dbPath);
  console.log('✅ Módulo de base de datos importado correctamente en public-api');
} catch (error) {
  console.error('❌ Error al importar el módulo de base de datos en public-api:', error);
  // Crear un objeto de sustitución para evitar errores
  db = {
    sequelize: null,
    testConnection: () => Promise.resolve(false)
  };
}

// Ruta para obtener el menú público
router.get('/menu', async (req, res) => {
  try {
    console.log('Solicitando menú público');
    
    // Consulta a la base de datos
    const sequelize = db.sequelize;
    
    // Asumiendo que tienes una tabla de productos/menú
    const menu = await sequelize.query(`
      SELECT * FROM menu_items 
      WHERE active = 1 
      ORDER BY category, position
    `, { 
      type: sequelize.QueryTypes.SELECT 
    });
    
    // Si no hay datos, devolver un array vacío en lugar de datos simulados
    if (!menu || menu.length === 0) {
      console.log('No se encontraron elementos de menú en la base de datos');
      return res.json([]);
    }
    
    console.log(`Se encontraron ${menu.length} elementos de menú`);
    res.json(menu);
  } catch (error) {
    console.error('Error al obtener el menú público:', error);
    res.status(500).json({ 
      error: 'Error al obtener el menú', 
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack 
    });
  }
});

// Otras rutas públicas pueden ir aquí

module.exports = router;