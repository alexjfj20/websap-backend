const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');

(async () => {
  try {
    console.log('Intentando conectar con la base de datos...');

    const sequelize = new Sequelize(dbConfig.dbName, dbConfig.dbUser, dbConfig.dbPassword, {
      host: dbConfig.dbHost,
      dialect: 'mysql',
      port: dbConfig.dbPort,
      logging: false,
    });

    await sequelize.authenticate();
    console.log('Conexión exitosa con la base de datos.');

    await sequelize.close();
    console.log('Conexión cerrada correctamente.');
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error.message);
  }
})();
