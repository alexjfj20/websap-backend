// Archivo de conexión a la base de datos
// Este archivo es buscado por api.js

const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Imprimir información de diagnóstico
console.log('Iniciando conexión a la base de datos...');
console.log(`Directorio actual: ${__dirname}`);

// Configuración para la conexión a la base de datos
// Utiliza variables de entorno para datos sensibles
const sequelize = new Sequelize(
  process.env.DB_NAME || 'nombre_db',
  process.env.DB_USER || 'usuario_db',
  process.env.DB_PASSWORD || 'password_db',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: false,
    dialectOptions: {
      // Para conexiones SSL si es necesario
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Función para probar la conexión
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');
    return true;
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error);
    return false;
  }
}

// Exportamos la conexión y la función de prueba
module.exports = {
  sequelize,
  testConnection
};