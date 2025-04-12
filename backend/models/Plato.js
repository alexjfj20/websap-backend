// backend/models/Plato.js

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Plato = sequelize().define('Plato', {
  id: {
    type: DataTypes.STRING(100),
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  image: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  includesDrink: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    field: 'includesDrink' 
  },
  availableQuantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: 'availableQuantity' 
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true
  },
  syncStatus: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  lastSyncAttempt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  sync_problematic: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  },
  restaurante_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'restaurantes',
      key: 'id'
    }
  }
}, {
  tableName: 'platos', 
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: false 
});

module.exports = Plato;