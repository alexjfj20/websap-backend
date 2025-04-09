// Script para ejecutar específicamente la migración de notificaciones
const { runMigration } = require('./notificaciones_migration');
const { pool } = require('../config/dbPool');

async function executeNotificacionesMigration() {
  try {
    console.log('Iniciando migración de la tabla notificaciones...');
    
    // Ejecutar la migración de notificaciones
    const result = await runMigration();
    
    console.log('Resultado de la migración:', result);
    console.log('Migración completada con éxito');
    
    // Cerrar la conexión a la base de datos
    await pool.end();
    
    process.exit(0);
  } catch (error) {
    console.error('Error durante la migración de notificaciones:', error);
    
    // Cerrar la conexión a la base de datos incluso en caso de error
    try {
      await pool.end();
    } catch (closeError) {
      console.error('Error al cerrar la conexión:', closeError);
    }
    
    process.exit(1);
  }
}

// Ejecutar la migración
executeNotificacionesMigration();
