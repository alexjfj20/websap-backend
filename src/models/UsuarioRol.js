import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelizeInstance';
import Usuario from './Usuario';
import Rol from './Rol';

const UsuarioRol = sequelize.define('UsuarioRol', {
  // Definición de campos...
}, {
  tableName: 'usuario_roles'
});

UsuarioRol.belongsTo(Usuario, { foreignKey: 'usuario_id' });
UsuarioRol.belongsTo(Rol, { foreignKey: 'rol_id' });

export default UsuarioRol; 