import axios from 'axios';
import apiConfig from '../config/apiConfig';

// Configuración de API con URL base
const API_BASE_URL = apiConfig.API_URL;

// Variable global para trackear el conteo actualizado de usuarios
let currentUserCount = 0;
let lastUserCountUpdate = null;

// Configuración de IndexedDB
const DB_NAME = 'websap-admin-db';
const DB_VERSION = 1;
const STORE_USERS = 'users';
const STORE_ROLES = 'roles';

// Datos dummy para usuarios
const dummyUsers = [
  {
    id: 1,
    nombre: 'Administrador',
    email: 'admin@example.com',
    roles: ['Superadministrador'],
    estado: 'activo',
    fecha_creacion: new Date().toISOString()
  },
  {
    id: 2,
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    telefono: '3001234567',
    roles: ['Administrador'],
    estado: 'activo',
    fecha_creacion: new Date().toISOString()
  },
  {
    id: 3,
    nombre: 'María López',
    email: 'maria@example.com',
    telefono: '3112345678',
    roles: ['Empleado'],
    estado: 'activo',
    fecha_creacion: new Date().toISOString()
  },
  {
    id: 4,
    nombre: 'Carlos Rodríguez',
    email: 'carlos@example.com',
    roles: ['Empleado'],
    estado: 'inactivo',
    fecha_creacion: new Date().toISOString()
  }
];

// Datos dummy para roles
const dummyRoles = [
  { id: 1, nombre: 'Superadministrador', descripcion: 'Control total del sistema' },
  { id: 2, nombre: 'Administrador', descripcion: 'Gestión de usuarios y configuración' },
  { id: 3, nombre: 'Empleado', descripcion: 'Operaciones básicas' }
];

// Verificar y crear almacenes necesarios al inicializar la base de datos
const ensureStoresExist = (db) => {
  if (!db.objectStoreNames.contains(STORE_USERS)) {
    db.createObjectStore(STORE_USERS, { keyPath: 'id' });
    console.log(`Almacén '${STORE_USERS}' creado.`);
  }
  if (!db.objectStoreNames.contains(STORE_ROLES)) {
    db.createObjectStore(STORE_ROLES, { keyPath: 'id' });
    console.log(`Almacén '${STORE_ROLES}' creado.`);
  }
};

// Modificar initDB para garantizar la creación de almacenes
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      ensureStoresExist(db);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      ensureStoresExist(db); // Verificar almacenes en caso de que no se hayan creado
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('Error al abrir IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
};

// Guardar datos en IndexedDB
const saveToIndexedDB = async (storeName, data) => {
  try {
    const db = await initDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    // Si es un array, guardar cada elemento
    if (Array.isArray(data)) {
      for (const item of data) {
        store.put(item);
      }
    } else {
      store.put(data);
    }
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        console.log(`Datos guardados en ${storeName}`);
        resolve(true);
      };
      
      tx.onerror = (event) => {
        console.error(`Error al guardar en ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error(`Error general al guardar en ${storeName}:`, error);
    return false;
  }
};

// Obtener datos de IndexedDB
const getFromIndexedDB = async (storeName) => {
  try {
    const db = await initDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        const items = request.result;
        console.log(`Recuperados ${items.length} elementos de ${storeName}`);
        resolve(items);
      };
      
      request.onerror = (event) => {
        console.error(`Error al leer de ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error(`Error general al leer de ${storeName}:`, error);
    return null;
  }
};

// Obtener usuarios con la estrategia de tres niveles
export const getUsers = async (params = {}) => {
  try {
    console.log('Intentando obtener usuarios de la API...');
    // 1. Intentar obtener de la API usando la URL base configurada
    const url = `${API_BASE_URL}/admin/usuarios`;
    console.log(`Conectando a URL: ${url}`);
    const response = await axios.get(url, { params, timeout: 8000 });
    
    if (response.data && Array.isArray(response.data.data)) {
      // Guardar datos en IndexedDB para uso offline
      await saveToIndexedDB(STORE_USERS, response.data.data);
      
      // Actualizar conteo global de usuarios
      currentUserCount = response.data.data.length;
      lastUserCountUpdate = new Date();
      console.log(`Contador de usuarios actualizado: ${currentUserCount}`);
      
      return {
        success: true,
        message: 'Usuarios cargados desde API',
        data: response.data.data
      };
    }
    
    throw new Error('Formato de respuesta inválido');
    
  } catch (apiError) {
    console.warn('Error al obtener usuarios de la API:', apiError.message);
    
    try {
      // 2. Intentar obtener de IndexedDB
      console.log('Intentando obtener usuarios de IndexedDB...');
      const dbData = await getFromIndexedDB(STORE_USERS);
      
      if (dbData && dbData.length > 0) {
        console.log(`Recuperados ${dbData.length} usuarios de IndexedDB`);
        
        // Aplicar filtros si los hay
        let filteredData = [...dbData];
        
        if (params.searchTerm) {
          const searchTerm = params.searchTerm.toLowerCase();
          filteredData = filteredData.filter(user => 
            (user.nombre && user.nombre.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm))
          );
        }
        
        if (params.role) {
          filteredData = filteredData.filter(user => 
            user.roles && Array.isArray(user.roles) && user.roles.includes(params.role)
          );
        }
        
        if (params.status) {
          filteredData = filteredData.filter(user => user.estado === params.status);
        }
        
        return {
          success: true,
          message: 'Usuarios cargados desde almacenamiento local',
          data: filteredData,
          source: 'indexeddb'
        };
      }
      
      throw new Error('No hay datos en almacenamiento local');
      
    } catch (dbError) {
      console.warn('Error al obtener usuarios de IndexedDB:', dbError.message);
      
      // 3. Usar datos dummy
      console.log('Usando datos dummy para usuarios');
      
      // Aplicar filtros a datos dummy
      let filteredDummy = [...dummyUsers];
      
      if (params.searchTerm) {
        const searchTerm = params.searchTerm.toLowerCase();
        filteredDummy = filteredDummy.filter(user => 
          (user.nombre && user.nombre.toLowerCase().includes(searchTerm)) ||
          (user.email && user.email.toLowerCase().includes(searchTerm))
        );
      }
      
      if (params.role) {
        filteredDummy = filteredDummy.filter(user => 
          user.roles && Array.isArray(user.roles) && user.roles.includes(params.role)
        );
      }
      
      if (params.status) {
        filteredDummy = filteredDummy.filter(user => user.estado === params.status);
      }
      
      return {
        success: true,
        message: 'Usando datos de ejemplo',
        data: filteredDummy,
        source: 'dummy'
      };
    }
  }
};

// Obtener el conteo actualizado de usuarios
export const getUserCount = async () => {
  try {
    // Si tenemos un conteo reciente (menos de 5 minutos), devolverlo
    if (currentUserCount > 0 && lastUserCountUpdate) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (lastUserCountUpdate > fiveMinutesAgo) {
        console.log(`Devolviendo conteo en caché: ${currentUserCount} usuarios`);
        return {
          success: true,
          count: currentUserCount,
          source: 'cached'
        };
      }
    }
    
    // Si no tenemos un conteo reciente, obtener usuarios y contar
    const usersResponse = await getUsers();
    
    if (usersResponse.success && Array.isArray(usersResponse.data)) {
      currentUserCount = usersResponse.data.length;
      lastUserCountUpdate = new Date();
      console.log(`Conteo actualizado: ${currentUserCount} usuarios`);
      
      return {
        success: true,
        count: currentUserCount,
        source: usersResponse.source || 'api'
      };
    }
    
    return {
      success: false,
      count: 0,
      message: 'No se pudo obtener el conteo de usuarios'
    };
  } catch (error) {
    console.error('Error al obtener conteo de usuarios:', error);
    return {
      success: false,
      count: 0,
      message: 'Error al obtener conteo de usuarios'
    };
  }
};

// Obtener roles con la estrategia de tres niveles
export const getRoles = async () => {  try {
    console.log('Intentando obtener roles de la API...');
    // 1. Intentar obtener de la API usando la URL base configurada
    const url = `${API_BASE_URL}/admin/roles`;
    console.log(`Conectando a URL: ${url}`);
    const response = await axios.get(url, { timeout: 8000 });
    
    if (response.data && Array.isArray(response.data.data)) {
      // Guardar datos en IndexedDB para uso offline
      await saveToIndexedDB(STORE_ROLES, response.data.data);
      
      return {
        success: true,
        message: 'Roles cargados desde API',
        data: response.data.data
      };
    }
    
    throw new Error('Formato de respuesta inválido');
    
  } catch (apiError) {
    console.warn('Error al obtener roles de la API:', apiError.message);
    
    try {
      // 2. Intentar obtener de IndexedDB
      console.log('Intentando obtener roles de IndexedDB...');
      const dbData = await getFromIndexedDB(STORE_ROLES);
      
      if (dbData && dbData.length > 0) {
        console.log(`Recuperados ${dbData.length} roles de IndexedDB`);
        
        return {
          success: true,
          message: 'Roles cargados desde almacenamiento local',
          data: dbData,
          source: 'indexeddb'
        };
      }
      
      throw new Error('No hay datos en almacenamiento local');
      
    } catch (dbError) {
      console.warn('Error al obtener roles de IndexedDB:', dbError.message);
      
      // 3. Usar datos dummy
      console.log('Usando datos dummy para roles');
      
      return {
        success: true,
        message: 'Usando datos de ejemplo',
        data: dummyRoles,
        source: 'dummy'
      };
    }
  }
};

// Crear usuario
export const createUser = async (userData) => {
  try {
    const url = `${API_BASE_URL}/admin/usuarios`;
    console.log(`Conectando a URL: ${url}`);
    const response = await axios.post(url, userData);
    
    if (response.data && response.data.success) {
      // Si se creó exitosamente, añadir a IndexedDB
      if (response.data.data) {
        await saveToIndexedDB(STORE_USERS, response.data.data);
      }
      
      return response.data;
    }
    
    throw new Error(response.data?.message || 'Error al crear usuario');
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
};

// Actualizar usuario
export const updateUser = async (userId, userData) => {
  try {
    const url = `${API_BASE_URL}/admin/usuarios/${userId}`;
    console.log(`Conectando a URL: ${url}`);
    const response = await axios.put(url, userData);
    
    if (response.data && response.data.success) {
      // Si se actualizó exitosamente, actualizar en IndexedDB
      try {
        const db = await initDB();
        const tx = db.transaction(STORE_USERS, 'readwrite');
        const store = tx.objectStore(STORE_USERS);
        
        // Primero obtenemos el usuario existente
        const getRequest = store.get(userId);
        
        getRequest.onsuccess = () => {
          const existingUser = getRequest.result;
          if (existingUser) {
            // Actualizar solo los campos que vienen en userData
            const updatedUser = { ...existingUser, ...userData };
            store.put(updatedUser);
          }
        };
      } catch (dbError) {
        console.warn('Error al actualizar usuario en IndexedDB:', dbError);
      }
      
      return response.data;
    }
    
    throw new Error(response.data?.message || 'Error al actualizar usuario');
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
};

// Cambiar estado de usuario
export const cambiarEstadoUsuario = async (userId, estado) => {
  try {
    const url = `${API_BASE_URL}/admin/usuarios/${userId}/estado`;
    console.log(`Conectando a URL: ${url}`);
    const response = await axios.patch(url, { estado });
    
    if (response.data && response.data.success) {
      // Si se actualizó exitosamente, actualizar en IndexedDB
      try {
        const db = await initDB();
        const tx = db.transaction(STORE_USERS, 'readwrite');
        const store = tx.objectStore(STORE_USERS);
        
        // Primero obtenemos el usuario existente
        const getRequest = store.get(userId);
        
        getRequest.onsuccess = () => {
          const existingUser = getRequest.result;
          if (existingUser) {
            // Actualizar solo el campo estado
            existingUser.estado = estado;
            store.put(existingUser);
          }
        };
      } catch (dbError) {
        console.warn('Error al actualizar estado de usuario en IndexedDB:', dbError);
      }
      
      return response.data;
    }
    
    throw new Error(response.data?.message || 'Error al cambiar estado del usuario');
  } catch (error) {
    console.error('Error al cambiar estado de usuario:', error);
    throw error;
  }
};

// Eliminar usuario
export const deleteUser = async (userId) => {
  try {
    const url = `${API_BASE_URL}/admin/usuarios/${userId}`;
    console.log(`Conectando a URL: ${url}`);
    const response = await axios.delete(url);
    
    if (response.data && response.data.success) {
      // Si se eliminó exitosamente, eliminar de IndexedDB
      try {
        const db = await initDB();
        const tx = db.transaction(STORE_USERS, 'readwrite');
        const store = tx.objectStore(STORE_USERS);
        store.delete(userId);
      } catch (dbError) {
        console.warn('Error al eliminar usuario de IndexedDB:', dbError);
      }
      
      return response.data;
    }
    
    throw new Error(response.data?.message || 'Error al eliminar usuario');
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw error;
  }
};

// Obtener datos del dashboard con conteo actualizado de usuarios
export const obtenerDatosDashboard = async () => {
  try {
    console.log('Obteniendo datos para el dashboard...');
    
    // Obtenemos el conteo actualizado de usuarios
    const userCountResult = await getUserCount();
    const totalUsuarios = userCountResult.success ? userCountResult.count : 0;
    
    console.log(`Dashboard utilizando conteo de usuarios: ${totalUsuarios}`);
    
    // Datos simulados para el dashboard
    return {
      success: true,
      data: {
        estadisticas: {
          totalUsuarios: totalUsuarios,
          totalRestaurantes: 35,
          totalPedidos: 128,
          totalVentas: 4750000
        },
        graficoVentas: [
          { mes: 'Ene', ventas: 450000 },
          { mes: 'Feb', ventas: 520000 },
          { mes: 'Mar', ventas: 480000 },
          { mes: 'Abr', ventas: 620000 },
          { mes: 'May', ventas: 580000 },
          { mes: 'Jun', ventas: 630000 }
        ],
        restaurantesPopulares: [
          { nombre: 'Restaurante A', pedidos: 42 },
          { nombre: 'Restaurante B', pedidos: 38 },
          { nombre: 'Restaurante C', pedidos: 27 },
          { nombre: 'Restaurante D', pedidos: 21 },
          { nombre: 'Restaurante E', pedidos: 18 }
        ],
        usuariosActivos: [
          { nombre: 'Juan Pérez', rol: 'Administrador', ultimoAcceso: new Date().toISOString() },
          { nombre: 'María López', rol: 'Empleado', ultimoAcceso: new Date().toISOString() },
          { nombre: 'Carlos Rodríguez', rol: 'Empleado', ultimoAcceso: new Date().toISOString() }
        ],
        fechaActualizacion: new Date().toISOString()
      },
      message: 'Datos del dashboard obtenidos correctamente'
    };
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    return {
      success: false,
      message: 'Error al obtener datos del dashboard',
      error: error.message
    };
  }
};

// Exportar servicios para Admin Dashboard con alias
export {
  getUsers as obtenerUsuarios,
  getRoles as obtenerRoles
};

// Exportación por defecto para compatibilidad
const adminService = {
  getUsers,
  getRoles,
  createUser,
  updateUser,
  cambiarEstadoUsuario,
  deleteUser
};

export default adminService;