import apiService from './apiService';

const DB_NAME = 'websapDatabase';
const DB_VERSION = 3; // Debe coincidir con el de storageService.js
const USERS_STORE = 'users';

// Abrir la conexión a la base de datos con manejo mejorado de errores
function openDatabase() {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        console.error('Error al abrir la base de datos:', event.target.error);
        reject('Error al abrir la base de datos: ' + event.target.errorCode);
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        // Verificar que el almacén de usuarios existe
        if (!db.objectStoreNames.contains(USERS_STORE)) {
          console.error(`El almacén ${USERS_STORE} no existe en la base de datos`);
          reject(new Error(`El almacén ${USERS_STORE} no existe en la base de datos`));
          return;
        }
        resolve(db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Crear almacén para usuarios si no existe
        if (!db.objectStoreNames.contains(USERS_STORE)) {
          console.log('Creando almacén de usuarios:', USERS_STORE);
          db.createObjectStore(USERS_STORE, { keyPath: 'id' });
        }
      };
    } catch (error) {
      console.error('Error crítico al abrir la base de datos:', error);
      reject(error);
    }
  });
}

/**
 * Obtiene la lista de usuarios desde IndexedDB
 * @returns {Promise<Array>} - Lista de usuarios
 */
export async function getUsersFromDB() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([USERS_STORE], 'readonly');
    const store = transaction.objectStore(USERS_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        // Verificar que request.result es un array antes de devolverlo
        const result = Array.isArray(request.result) ? request.result : [];
        console.log(`Obtenidos ${result.length} usuarios de la base de datos`);
        resolve(result);
      };
      
      request.onerror = (event) => {
        console.error('Error al obtener usuarios:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Error al obtener usuarios de IndexedDB:', error);
    // No intentar recuperar de localStorage, simplemente devolver un array vacío
    return []; 
  }
}

/**
 * Guardar un único usuario en IndexedDB
 * @param {Object} user - El usuario a guardar
 * @returns {Promise<boolean>} - Éxito de la operación
 */
export async function saveUserToDB(user) {
  try {
    if (!user || typeof user !== 'object') {
      throw new Error('Se requiere un objeto de usuario válido');
    }
    
    // Crear un nuevo objeto con solo las propiedades necesarias
    const cleanUser = {
      id: String(user.id || Date.now()),
      name: String(user.name || ''),
      email: String(user.email || ''),
      password: String(user.password || '')
    };
    
    // Verificar serializabilidad
    JSON.stringify(cleanUser); // Lanzará error si no es serializable
    
    const db = await openDatabase();
    const transaction = db.transaction([USERS_STORE], 'readwrite');
    const store = transaction.objectStore(USERS_STORE);
    
    return new Promise((resolve, reject) => {
      try {
        const addRequest = store.put(cleanUser); // Usar put en lugar de add para permitir actualizaciones
        
        addRequest.onsuccess = () => {
          console.log(`Usuario guardado con éxito: ${cleanUser.email}`);
          resolve(true);
        };
        
        addRequest.onerror = (event) => {
          console.error('Error específico al guardar usuario:', event.target.error);
          reject(event.target.error);
        };
      } catch (error) {
        console.error('Error en la operación de almacenamiento:', error);
        reject(error);
      }
    });
  } catch (error) {
    console.error('Error al guardar usuario en IndexedDB:', error);
    throw error;
  }
}

/**
 * Guardar múltiples usuarios en IndexedDB
 * @param {Array} users - Lista de usuarios a guardar
 * @returns {Promise<boolean>} - Éxito de la operación
 */
export async function saveUsersToDB(users) {
  if (!Array.isArray(users)) {
    throw new Error('La lista de usuarios debe ser un array');
  }
  
  try {
    // Guardar cada usuario individualmente para mayor control
    for (const user of users) {
      await saveUserToDB(user);
    }
    return true;
  } catch (error) {
    console.error('Error al guardar múltiples usuarios en IndexedDB:', error);
    throw error;
  }
}

/**
 * Obtiene todos los usuarios registrados
 * @returns {Promise<Array>} Lista de usuarios
 */
export async function getUsers() {
  try {
    const response = await apiService.get('/users');
    return response.data || [];
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
}

/**
 * Obtiene un usuario específico por ID
 * @param {string} userId ID del usuario
 * @returns {Promise<Object>} Datos del usuario
 */
export async function getUser(userId) {
  try {
    const response = await apiService.get(`/users/${userId}`);
    return response.data || null;
  } catch (error) {
    console.error(`Error al obtener usuario con ID ${userId}:`, error);
    throw error;
  }
}

/**
 * Crea un nuevo usuario
 * @param {Object} userData Datos del usuario
 * @returns {Promise<Object>} Usuario creado
 */
export async function createUser(userData) {
  try {
    const response = await apiService.post('/users', userData);
    return response.data || null;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
}

/**
 * Actualiza un usuario existente
 * @param {string} userId ID del usuario
 * @param {Object} userData Datos actualizados
 * @returns {Promise<Object>} Usuario actualizado
 */
export async function updateUser(userId, userData) {
  try {
    const response = await apiService.put(`/users/${userId}`, userData);
    return response.data || null;
  } catch (error) {
    console.error(`Error al actualizar usuario con ID ${userId}:`, error);
    throw error;
  }
}

/**
 * Elimina un usuario
 * @param {string} userId ID del usuario
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
export async function deleteUser(userId) {
  try {
    const response = await apiService.delete(`/users/${userId}`);
    return response.success || false;
  } catch (error) {
    console.error(`Error al eliminar usuario con ID ${userId}:`, error);
    throw error;
  }
}

/**
 * Cambia el estado de un usuario (activo/inactivo)
 * @param {string} userId ID del usuario
 * @param {string} estado 'activo' o 'inactivo'
 * @returns {Promise<Object>} Usuario actualizado
 */
export async function cambiarEstadoUsuario(userId, estado) {
  try {
    const response = await apiService.put(`/users/${userId}/estado`, { estado });
    return response.data || null;
  } catch (error) {
    console.error(`Error al cambiar estado del usuario ${userId}:`, error);
    throw error;
  }
}

/**
 * Asigna un rol a un usuario
 * @param {string} userId ID del usuario
 * @param {number} rolId ID del rol
 * @returns {Promise<Object>} Resultado de la asignación
 */
export async function asignarRol(userId, rolId) {
  try {
    const response = await apiService.post(`/users/${userId}/roles`, { rolId });
    return response.data || null;
  } catch (error) {
    console.error(`Error al asignar rol al usuario ${userId}:`, error);
    throw error;
  }
}

/**
 * Obtiene todos los roles disponibles
 * @returns {Promise<Array>} Lista de roles
 */
export async function getRoles() {
  try {
    const response = await apiService.get('/roles');
    return response.data || [];
  } catch (error) {
    console.error('Error al obtener roles:', error);
    throw error;
  }
}

export default {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  cambiarEstadoUsuario,
  asignarRol,
  getRoles
};
