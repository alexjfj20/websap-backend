const { DataTypes } = require('sequelize');
const { sequelize, Sequelize, Users } = require('../config/database');

const RespaldoDatos = sequelize.define('respaldo_datos', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  archivo: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  timestamps: false
});

module.exports = RespaldoDatos;

