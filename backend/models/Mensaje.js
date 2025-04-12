const { DataTypes } = require('sequelize');
const { sequelize, Sequelize, Users } = require('../config/database');

const Mensaje = sequelize.define('Mensaje', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  tipo: {
    type: DataTypes.ENUM('estado_cuenta', 'aviso_pago', 'felicitacion_pago'),
    allowNull: false
  },
  contenido: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  fecha_envio: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'mensajes',
  timestamps: false
});

module.exports = Mensaje;

