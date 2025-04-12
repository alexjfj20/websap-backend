const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LogActividad = sequelize.define('LogActividad', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  accion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'log_actividades',
  timestamps: true,
  underscored: true
});

module.exports = LogActividad;

