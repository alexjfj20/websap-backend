const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); // Importar correctamente la instancia de Sequelize
const Usuario = require('./Usuario'); // Importar el modelo Usuario

const UsuarioRol = sequelize().define('UsuarioRol', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios', // Referenciar por nombre de tabla es más seguro
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  rol: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'usuario_roles', // Nombre de la tabla en la base de datos
  timestamps: true,
  underscored: true // Usar snake_case para los nombres de columnas
});

module.exports = UsuarioRol;
