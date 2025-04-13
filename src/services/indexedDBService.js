import { openDB } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import apiConfig from '../config/apiConfig';

const API_BASE_URL = apiConfig.API_DOMAIN; // URL base para la API
const DB_NAME = 'restauranteAppDB'; // Usar este nombre para todas las operaciones
const DB_VERSION = 4; // Incrementar la versión para forzar una actualización del esquema
const PLATOS_STORE = 'platos'; // Usar 'platos' en lugar de 'menuItems'
const SYNC_QUEUE_STORE = 'syncQueue';

// Inicializar la base de datos
const initDB = () => {
  return new Promise((resolve, reject) => {
    console.log(`Intentando abrir la base de datos con versión: ${DB_VERSION}`);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('Error al abrir la base de datos IndexedDB:', event);
      reject('Error al abrir la base de datos');
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      console.log('IndexedDB inicializada correctamente');
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log('Actualizando estructura de la base de datos...');
      
      // Crear almacén para platos si no existe
      if (!db.objectStoreNames.contains(PLATOS_STORE)) {
        console.log('Creando almacén de platos...');
        // Quitar autoIncrement para permitir IDs personalizados
        const platosStore = db.createObjectStore(PLATOS_STORE, { keyPath: 'id' });
        platosStore.createIndex('name', 'name', { unique: false });
        platosStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        console.log('Almacén de platos creado');
      } else {
        console.log('El almacén de platos ya existe');
        
        // Si necesitamos modificar un almacén existente, primero hay que eliminarlo
        // y luego volver a crearlo con la nueva configuración
        try {
          db.deleteObjectStore(PLATOS_STORE);
          console.log('Almacén de platos eliminado para recreación');
          
          const platosStore = db.createObjectStore(PLATOS_STORE, { keyPath: 'id' });
          platosStore.createIndex('name', 'name', { unique: false });
          platosStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          console.log('Almacén de platos recreado con nueva configuración');
        } catch (error) {
          console.error('Error al intentar modificar el almacén de platos:', error);
        }
      }
      
      // Crear almacén para la cola de sincronización si no existe
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        console.log('Creando almacén de cola de sincronización...');
        const syncQueueStore = db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
        syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncQueueStore.createIndex('type', 'type', { unique: false });
        console.log('Almacén de cola de sincronización creado');
      } else {
        console.log('El almacén de cola de sincronización ya existe');
      }
    };
  });
};

// Abrir conexión a la base de datos
const openDatabase = async () => {
  try {
    return await initDB();
  } catch (error) {
    console.error('Error al abrir conexión a IndexedDB:', error);
    throw error;
  }
};

// Obtener todos los platos de IndexedDB
const getAllPlatos = async () => {
  try {
    console.log('Obteniendo todos los platos de IndexedDB...');
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PLATOS_STORE], 'readonly');
      const store = transaction.objectStore(PLATOS_STORE);
      const request = store.getAll();
      
      request.onsuccess = (event) => {
        const allPlatos = event.target.result;
        console.log(`Obtenidos ${allPlatos.length} platos totales de IndexedDB`);
        
        // Filtrar platos eliminados
        const activePlatos = allPlatos.filter(plato => !plato.deleted);
        console.log(`Filtrando platos eliminados: ${allPlatos.length - activePlatos.length} platos ocultos, ${activePlatos.length} platos activos`);
        
        resolve(activePlatos);
      };
      
      request.onerror = (event) => {
        console.error('Error al obtener platos de IndexedDB:', event);
        reject('Error al obtener platos localmente');
      };
    });
  } catch (error) {
    console.error('Error en getAllPlatos:', error);
    throw error;
  }
};

// Obtener platos pendientes de sincronización
const getPendingPlatos = async () => {
  try {
    console.log('Buscando platos pendientes de sincronización...');
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PLATOS_STORE], 'readonly');
      const store = transaction.objectStore(PLATOS_STORE);
      const index = store.index('syncStatus');
      const request = index.getAll('pending');
      
      request.onsuccess = (event) => {
        const pendingPlatos = event.target.result;
        console.log(`Encontrados ${pendingPlatos.length} platos pendientes de sincronización`);
        resolve(pendingPlatos);
      };
      
      request.onerror = (event) => {
        console.error('Error al obtener platos pendientes:', event);
        reject('Error al obtener platos pendientes');
      };
    });
  } catch (error) {
    console.error('Error en getPendingPlatos:', error);
    throw error;
  }
};

// Actualizar estado de sincronización de un plato
const updatePlatoSyncStatus = async (id, status) => {
  console.log(`Actualizando estado de sincronización del plato ID ${id} a "${status}"...`);
  
  // Convertir booleanos a strings para compatibilidad
  let validStatus = status;
  if (typeof status === 'boolean') {
    validStatus = status === true ? 'synced' : 'pending';
    console.log(`Convertido estado booleano ${status} a "${validStatus}"`);
  }
  
  // Validar que el estado sea uno de los permitidos
  const validStatuses = ['pending', 'synced', 'pending_deletion'];
  if (!validStatuses.includes(validStatus)) {
    throw new Error(`Estado inválido: ${status}. Debe ser uno de: ${validStatuses.join(', ')}`);
  }
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('Error al abrir la base de datos:', event.target.error);
      reject(new Error('No se pudo abrir la base de datos para actualizar el estado.'));
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      
      try {
        const transaction = db.transaction([PLATOS_STORE], 'readwrite');
        const platosStore = transaction.objectStore(PLATOS_STORE);
        
        // Obtener el plato primero
        const getRequest = platosStore.get(id);
        
        getRequest.onerror = (event) => {
          console.error(`Error al obtener plato ID ${id}:`, event.target.error);
          reject(new Error(`No se pudo obtener el plato ID ${id}.`));
        };
        
        getRequest.onsuccess = (event) => {
          const plato = event.target.result;
          
          if (!plato) {
            console.error(`No se encontró plato con ID ${id}.`);
            reject(new Error(`No se encontró plato con ID ${id}.`));
            return;
          }
          
          // Actualizar el estado de sincronización
          plato.syncStatus = validStatus;
          
          // Si es pending_deletion, marcar como no disponible también
          if (validStatus === 'pending_deletion') {
            plato.is_available = false;
          }
          
          // Guardar el plato actualizado
          const updateRequest = platosStore.put(plato);
          
          updateRequest.onerror = (event) => {
            console.error(`Error al actualizar plato ID ${id}:`, event.target.error);
            reject(new Error(`No se pudo actualizar el estado del plato ID ${id}.`));
          };
          
          updateRequest.onsuccess = () => {
            console.log(`Estado de sincronización del plato ID ${id} actualizado a "${validStatus}".`);
            resolve(true);
          };
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      } catch (error) {
        console.error('Error en la transacción:', error);
        reject(error);
      }
    };
  });
};

// Agregar elemento a la cola de sincronización
const addToSyncQueue = async (item) => {
  try {
    console.log('Agregando elemento a la cola de sincronización:', item);
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      
      const request = store.add(item);
      
      request.onsuccess = (event) => {
        console.log('Elemento agregado a la cola de sincronización');
        resolve(event.target.result);
      };
      
      request.onerror = (event) => {
        console.error('Error al agregar a la cola de sincronización:', event);
        reject('Error al agregar a la cola de sincronización');
      };
    });
  } catch (error) {
    console.error('Error en addToSyncQueue:', error);
    throw error;
  }
};

// Obtener elementos de la cola de sincronización
const getSyncQueue = async () => {
  try {
    console.log('Obteniendo cola de sincronización...');
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_QUEUE_STORE], 'readonly');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.getAll();
      
      request.onsuccess = (event) => {
        const queue = event.target.result;
        console.log(`Obtenidos ${queue.length} elementos de la cola de sincronización`);
        resolve(queue);
      };
      
      request.onerror = (event) => {
        console.error('Error al obtener cola de sincronización:', event);
        reject('Error al obtener cola de sincronización');
      };
    });
  } catch (error) {
    console.error('Error en getSyncQueue:', error);
    throw error;
  }
};

// Eliminar elemento de la cola de sincronización
const removeFromSyncQueue = async (id) => {
  try {
    console.log(`Eliminando elemento ${id} de la cola de sincronización...`);
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      
      const request = store.delete(id);
      
      request.onsuccess = () => {
        console.log(`Elemento ${id} eliminado de la cola de sincronización`);
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error('Error al eliminar de la cola de sincronización:', event);
        reject('Error al eliminar de la cola de sincronización');
      };
    });
  } catch (error) {
    console.error('Error en removeFromSyncQueue:', error);
    throw error;
  }
};

// Eliminar un plato de IndexedDB y sincronizar con el servidor
const deletePlato = async (id) => {
  try {
    console.log(`Iniciando proceso de eliminación para plato ID: ${id}`);
    
    // Verificar si estamos en línea
    const online = typeof navigator !== 'undefined' && navigator.onLine;
    
    if (online) {
      try {
        console.log(`Enviando solicitud al servidor para eliminar plato ID: ${id}`);
        
        // Usamos una URL absoluta para asegurarnos de que la solicitud llegue al servidor correcto
        const serverUrl = 'http://localhost:3000/api/sync/platos';
        console.log(`URL completa para sincronización: ${serverUrl}`);
        
        // Enviar una solicitud POST con operation=delete en lugar de DELETE
        // Esto es más compatible con algunos servidores y proxies
        const response = await fetch(serverUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: id,
            operation: 'delete'
          })
        });
        
        // Registrar detalles completos de la respuesta para depuración
        console.log(`Respuesta del servidor: Status ${response.status}`);
        let responseText = '';
        try {
          responseText = await response.text();
          console.log(`Respuesta completa: ${responseText}`);
          const data = JSON.parse(responseText);
          
          if (response.ok) {
            console.log(`✅ Plato ID ${id} eliminado con éxito del servidor:`, data);
            
            // Si se eliminó correctamente del servidor, ahora lo eliminamos de IndexedDB
            await deleteFromIndexedDB(id);
            return true;
          } else {
            console.error(`❌ Error al eliminar plato ID ${id} del servidor:`, data);
            // Si hay error en el servidor, marcamos para eliminación y eliminamos localmente
            await markPlatoForDeletion(id);
            return true;
          }
        } catch (parseError) {
          console.error(`Error al procesar respuesta: ${responseText}`, parseError);
          await markPlatoForDeletion(id);
          return true;
        }
      } catch (syncError) {
        console.error(`❌ Error de red al sincronizar eliminación del plato ID ${id}:`, syncError);
        // Si hay error de red, marcamos para eliminación y eliminamos localmente
        await markPlatoForDeletion(id);
        return true;
      }
    } else {
      console.log(`Sin conexión a internet, marcando plato ID ${id} para eliminación futura`);
      // Si estamos offline, marcamos para eliminación y eliminamos localmente
      await markPlatoForDeletion(id);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error general al eliminar plato ID ${id}:`, error);
    throw error;
  }
};

// Función auxiliar para eliminar un plato solo de IndexedDB
const deleteFromIndexedDB = async (id) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('Error al abrir la base de datos:', event.target.error);
      reject(new Error('No se pudo abrir la base de datos para eliminar el plato'));
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      
      try {
        const transaction = db.transaction([PLATOS_STORE], 'readwrite');
        const platosStore = transaction.objectStore(PLATOS_STORE);
        
        const deleteRequest = platosStore.delete(id);
        
        deleteRequest.onerror = (event) => {
          console.error(`Error al eliminar plato ID ${id}:`, event.target.error);
          reject(new Error(`No se pudo eliminar el plato ID ${id}`));
        };
        
        deleteRequest.onsuccess = () => {
          console.log(`Plato ID ${id} eliminado con éxito de IndexedDB`);
          resolve(true);
        };
        
        transaction.oncomplete = () => {
          db.close();
        };
      } catch (error) {
        console.error('Error en la transacción:', error);
        reject(error);
      }
    };
  });
};

// Función para marcar un plato para eliminación
const markPlatoForDeletion = async (id) => {
  try {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    return new Promise((resolve, reject) => {
      request.onerror = (event) => {
        console.error('Error al abrir la base de datos:', event.target.error);
        reject(new Error('No se pudo abrir la base de datos'));
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        
        try {
          const transaction = db.transaction([PLATOS_STORE], 'readwrite');
          const platosStore = transaction.objectStore(PLATOS_STORE);
          
          // Primero obtenemos el plato
          const getRequest = platosStore.get(id);
          
          getRequest.onerror = (event) => {
            console.error(`Error al obtener plato ID ${id}:`, event.target.error);
            reject(new Error(`No se pudo obtener el plato ID ${id}`));
          };
          
          getRequest.onsuccess = (event) => {
            const plato = event.target.result;
            
            if (!plato) {
              console.warn(`Plato ID ${id} no encontrado, no se puede marcar para eliminación`);
              resolve(false);
              return;
            }
            
            // Marcar para eliminación
            plato.syncStatus = 'pending_deletion';
            plato.updated_at = new Date().toISOString();
            
            // Guardar los cambios
            const updateRequest = platosStore.put(plato);
            
            updateRequest.onerror = (event) => {
              console.error(`Error al marcar plato ID ${id} para eliminación:`, event.target.error);
              reject(new Error(`No se pudo marcar el plato ID ${id} para eliminación`));
            };
            
            updateRequest.onsuccess = () => {
              console.log(`Plato ID ${id} marcado para eliminación`);
              
              // Ahora lo eliminamos de la vista del usuario (pero se mantiene en la base de datos para sincronización)
              // Esto se hace añadiendo un flag 'deleted' que usamos para filtrar en las consultas
              plato.deleted = true;
              const finalUpdateRequest = platosStore.put(plato);
              
              finalUpdateRequest.onsuccess = () => {
                console.log(`Plato ID ${id} marcado como eliminado para el usuario`);
                resolve(true);
              };
              
              finalUpdateRequest.onerror = (event) => {
                console.error(`Error al marcar plato ID ${id} como eliminado:`, event.target.error);
                reject(new Error(`No se pudo marcar el plato ID ${id} como eliminado`));
              };
            };
          };
          
          transaction.oncomplete = () => {
            db.close();
          };
        } catch (error) {
          console.error('Error en la transacción:', error);
          reject(error);
        }
      };
    });
  } catch (error) {
    console.error(`Error general al marcar plato ID ${id} para eliminación:`, error);
    throw error;
  }
};

// Añadir esto al principio del archivo para depuración
const logDB = async () => {
  const db = await openDB();
  console.log('Bases de datos disponibles:', db.name, 'versión:', db.version);
  console.log('Almacenes disponibles:', Array.from(db.objectStoreNames));
};

// Y llamarlo periódicamente para verificar
setInterval(logDB, 10000);

// Verificar si un plato fue guardado correctamente (con timeout)
const verifyPlatoStorage = async (id) => {
  try {
    console.log(`Verificando almacenamiento del plato ID ${id}...`);
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PLATOS_STORE], 'readonly');
      const store = transaction.objectStore(PLATOS_STORE);
      const request = store.get(id);
      
      request.onsuccess = (event) => {
        const plato = event.target.result;
        if (plato) {
          console.log(`Verificación exitosa: Plato ID ${id} encontrado en IndexedDB:`, plato);
          resolve(plato);
        } else {
          console.error(`Verificación fallida: Plato ID ${id} NO encontrado en IndexedDB`);
          resolve(null);
        }
      };
      
      request.onerror = (event) => {
        console.error(`Error al verificar plato ID ${id}:`, event.target.error);
        reject(new Error(`Error al verificar plato ID ${id}: ${event.target.error.message}`));
      };
      
      transaction.oncomplete = () => {
        console.log('Transacción de verificación completada');
      };
    });
  } catch (error) {
    console.error('Error en verifyPlatoStorage:', error);
    throw error;
  }
};

/**
 * Crea un nuevo plato en la base de datos
 * @param {Object} plato - Datos del plato a crear
 * @returns {Promise<Object>} - Plato creado con su ID asignado
 */
async function createPlato(plato) {
  console.log('🍽️ INICIO - Creando nuevo plato en IndexedDB:', plato);
  
  try {
    // Validación de datos
    if (!plato || typeof plato !== 'object') {
      console.error('❌ ERROR: El plato debe ser un objeto válido', plato);
      throw new Error('El plato debe ser un objeto válido');
    }
    
    if (!plato.name || plato.name.trim() === '') {
      console.error('❌ ERROR: El plato debe tener un nombre válido', plato);
      throw new Error('El plato debe tener un nombre válido');
    }
    
    console.log('✅ Validación inicial del plato exitosa');
    
    // Abrimos la BD con registro detallado
    console.log('🔄 Abriendo base de datos...');
    const db = await openDB();
    console.log('✅ Base de datos abierta correctamente');
    
    return new Promise((resolve, reject) => {
      console.log('🔄 Iniciando transacción para guardar plato...');
      
      try {
        const transaction = db.transaction([PLATOS_STORE], 'readwrite');
        console.log('✅ Transacción creada correctamente');
        
        const store = transaction.objectStore(PLATOS_STORE);
        console.log('✅ Almacén obtenido correctamente');
        
        // Preparar el plato con todos los campos necesarios
        const platoToCreate = {
          ...plato,
          createdAt: plato.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending',
          localTimestamp: new Date().getTime()
        };
        
        // Asegurarse de que el plato tenga un ID
        if (!platoToCreate.id) {
          platoToCreate.id = `plato_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
          console.log(`🆔 Generando ID para el plato: ${platoToCreate.id}`);
        }
        
        console.log('📦 Intentando guardar plato con datos:', platoToCreate);
        // Usar put en lugar de add para actualizar si el ID ya existe
        const request = store.put(platoToCreate);
        
        request.onsuccess = async (event) => {
          // El ID ahora viene del objeto, no del evento
          const id = platoToCreate.id;
          console.log(`✅ ÉXITO: Plato guardado con ID: ${id}`);
          
          // Crear objeto completo con el ID
          const createdPlato = { ...platoToCreate };
          
          // Agregar a la cola de sincronización
          try {
            console.log('🔄 Agregando plato a cola de sincronización...');
            await addToSyncQueue({
              type: 'create',
              entityType: 'plato',
              entityId: id,
              data: createdPlato,
              timestamp: new Date().getTime()
            });
            console.log('✅ Plato agregado a la cola de sincronización correctamente');
          } catch (syncError) {
            console.warn('⚠️ Error al agregar a cola de sincronización:', syncError);
            // Continuamos a pesar de error en cola
          }
          
          // Verificación inmediata para depuración
          console.log('🔍 Verificando inmediatamente el almacenamiento del plato...');
          try {
            const platos = await getAllPlatos();
            console.log(`📊 Total de platos en BD: ${platos.length}`);
            console.log('📋 Lista de platos:', platos);
            
            const found = platos.find(p => p.id === id);
            if (found) {
              console.log('✅ VERIFICACIÓN EXITOSA: Plato encontrado en la lista completa');
            } else {
              console.error('❌ VERIFICACIÓN FALLIDA: Plato NO encontrado en la lista completa');
            }
          } catch (listError) {
            console.error('❌ Error al listar platos para verificación:', listError);
          }
          
          // Verificación posterior para asegurar persistencia
          setTimeout(async () => {
            try {
              console.log(`🔍 Verificando persistencia del plato ID ${id}...`);
              const verified = await verifyPlatoStorage(id);
              if (verified) {
                console.log('✅ VERIFICACIÓN POSTERIOR: Plato confirmado en base de datos');
              } else {
                console.error('❌ VERIFICACIÓN POSTERIOR FALLIDA: Plato no encontrado en verificación');
              }
            } catch (verifyError) {
              console.error('❌ Error en verificación posterior:', verifyError);
            }
          }, 1000);
          
          console.log('🏁 Finalizando creación del plato con éxito');
          resolve(createdPlato);
        };
        
        request.onerror = (event) => {
          console.error('❌ ERROR al crear plato:', event.target.error);
          reject(new Error(`Error al crear plato: ${event.target.error.message}`));
        };
        
        transaction.onerror = (event) => {
          console.error('❌ ERROR en transacción:', event.target.error);
          reject(new Error(`Error en transacción: ${event.target.error.message}`));
        };
        
        transaction.oncomplete = () => {
          console.log('✅ Transacción completada correctamente');
        };
      } catch (transactionError) {
        console.error('❌ ERROR al crear transacción:', transactionError);
        reject(new Error(`Error al crear transacción: ${transactionError.message}`));
      }
    });
  } catch (error) {
    console.error('❌ ERROR GENERAL en createPlato:', error);
    throw error;
  }
}

/**
 * Función de depuración para verificar el contenido de la base de datos
 * @returns {Promise<void>}
 */
async function debugIndexedDB() {
  console.log('🔍 INICIANDO DEPURACIÓN DE INDEXEDDB...');
  
  try {
    // Verificar la existencia de la base de datos
    const databases = await window.indexedDB.databases();
    console.log('📊 Bases de datos disponibles:', databases);
    
    // Abrir la base de datos y verificar su estructura
    const db = await openDB();
    console.log('📦 Almacenes en la base de datos:', Array.from(db.objectStoreNames));
    
    // Verificar contenido del almacén de platos
    const platos = await getAllPlatos();
    console.log(`📋 Platos almacenados (${platos.length}):`, platos);
    
    // Verificar cola de sincronización
    const syncQueue = await getSyncQueue();
    console.log(`🔄 Cola de sincronización (${syncQueue.length}):`, syncQueue);
    
    console.log('✅ DEPURACIÓN COMPLETADA');
    return {
      databases,
      stores: Array.from(db.objectStoreNames),
      platos,
      syncQueue
    };
  } catch (error) {
    console.error('❌ ERROR EN DEPURACIÓN:', error);
    throw error;
  }
}

/**
 * Función auxiliar para asegurar que los datos del plato sean consistentes antes de guardar
 * @param {Object} platoData - Datos del plato a guardar
 * @returns {Object} Datos del plato normalizados
 */
function normalizePlatoData(platoData) {
  // Crear una copia para no modificar el original
  const normalizedData = { ...platoData };
  
  // Asegurar que los campos necesarios tengan valores válidos
  normalizedData.name = normalizedData.name?.trim() || 'Plato sin nombre';
  normalizedData.price = typeof normalizedData.price === 'string' 
    ? parseFloat(normalizedData.price) || 0 
    : (normalizedData.price || 0);
  normalizedData.is_available = normalizedData.is_available !== false;
  normalizedData.availableQuantity = parseInt(normalizedData.availableQuantity) || 0;
  normalizedData.includesDrink = normalizedData.includesDrink === true;
  
  // Asegurar que los campos de fecha estén presentes
  if (!normalizedData.createdAt) normalizedData.createdAt = new Date().toISOString();
  normalizedData.updatedAt = new Date().toISOString();
  
  // Añadir estado de sincronización si no existe
  if (!normalizedData.syncStatus) normalizedData.syncStatus = 'pending';
  
  // Limitar el tamaño de la imagen si existe (para evitar error 431)
  if (normalizedData.image && typeof normalizedData.image === 'string' && 
      normalizedData.image.length > 200000) { // Si es mayor a ~200KB
    console.warn('⚠️ Imagen demasiado grande, se reducirá para evitar problemas de sincronización');
    
    // Crear miniatura para sincronización
    normalizedData.image_thumbnail = compressImageForSync(normalizedData.image);
    
    // Marcar que la imagen original está almacenada localmente
    normalizedData.has_local_image = true;
  }
  
  return normalizedData;
}

/**
 * Función para comprimir imágenes y reducir su tamaño para sincronización
 * @param {string} imageDataUrl - Imagen en formato data URL (base64)
 * @returns {string} Imagen comprimida como data URL
 */
function compressImageForSync(imageDataUrl) {
  try {
    // Si no es una data URL, devolver como está
    if (!imageDataUrl || !imageDataUrl.startsWith('data:')) {
      return imageDataUrl;
    }
    
    // Extraer información de tipo y datos
    const match = imageDataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!match) {
      console.warn('⚠️ Formato de imagen no válido para compresión');
      return imageDataUrl;
    }
    
    // Crear una versión reducida (ejemplo: recortar a los primeros 50KB)
    // Esto es una solución temporal; una implementación adecuada usaría canvas
    // para redimensionar la imagen manteniendo la proporción
    const maxLength = 50000; // ~50KB
    const actualData = match[2];
    
    if (actualData.length <= maxLength) {
      return imageDataUrl; // Ya es lo suficientemente pequeña
    }
    
    // Crear una versión recortada para sincronización
    // Nota: En producción, sería mejor usar canvas para redimensionar correctamente
    return `data:${match[1]};base64,${actualData.substring(0, maxLength)}`;
    
  } catch (error) {
    console.error('❌ Error al comprimir imagen:', error);
    return imageDataUrl; // Devolver la original en caso de error
  }
}

/**
 * Prepara un plato para sincronización con el servidor
 * @param {Object} plato - Plato a preparar para sincronización
 * @returns {Object} Plato optimizado para envío al servidor
 */
function preparePlatoForSync(plato) {
  // Si la función no existe, implementarla
  if (!plato) {
    console.error('❌ Error: Se intentó preparar un plato nulo para sincronización');
    return {};
  }
  
  console.log('🔄 Preparando plato para sincronización:', plato.id);
  
  // Crear una copia para no modificar el objeto original
  const syncPlato = { ...plato };
  
  // PASO 1: Eliminar propiedades que no necesita el servidor
  delete syncPlato.syncStatus;
  delete syncPlato.localTimestamp;
  delete syncPlato.needsSimplification;
  delete syncPlato.image_thumbnail; // Si existe, la eliminaremos y usaremos una versión comprimida
  delete syncPlato._id; // Eliminar posibles _id de MongoDB si existen
  delete syncPlato.has_local_image;
  
  // PASO 2: Ser aún más agresivos con el tamaño de la imagen
  if (syncPlato.image && typeof syncPlato.image === 'string') {
    const imageSize = syncPlato.image.length;
    console.log(`📊 Tamaño original de imagen: ${imageSize} bytes`);
    
    // Establecer un límite mucho más estricto (50KB máximo)
    const maxImageSize = 50000; // 50KB
    
    if (imageSize > maxImageSize) {
      console.warn('⚠️ Imagen demasiado grande, reduciendo drásticamente...');
      
      try {
        // Si empieza con data:, es una data URL
        if (syncPlato.image.startsWith('data:')) {
          const match = syncPlato.image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
          if (match) {
            const imageType = match[1];
            const base64Data = match[2];
            
            // Crear una versión muy reducida
            const reducedData = base64Data.substring(0, maxImageSize);
            syncPlato.image = `data:${imageType};base64,${reducedData}`;
            
            console.log(`📊 Imagen reducida a: ${syncPlato.image.length} bytes`);
          } else {
            // Si no podemos extraer los datos, simplemente truncamos
            syncPlato.image = syncPlato.image.substring(0, maxImageSize);
          }
        } else {
          // Para URL normales, podríamos mantenerlas o reemplazarlas por un placeholder
          // Por ahora, conservamos la URL ya que debería ser pequeña
        }
      } catch (imageError) {
        console.error('❌ Error al procesar imagen para sincronización:', imageError);
        // Si hay error, eliminamos la imagen para garantizar la sincronización
        delete syncPlato.image;
        syncPlato.image_error = 'Error al procesar imagen para sincronización';
      }
    }
  }
  
  // PASO 3: Limitar todos los campos de texto
  if (syncPlato.description && syncPlato.description.length > 500) {
    syncPlato.description = syncPlato.description.substring(0, 500) + '...';
  }
  
  if (syncPlato.name && syncPlato.name.length > 100) {
    syncPlato.name = syncPlato.name.substring(0, 100);
  }
  
  // PASO 4: Asegurar que todos los campos numéricos sean realmente números
  syncPlato.price = Number(syncPlato.price) || 0;
  syncPlato.availableQuantity = Number(syncPlato.availableQuantity) || 0;
  syncPlato.includesDrink = Boolean(syncPlato.includesDrink);
  
  // PASO 5: Verificar el tamaño final del objeto serializado
  const serializedSize = JSON.stringify(syncPlato).length;
  console.log(`📊 Tamaño final del plato serializado: ${serializedSize} bytes`);
  
  // Si aún es mayor a 100KB, tomamos medidas drásticas
  if (serializedSize > 100000) {
    console.warn('⚠️ ADVERTENCIA: Plato demasiado grande incluso después de optimizaciones');
    
    // Crear objeto mínimo que contenga solo campos esenciales
    const minimalPlato = {
      id: syncPlato.id,
      name: syncPlato.name,
      price: syncPlato.price,
      description: syncPlato.description ? syncPlato.description.substring(0, 100) + '...' : '',
      includesDrink: syncPlato.includesDrink,
      availableQuantity: syncPlato.availableQuantity,
      is_available: syncPlato.is_available !== false,
      // Eliminar imagen completamente
      image: null,
      oversized: true
    };
    
    console.log('🔄 Usando versión mínima del plato para sincronización');
    return minimalPlato;
  }
  
  console.log('✅ Plato preparado para sincronización');
  return syncPlato;
}

/**
 * Función auxiliar para guardar platos desde cualquier formulario de la aplicación
 * @param {Object} platoData - Datos del plato a guardar
 * @returns {Promise<Object>} El plato guardado
 */
async function guardarPlato(platoData) {
  console.log('🔄 Iniciando guardado de plato con guardarPlato():', platoData);
  
  try {
    // Validación de datos
    if (!platoData || typeof platoData !== 'object') {
      throw new Error('Los datos del plato deben ser un objeto válido');
    }
    
    if (!platoData.name || platoData.name.trim() === '') {
      throw new Error('El plato debe tener un nombre válido');
    }
    
    // Normalizar los datos del plato
    const platoParaGuardar = normalizePlatoData(platoData);
    console.log('✅ Datos normalizados:', platoParaGuardar);
    
    // Usar la función createPlato
    const platoGuardado = await createPlato(platoParaGuardar);
    
    console.log('✅ Plato guardado exitosamente:', platoGuardado);
    return platoGuardado;
  } catch (error) {
    console.error('❌ Error en guardarPlato():', error);
    throw error;
  }
}

// Guardar un plato en IndexedDB
const savePlato = async (platoData) => {
  console.log('Intentando guardar el plato:', platoData);
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Iniciando guardado en IndexedDB:', platoData);
      
      // Validación adicional de campos obligatorios
      if (!platoData.name) {
        throw new Error('El plato debe tener un nombre');
      }
      
      const db = await openDB();
      
      // Usar la constante PLATOS_STORE
      const transaction = db.transaction([PLATOS_STORE], 'readwrite');
      const store = transaction.objectStore(PLATOS_STORE);
      
      // Agregar estado de sincronización al plato
      const platoToSave = {
        ...platoData,
        syncStatus: 'pending',
        localTimestamp: new Date().getTime()
      };
      
      console.log('Guardando plato con datos finales:', platoToSave);
      const request = store.add(platoToSave);
      
      request.onsuccess = async (event) => {
        const savedId = event.target.result;
        console.log(`Plato guardado localmente con ID: ${savedId}`);
        
        // Resolver la promesa con el objeto completo del plato
        const savedPlato = { ...platoToSave, id: savedId };
        
        // Agregar a la cola de sincronización
        try {
          await addToSyncQueue({
            type: 'create',
            entityType: 'plato',
            entityId: savedId,
            data: platoToSave,
            timestamp: new Date().getTime()
          });
          console.log('Plato agregado a la cola de sincronización');
        } catch (syncError) {
          console.error('Error al agregar a la cola de sincronización:', syncError);
          // Continuamos a pesar del error en la cola
        }
        
        // Verificación inmediata para depuración
        setTimeout(async () => {
          try {
            const verificationResult = await verifyPlatoStorage(savedId);
            if (verificationResult) {
              console.log('Verificación exitosa del guardado del plato');
            } else {
              console.warn('⚠️ Advertencia: El plato no se pudo verificar en IndexedDB');
            }
          } catch (verifyError) {
            console.error('Error al verificar almacenamiento:', verifyError);
          }
        }, 500);
        
        resolve(savedPlato);
      };
      
      request.onerror = (event) => {
        console.error('Error al guardar plato en IndexedDB:', event.target.error);
        reject(new Error('Error al guardar plato localmente: ' + event.target.error.message));
      };
      
      // Manejar errores de transacción
      transaction.onerror = (event) => {
        console.error('Error en la transacción de guardado:', event.target.error);
        reject(new Error('Error en la transacción: ' + event.target.error.message));
      };
      
      transaction.oncomplete = () => {
        console.log('Transacción de guardado completada exitosamente');
      };
      
    } catch (error) {
      console.error('Error general en savePlato:', error);
      reject(error);
    }
  });
};

// Implementar y exportar getPlato si no existe
const getPlato = async (id) => {
  try {
    console.log(`Obteniendo plato con ID ${id} de IndexedDB...`);
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PLATOS_STORE], 'readonly');
      const store = transaction.objectStore(PLATOS_STORE);
      const request = store.get(id);
      
      request.onsuccess = (event) => {
        const plato = event.target.result;
        if (plato) {
          console.log(`Plato con ID ${id} encontrado:`, plato);
          resolve(plato);
        } else {
          console.log(`No se encontró plato con ID ${id}`);
          resolve(null);
        }
      };
      
      request.onerror = (event) => {
        console.error(`Error al obtener plato con ID ${id}:`, event);
        reject(`Error al obtener plato con ID ${id}`);
      };
    });
  } catch (error) {
    console.error(`Error en getPlato:`, error);
    throw error;
  }
};

// Simplificar la exposición de la función de depuración
if (typeof window !== 'undefined') {
  window.debugDB = debugIndexedDB;
  // Exponer la función guardarPlato para debug y uso directo
  window.guardarPlato = guardarPlato;
}

export {
  openDatabase,
  savePlato,
  getAllPlatos,
  getPendingPlatos,
  updatePlatoSyncStatus,
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  deletePlato,
  verifyPlatoStorage,
  createPlato,
  debugIndexedDB,
  normalizePlatoData,
  guardarPlato,  
  preparePlatoForSync,
  compressImageForSync,
  getPlato
};

export default {
  openDatabase,
  savePlato,
  getAllPlatos,
  getPendingPlatos,
  updatePlatoSyncStatus,
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  deletePlato,
  verifyPlatoStorage,
  createPlato,
  debugIndexedDB,
  normalizePlatoData,
  guardarPlato,  
  preparePlatoForSync,
  compressImageForSync,
  getPlato
};