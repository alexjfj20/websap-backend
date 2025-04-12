const mysql = require('mysql2/promise');

// Configuración de conexión a MySQL
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'azul123',
  database: process.env.DB_NAME || 'restaurante',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificar conexión
db.getConnection()
  .then(() => console.log('✅ Conectado a la base de datos'))
  .catch(err => console.error('❌ Error al conectar a la base de datos:', err));

module.exports = db;
