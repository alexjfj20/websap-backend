const getUsers = async (req, res) => {
  try {
    // Simulación de datos de usuarios más completos
    const users = [
      { 
        id: 1, 
        nombre: 'Administrador', 
        email: 'admin@example.com',
        rol: 'SuperAdmin', 
        estado: 'activo',
        ultimo_acceso: new Date().toISOString(),
        fecha_registro: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      { 
        id: 2, 
        nombre: 'Usuario Estándar', 
        email: 'usuario@example.com',
        rol: 'Usuario', 
        estado: 'activo',
        ultimo_acceso: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_registro: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      },
      { 
        id: 3, 
        nombre: 'Empleado', 
        email: 'empleado@example.com',
        rol: 'Empleado', 
        estado: 'activo',
        ultimo_acceso: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_registro: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
      },
      { 
        id: 4, 
        nombre: 'Usuario Inactivo', 
        email: 'inactivo@example.com',
        rol: 'Usuario', 
        estado: 'inactivo',
        ultimo_acceso: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_registro: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    // Simular un pequeño retraso para probar el manejo de tiempos de espera
    setTimeout(() => {
      res.status(200).json({ success: true, data: users });
    }, 300);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
  }
};

const createUser = async (req, res) => {
  try {
    // Aquí iría la lógica para crear un usuario
    const newUser = req.body;
    // Simulamos que se ha creado con éxito
    res.status(201).json({ 
      success: true, 
      message: 'Usuario creado correctamente', 
      data: { ...newUser, id: Date.now() } // Simulamos un ID
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ success: false, message: 'Error al crear usuario' });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    // Aquí iría la lógica para actualizar un usuario
    res.status(200).json({ 
      success: true, 
      message: `Usuario con ID ${userId} actualizado correctamente` 
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    // Aquí iría la lógica para eliminar un usuario
    res.status(200).json({ 
      success: true, 
      message: `Usuario con ID ${userId} eliminado correctamente` 
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar usuario' });
  }
};

const getRoles = async (req, res) => {
  try {
    // Simulación de datos de roles más completos
    const roles = [
      {
        id: 1,
        nombre: 'SuperAdmin',
        descripcion: 'Acceso completo a todas las funcionalidades del sistema',
        permisos: ['crear', 'leer', 'actualizar', 'eliminar', 'administrar_usuarios', 'configurar_sistema']
      },
      {
        id: 2,
        nombre: 'Admin',
        descripcion: 'Administración de contenido y usuarios',
        permisos: ['crear', 'leer', 'actualizar', 'eliminar', 'administrar_usuarios']
      },
      {
        id: 3,
        nombre: 'Usuario',
        descripcion: 'Acceso básico al sistema',
        permisos: ['leer', 'actualizar_perfil']
      },
      {
        id: 4,
        nombre: 'Empleado',
        descripcion: 'Acceso a funciones operativas',
        permisos: ['leer', 'crear', 'actualizar']
      }
    ];
    
    // Simular un pequeño retraso para probar el manejo de tiempos de espera
    setTimeout(() => {
      res.status(200).json({ success: true, data: roles });
    }, 200);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ success: false, message: 'Error al obtener roles' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    // Obtener el ID del usuario desde el token (si está disponible)
    const userId = req.user ? req.user.id : 1;
    
    // Simulación de estadísticas del dashboard con datos más completos
    const stats = {
      totalUsers: 10,
      activeUsers: 8,
      inactiveUsers: 2,
      activePayments: 28,
      pendingPayments: 8,
      overduePayments: 3,
      totalIncome: 15750000,
      status: 'Normal',
      lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      recentActivity: [
        {
          tipo: 'user_login',
          usuario_nombre: 'Administrador',
          usuario_id: 1,
          accion: 'inició sesión en el sistema',
          fecha: new Date().toISOString()
        },
        {
          tipo: 'system',
          usuario_nombre: 'Sistema',
          accion: 'realizó una sincronización de datos',
          fecha: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        },
        {
          tipo: 'system',
          usuario_nombre: 'Sistema',
          accion: 'completó un respaldo automático',
          fecha: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };
    
    // Simular un retraso para probar el manejo de tiempos de espera en el frontend
    setTimeout(() => {
      res.status(200).json({ success: true, data: stats });
    }, 500);
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas del dashboard' });
  }
};

const getMenuItems = async (req, res) => {
  try {
    // Simulación de datos de elementos del menú más completos
    const menuItems = [
      {
        id: 1,
        nombre: 'Dashboard',
        ruta: '/admin',
        icono: 'dashboard',
        orden: 1,
        visible: true,
        requiere_permiso: 'ver_dashboard',
        submenu: []
      },
      {
        id: 2,
        nombre: 'Usuarios',
        ruta: '/admin/usuarios',
        icono: 'people',
        orden: 2,
        visible: true,
        requiere_permiso: 'administrar_usuarios',
        submenu: [
          {
            id: 21,
            nombre: 'Listado',
            ruta: '/admin/usuarios',
            icono: 'list',
            orden: 1,
            visible: true,
            requiere_permiso: 'ver_usuarios'
          },
          {
            id: 22,
            nombre: 'Crear Usuario',
            ruta: '/admin/usuarios/crear',
            icono: 'person_add',
            orden: 2,
            visible: true,
            requiere_permiso: 'crear_usuario'
          }
        ]
      },
      {
        id: 3,
        nombre: 'Configuración',
        ruta: '/admin/configuracion',
        icono: 'settings',
        orden: 3,
        visible: true,
        requiere_permiso: 'configurar_sistema',
        submenu: [
          {
            id: 31,
            nombre: 'General',
            ruta: '/admin/configuracion/general',
            icono: 'tune',
            orden: 1,
            visible: true,
            requiere_permiso: 'configurar_sistema'
          },
          {
            id: 32,
            nombre: 'Seguridad',
            ruta: '/admin/configuracion/seguridad',
            icono: 'security',
            orden: 2,
            visible: true,
            requiere_permiso: 'configurar_seguridad'
          }
        ]
      }
    ];
    
    // Simular un pequeño retraso para probar el manejo de tiempos de espera
    setTimeout(() => {
      res.status(200).json({ success: true, data: menuItems });
    }, 250);
  } catch (error) {
    console.error('Error al obtener elementos del menú:', error);
    res.status(500).json({ success: false, message: 'Error al obtener elementos del menú' });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  getDashboardStats,
  getMenuItems
};