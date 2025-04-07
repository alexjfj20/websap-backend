const { DataTypes } = require('sequelize');
const { sequelize, Sequelize, Users } = require('../config/database');

const Pago = sequelize.define('Pago', {
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
  fecha_pago: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'pagado'),
    defaultValue: 'pendiente'
  },
  fecha_vencimiento: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
}, {
  tableName: 'pagos',
  timestamps: false
});

module.exports = Pago;

