/**
 * Script independiente para crear la tabla notificaciones
 * Este archivo puede ser incluido en server.js o ejecutado directamente
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Crea la tabla notificaciones si no existe
 * @returns {Promise<boolean>} true si la tabla existe o se creó correctamente, false en caso contrario
 */
async function createNotificacionesTable() {
  let connection;
  
  try {
    console.log('🔄 Verificando tabla notificaciones...');
    
    // Configuración de la conexión a la base de datos
    const dbConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
    
    // Crear conexión
    connection = await mysql.createConnection(dbConfig);
    
    // Verificar si la tabla ya existe
    const [checkTableResult] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'notificaciones'
    `);
    
    if (checkTableResult && checkTableResult.length > 0) {
      console.log('✅ La tabla notificaciones ya existe');
      return true;
    } else {
      // Crear la tabla notificaciones
      console.log('🔄 Creando tabla notificaciones...');
      await connection.query(`
        CREATE TABLE notificaciones (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tipo VARCHAR(50) NOT NULL,
          mensaje TEXT NOT NULL,
          datos TEXT,
          leido TINYINT(1) DEFAULT 0,
          usuario_id INT,
          creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX (tipo),
          INDEX (usuario_id),
          INDEX (leido),
          CONSTRAINT fk_notificaciones_usuario
            FOREIGN KEY (usuario_id) 
            REFERENCES usuarios(id)
            ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      
      console.log('✅ Tabla notificaciones creada correctamente');
      return true;
    }
  } catch (error) {
    console.error('❌ Error durante la creación de la tabla notificaciones:', error);
    return false;
  } finally {
    // Cerrar la conexión
    if (connection) {
      await connection.end();
      console.log('📌 Conexión cerrada');
    }
  }
}

// Si este archivo se ejecuta directamente, crear la tabla
if (require.main === module) {
  createNotificacionesTable()
    .then(result => {
      console.log('Resultado:', result ? 'Éxito' : 'Fallo');
      process.exit(result ? 0 : 1);
    })
    .catch(err => {
      console.error('Error general:', err);
      process.exit(1);
    });
}

// Exportar la función para poder usarla desde otros archivos
module.exports = { createNotificacionesTable };
