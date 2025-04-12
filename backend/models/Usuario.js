const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Usuario = sequelize().define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: true
  },
  restaurante_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'restaurantes',
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  underscored: true
});

module.exports = Usuario;
