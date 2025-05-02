// backend/models/Restaurante.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Restaurante = sequelize().define('Restaurante', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true
  },
  horarios: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  logo: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  enlace_compartido: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  informacion_pago: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  }
}, {
  tableName: 'restaurantes',
  timestamps: true,
  underscored: true
});

module.exports = Restaurante;
