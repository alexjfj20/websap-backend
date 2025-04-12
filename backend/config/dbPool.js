const mysql = require('mysql2/promise');
require('dotenv').config();

// Crear un pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'azul123',
  database: process.env.DB_NAME || 'websap',
  waitForConnections: true,
  connectionLimit: 10, // Limitar el número de conexiones simultáneas
  queueLimit: 0, // Sin límite en la cola de conexiones pendientes
  // Configuración para manejar conexiones inactivas
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000 // 10 segundos
});

// Función para obtener una conexión del pool
const getConnection = async () => {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('Error al obtener conexión del pool:', error);
    throw error;
  }
};

// Función para ejecutar una consulta y liberar la conexión automáticamente
const query = async (sql, params) => {
  let connection;
  try {
    connection = await getConnection();
    const [results] = await connection.query(sql, params);
    return results;
  } catch (error) {
    console.error('Error al ejecutar consulta:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release(); // Importante: liberar la conexión
    }
  }
};

// Función para cerrar el pool (útil al apagar el servidor)
const closePool = async () => {
  try {
    await pool.end();
    console.log('Pool de conexiones cerrado correctamente');
  } catch (error) {
    console.error('Error al cerrar el pool de conexiones:', error);
    throw error;
  }
};

module.exports = {
  pool,
  getConnection,
  query,
  closePool
};
