require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('../models');
const Usuario = require('../models/Usuario');

async function seed() {
  try {
    // Conectar con la base de datos
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente');

    // Sincronizar modelos con la base de datos
    await sequelize.sync({ alter: true });
    
    // 1. Crear roles básicos del sistema
    const roles = [
      { nombre: 'Superadministrador' },
      { nombre: 'Administrador' },
      { nombre: 'Empleado' }
    ];

    for (const rolData of roles) {
      const [rol, created] = await Rol.findOrCreate({
        where: { nombre: rolData.nombre },
        defaults: rolData
      });
      
      if (created) {
        console.log(`Rol creado: ${rol.nombre}`);
      } else {
        console.log(`Rol existente: ${rol.nombre}`);
      }
    }

    // 2. Crear usuario superadministrador por defecto
    const superadminData = {
      nombre: 'Superadministrador',
      email: 'admin@websap.com',
      password_hash: await bcrypt.hash('Admin123!', 10),
      telefono: '3001234567',
      estado: 'activo'
    };

    const [superadmin, created] = await Usuario.findOrCreate({
      where: { email: superadminData.email },
      defaults: superadminData
    });

    if (created) {
      console.log(`Usuario superadmin creado: ${superadmin.email}`);
    } else {
      console.log(`Usuario superadmin existente: ${superadmin.email}`);
      // Actualizar password por si cambió
      superadmin.password_hash = superadminData.password_hash;
      await superadmin.save();
      console.log(`Password de superadmin actualizada`);
    }

    // 3. Asignar rol de superadministrador
    const rolSuperAdmin = await Rol.findOne({
      where: { nombre: 'Superadministrador' }
    });

    if (rolSuperAdmin) {
      await superadmin.addRol(rolSuperAdmin);
      console.log(`Rol de Superadministrador asignado a ${superadmin.email}`);
    }

    console.log('Seed completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error durante el seed:', error);
    process.exit(1);
  }
}

seed();
