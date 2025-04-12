const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NombreModelo = sequelize.define('NombreModelo', {
  // Definición de los campos
}, {
  // Opciones del modelo
});

module.exports = NombreModelo; 