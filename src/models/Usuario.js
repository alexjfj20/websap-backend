import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelizeInstance'; // Asegúrate de que la ruta sea correcta

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  // Otros campos...
}, {
  tableName: 'users' // Asegúrate de que el nombre de la tabla sea 'users'
});

export default Usuario; 