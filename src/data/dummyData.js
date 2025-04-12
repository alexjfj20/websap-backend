// Datos dummy para usuarios
export const usuariosDummy = [
  {
    id: 1,
    nombre: 'Admin Usuario',
    email: 'admin@websap.com',
    rol: 'Administrador',
    estado: 'Activo',
    ultimoAcceso: '2023-12-15T10:30:00',
    avatar: '/img/avatars/admin.png'
  },
  {
    id: 2,
    nombre: 'Juan Pérez',
    email: 'jperez@ejemplo.com',
    rol: 'Operador',
    estado: 'Activo',
    ultimoAcceso: '2023-12-10T14:45:00',
    avatar: '/img/avatars/user1.png'
  },
  {
    id: 3,
    nombre: 'María López',
    email: 'mlopez@ejemplo.com',
    rol: 'Supervisor',
    estado: 'Inactivo',
    ultimoAcceso: '2023-11-28T09:15:00',
    avatar: '/img/avatars/user2.png'
  },
  {
    id: 4,
    nombre: 'Carlos Rodríguez',
    email: 'crodriguez@ejemplo.com',
    rol: 'Operador',
    estado: 'Activo',
    ultimoAcceso: '2023-12-14T16:20:00',
    avatar: '/img/avatars/user3.png'
  },
  {
    id: 5,
    nombre: 'Ana Martínez',
    email: 'amartinez@ejemplo.com',
    rol: 'Supervisor',
    estado: 'Activo',
    ultimoAcceso: '2023-12-13T11:10:00',
    avatar: '/img/avatars/user4.png'
  },
  {
    id: 6,
    nombre: 'Roberto Sánchez',
    email: 'rsanchez@ejemplo.com',
    rol: 'Operador',
    estado: 'Suspendido',
    ultimoAcceso: '2023-12-01T08:30:00',
    avatar: '/img/avatars/user5.png'
  },
  {
    id: 7,
    nombre: 'Laura González',
    email: 'lgonzalez@ejemplo.com',
    rol: 'Operador',
    estado: 'Activo',
    ultimoAcceso: '2023-12-12T13:45:00',
    avatar: '/img/avatars/user6.png'
  },
  {
    id: 8,
    nombre: 'Pedro Díaz',
    email: 'pdiaz@ejemplo.com',
    rol: 'Supervisor',
    estado: 'Inactivo',
    ultimoAcceso: '2023-11-15T10:05:00',
    avatar: '/img/avatars/user7.png'
  },
  {
    id: 9,
    nombre: 'Sofía Ruiz',
    email: 'sruiz@ejemplo.com',
    rol: 'Operador',
    estado: 'Activo',
    ultimoAcceso: '2023-12-09T09:30:00',
    avatar: '/img/avatars/user8.png'
  },
  {
    id: 10,
    nombre: 'Miguel Torres',
    email: 'mtorres@ejemplo.com',
    rol: 'Administrador',
    estado: 'Activo',
    ultimoAcceso: '2023-12-14T15:00:00',
    avatar: '/img/avatars/user9.png'
  }
];

// Datos dummy para roles
export const rolesDummy = [
  {
    id: 1,
    nombre: 'Administrador',
    descripcion: 'Acceso total al sistema',
    permisos: ['crear', 'editar', 'eliminar', 'ver']
  },
  {
    id: 2,
    nombre: 'Supervisor',
    descripcion: 'Acceso para supervisar operaciones',
    permisos: ['editar', 'ver']
  },
  {
    id: 3,
    nombre: 'Operador',
    descripcion: 'Acceso básico para operaciones diarias',
    permisos: ['ver']
  }
];