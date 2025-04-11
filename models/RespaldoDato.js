const { DataTypes } = require('sequelize');
const { sequelize, Sequelize, Users } = require('../config/database');

const RespaldoDato = sequelize.define('RespaldoDato', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  tableName: 'respaldo_datos',
  timestamps: false
});

module.exports = RespaldoDato;

