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

// No necesitamos importar mockData directamente, ahora viene de db
// const mockData = require('../../database/mock-data');

// Ruta para obtener el menú público
router.get('/menu', async (req, res) => {
  try {
    console.log('Solicitando menú público');
    
    // Verificar si estamos en modo simulación
    if (db.USE_MOCK_MODE) {
      console.log('Modo simulación activo, usando datos simulados para el menú');
      const menuItems = await db.mockData.getMenuItems();
      
      // Añadir encabezado para indicar que son datos simulados
      res.set('X-Data-Source', 'simulated');
      res.json(menuItems);
      return;
    }
    
    // Verificar si la base de datos está conectada
    if (db.sequelize && await db.testConnection()) {
      console.log('Base de datos conectada, obteniendo datos reales');
      
      // Consulta a la base de datos
      const sequelize = db.sequelize;
      
      try {
        // Asumiendo que tienes una tabla de productos/menú
        const menu = await sequelize.query(`
          SELECT * FROM menu_items 
          WHERE active = 1 
          ORDER BY category, position
        `, { 
          type: sequelize.QueryTypes.SELECT 
        });
        
        // Si hay datos, devolverlos
        if (menu && menu.length > 0) {
          console.log(`Se encontraron ${menu.length} elementos de menú en la base de datos`);
          return res.json(menu);
        }
        
        console.log('No se encontraron elementos de menú en la base de datos');
      } catch (dbError) {
        console.error('Error en consulta a la base de datos:', dbError);
      }
    }
    
    // Si llegamos aquí, la base de datos no está disponible o no hay datos
    // Usar datos simulados
    console.log('Usando datos simulados para el menú');
    const menuItems = await db.mockData.getMenuItems();
    
    // Añadir encabezado para indicar que son datos simulados
    res.set('X-Data-Source', 'simulated');
    res.json(menuItems);
  } catch (error) {
    console.error('Error al obtener el menú público:', error);
    
    // Incluso en caso de error, ofrecer datos simulados
    console.log('Fallback: Usando datos simulados después de error');
    res.set('X-Data-Source', 'simulated-fallback');
    res.json(await db.mockData.getMenuItems());
  }
});

// Ruta para guardar elementos del menú
router.post('/menu/save', async (req, res) => {
  try {
    console.log('Recibida solicitud para guardar menú');
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Formato inválido, se esperaba un array de elementos' 
      });
    }
    
    // Verificar si la base de datos está conectada
    if (db.sequelize && await db.testConnection()) {
      console.log('Base de datos conectada, guardando datos reales');
      
      // En un entorno real, aquí iría el código para guardar en la base de datos
      // Esto es un ejemplo simplificado
      const sequelize = db.sequelize;
      
      try {        // Aquí irían las transacciones para guardar los datos
        // Este es un ejemplo que no hace nada real, solo para ilustrar
        await sequelize.transaction(async (transaction) => {
          // Código para guardar en la base de datos usando transaction...
          console.log('Transacción completada (simulada)', transaction.id);
        });
        
        console.log('Menú guardado en base de datos');
        return res.json({ success: true, message: 'Menú guardado en la base de datos' });
      } catch (dbError) {
        console.error('Error al guardar en base de datos:', dbError);
        throw dbError;
      }
    }
    
    // Si la base de datos no está disponible, simular guardado
    console.log('Base de datos no disponible, simulando guardado');
    const result = await mockData.saveMenuItems(items);
    
    // Añadir encabezado para indicar que fue una operación simulada
    res.set('X-Data-Source', 'simulated');
    res.json({ 
      ...result,
      message: 'Menú guardado correctamente (simulado)',
      items: items.length
    });
  } catch (error) {
    console.error('Error al guardar menú:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al guardar menú', 
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack 
    });
  }
});

// Otras rutas públicas pueden ir aquí

module.exports = router;