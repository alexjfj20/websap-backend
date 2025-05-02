// Módulo de conexión a la base de datos MySQL
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Variables de entorno para la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'websap',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Variable para almacenar el pool de conexiones
let pool;

// Función para inicializar la conexión a la base de datos
async function initializeDatabase() {
  try {
    console.log('Iniciando conexión a la base de datos...');
    console.log(`Host: ${dbConfig.host}, Usuario: ${dbConfig.user}, Base de datos: ${dbConfig.database}`);
    
    // Crear el pool de conexiones
    pool = mysql.createPool(dbConfig);
    
    // Verificar la conexión
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos establecida correctamente');
    connection.release();
    
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message);
    
    // Si estamos en producción, activar el modo de simulación como fallback
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Activando modo de simulación como fallback');
      return false;
    }
    
    throw error;
  }
}

// Función para ejecutar consultas SQL
async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error en consulta SQL:', error);
    throw error;
  }
}

// Función para obtener el pool de conexiones
function getPool() {
  return pool;
}

// Exportar las funciones
module.exports = {
  initializeDatabase,
  query,
  getPool
};