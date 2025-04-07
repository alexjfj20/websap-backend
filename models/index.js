const { sequelize } = require('../config/database');
const Usuario = require('./Usuario');
const UsuarioRol = require('./UsuarioRol');
const Plato = require('./Plato');
const Restaurante = require('./Restaurante');

// Establecer relaciones entre modelos
Usuario.hasMany(UsuarioRol, { foreignKey: 'usuario_id', as: 'roles' });
UsuarioRol.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// Relaciones para restaurantes
Restaurante.hasMany(Usuario, { foreignKey: 'restaurante_id', as: 'usuarios' });
Usuario.belongsTo(Restaurante, { foreignKey: 'restaurante_id', as: 'restaurante' });

Restaurante.hasMany(Plato, { foreignKey: 'restaurante_id', as: 'platos' });
Plato.belongsTo(Restaurante, { foreignKey: 'restaurante_id', as: 'restaurante' });

// Exportar todos los modelos y la instancia de Sequelize
module.exports = {
  sequelize,
  Usuario,
  UsuarioRol,
  Plato,
  Restaurante,
  // Función para cerrar conexiones después de cada operación
  closeConnections: async () => {
    try {
      const { closeConnection } = require('../config/database');
      await closeConnection();
    } catch (error) {
      console.error('Error al cerrar conexiones:', error);
    }
  }
};
