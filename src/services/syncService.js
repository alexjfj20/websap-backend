// src/services/syncService.js

// Servicio para gestionar la sincronización y el estado de la conexión
import { 
  getPendingPlatos, 
  updatePlatoSyncStatus, 
  getSyncQueue, 
  removeFromSyncQueue,
  getPlato
} from './indexedDBService';
import { adaptPlatoData } from '../utils/dataAdapters';
import { optimizeImageForSync } from './imageService';
import apiConfig from '../config/apiConfig';
import { testApiConnection, isOfflineMode } from '../utils/connectionHandler';

// Función para obtener las URLs actualizadas del API
const getApiUrls = () => {
  // Si el API URL fue actualizado por el connectionHandler, actualizar la configuración
  const storedApiUrl = localStorage.getItem('apiUrl');
  if (storedApiUrl) {
    // Construir URLs con el dominio correcto
    return {
      API_URL: `${storedApiUrl}/api`,
      RAW_URL: `${storedApiUrl}/raw`
    };
  }
  
  // Usar configuración por defecto
  return {
    API_URL: apiConfig.API_URL,
    RAW_URL: apiConfig.RAW_URL
  };
};

// URLs dinámicas que pueden actualizarse en tiempo de ejecución
let { API_URL, RAW_URL } = getApiUrls();

// Función para actualizar las URLs de la API en tiempo de ejecución
const refreshApiUrls = () => {
  const urls = getApiUrls();
  API_URL = urls.API_URL;
  RAW_URL = urls.RAW_URL;
  console.log('🔄 URLs de API actualizadas:', { API_URL, RAW_URL });
};

// Escuchar los cambios de conexión para actualizar las URLs
window.addEventListener('api-connection-change', (event) => {
  console.log('🌐 Estado de conexión API cambiado:', event.detail.connected);
  refreshApiUrls();
});

// Configuración específica para mejorar la sincronización
const SYNC_CONFIG = {
  skipServerAvailabilityCheck: true,
  maxPlatoSize: 30000, // 30KB máximo
  retryIntervals: [5000, 15000, 30000],
  maxRetries: 2,
  platoUrl: `${API_URL}/sync/platos`,
  emergencyPlatoUrl: `${API_URL}/platos/minimal`,
  useEmergencyEndpoint: true
};

// Estado de la sincronización
let isSyncing = false;
let _isOnline = navigator.onLine;

// Alternativa más simple para verificar la conexión
const isOnline = async () => {
  // Primero comprobamos el estado de navigator.onLine
  if (!navigator.onLine) {
    return false;
  }
  
  // Intentamos hacer un fetch a un recurso pequeño (como un favicon)
  try {
    const response = await fetch(`${API_URL}/favicon.ico`, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'omit'
    });
    
    return true; // Si no hay excepción, asumimos que estamos en línea
  } catch (error) {
    console.error('Error al verificar estado de conexión:', error);
    return false;
  }
};

// Configurar escuchas para eventos de conexión
const setupConnectionListeners = () => {
  window.addEventListener('online', async () => {
    console.log('Evento online detectado');
    _isOnline = await isOnline();
    if (_isOnline) {
      console.log('Conexión a Internet restablecida');
      // Sincronizar cuando se recupera la conexión
      syncData();
    }
  });
  
  window.addEventListener('offline', () => {
    console.log('Evento offline detectado');
    _isOnline = false;
    console.log('Conexión a Internet perdida');
  });
  
  // Verificar estado inicial
  isOnline().then(online => {
    console.log(`Estado inicial de conexión: ${online ? 'En línea' : 'Fuera de línea'}`);
  });
};

// Función para probar la conexión con el servidor (modo ultra-ligero)
// Función para intentar conexión en modo no-cors (evita errores CORS pero con limitaciones)
const tryFetchNoCors = async (url) => {
  console.log('🔄 Intentando conexión en modo no-cors:', url);
  
  return new Promise((resolve) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('⏱️ Timeout en la prueba no-cors');
      controller.abort();
      resolve(false);
    }, 5000);
    
    fetch(url, {
      method: 'GET',
      mode: 'no-cors', // Importante: en este modo no podemos leer la respuesta
      credentials: 'omit',
      cache: 'no-store',
      signal: controller.signal
    })
    .then(() => {
      // En modo no-cors, cualquier respuesta que no sea un error de red
      // se considera exitosa, aunque no podamos leer su contenido
      clearTimeout(timeoutId);
      console.log('✅ Conexión no-cors establecida');
      resolve(true);
    })
    .catch(error => {
      clearTimeout(timeoutId);
      console.error('❌ Error en modo no-cors:', error.message);
      resolve(false);
    });
  });
};

// Función para probar puertos alternativos (3000, 5000, 8000)
const checkAlternativePort = async () => {
  console.log('🔄 Probando puertos alternativos...');
  
  // Extraer el dominio de la URL actual
  const apiUrl = getApiUrls().API_URL;
  const urlObj = new URL(apiUrl);
  const domain = urlObj.hostname;
  
  // Lista de puertos comunes para desarrollo
  const commonPorts = [3000, 5000, 8000];
  
  for (const port of commonPorts) {
    const testUrl = `${urlObj.protocol}//${domain}:${port}/api/test/ping`;
    console.log(`🔄 Probando puerto alternativo: ${testUrl}`);
    
    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        mode: 'no-cors',
        credentials: 'omit',
        timeout: 2000 // Tiempo corto para cada puerto
      });
      
      if (response) {
        console.log(`✅ Puerto alternativo ${port} responde`);
        // Guardar esta URL como alternativa
        localStorage.setItem('apiUrl', `${urlObj.protocol}//${domain}:${port}`);
        return true;
      }
    } catch (error) {
      console.log(`❌ Puerto ${port} no disponible`);
    }
  }
  
  console.log('❌ No se encontraron puertos alternativos disponibles');
  return false;
};

const testServerConnection = async () => {
  console.log('🔄 Probando conexión con el servidor (modo emergencia)...');
  
  try {
    // Usar fetch API que maneja mejor CORS
    const urls = getApiUrls();
    const pingURL = `${urls.API_URL}/test/ping`;
    console.log(`🔄 Probando conexión a: ${pingURL}`);
    
    const responsePromise = new Promise((resolve) => {
      // Configurar timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('⏱️ Timeout en la prueba de conexión');
        controller.abort();
        resolve(false);
      }, 8000);
      
      // Usar fetch con modo no-cors como fallback
      fetch(pingURL, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit', // No enviar cookies
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        signal: controller.signal
      })
      .then(response => {
        clearTimeout(timeoutId);
        if (response.ok) {
          console.log('✅ Conexión básica establecida');
          resolve(true);
        } else {
          console.log(`⚠️ Respuesta no OK: ${response.status}`);
          // Si es un error CORS, intentar en modo no-cors
          if (response.status === 0 || response.status === 403) {
            tryFetchNoCors(pingURL).then(resolve);
          } else {
            resolve(false);
          }
        }
      })
      .catch(error => {
        clearTimeout(timeoutId);
        console.error('❌ Error de red en prueba de conexión:', error.message);
        // Intentar con endpoint de emergencia sin headers
        checkAlternativePort().then(resolve);
      });
    });
    
    return await responsePromise;
  } catch (error) {
    console.error('❌ Error en prueba de conexión:', error);
    return false;
  }
};

// Comprobar puerto alternativo (implementación secundaria)
const checkAlternativePort2 = async () => {
  console.log('🔄 Probando puertos alternativos (segundo método)...');
  
  // Lista de puertos comunes para probar
  const ports = [8080, 3000, 5000, 8000];
  
  for (const port of ports) {
    try {
      console.log(`Probando en puerto: ${port}`);
      const response = await fetch(`http://localhost:${port}/raw/ping`, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        credentials: 'omit'
      });
      
      if (response.ok || response.status === 0) {
        console.log(`✅ Servidor encontrado en puerto ${port}`);
        // Actualizar URL global para usar este puerto
        window.SERVER_PORT = port;
        return true;
      }
    } catch (error) {
      console.log(`Puerto ${port} no disponible`);
    }
  }
  
  console.error('❌ No se encontró el servidor en ningún puerto común');
  return false;
};

// Función para probar la conexión a MySQL
const testMySQLConnection = async () => {
  console.log('🔄 Probando conexión a MySQL...');
  
  try {
    const response = await fetch(`${API_URL}/test/db`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Conexión a MySQL establecida:', data);
      
      // Mostrar información clara sobre la base de datos
      if (data.data && data.data.database) {
        console.log(`📊 Base de datos MySQL: ${data.data.database}`);
        console.log(`📊 Tablas disponibles: ${data.data.tables.join(', ')}`);
      }
      
      return true;
    } else {
      console.error('❌ Error al conectar con MySQL:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ Error de red al probar la conexión MySQL:', error);
    return false;
  }
};

// Función para sincronizar datos entre IndexedDB y el servidor
const syncData = async () => {
  if (!await isOnline()) {
    console.log('Sin conexión a Internet, la sincronización no es posible');
    return false;
  }
  
  if (isSyncing) {
    console.log('Ya hay una sincronización en progreso');
    return false;
  }
  
  isSyncing = true;
  
  console.log('🔄 Iniciando sincronización de datos...');
  
  try {
    // Procesar la cola de sincronización
    const syncQueue = await getSyncQueue();
    console.log(`📋 Cola de sincronización: ${syncQueue.length} elementos`);
    
    for (const item of syncQueue) {
      if (item.entityType === 'plato') {
        // Obtener el plato completo de IndexedDB
        const plato = await getPlato(item.entityId);
        
        if (plato) {
          console.log(`🍽️ Sincronizando plato: ${plato.name} (${plato.id})`);
          
          try {
            // Intentar sincronización minimalista
            const success = await syncPlato(plato);
            
            if (success.success) {
              console.log(`✅ Plato ${plato.id} sincronizado correctamente`);
              await removeFromSyncQueue(item.id);
            } else {
              console.error(`❌ Error al sincronizar plato ${plato.id}`);
            }
          } catch (syncError) {
            console.error(`❌ Excepción al sincronizar plato ${plato.id}:`, syncError);
          }
        } else {
          console.warn(`⚠️ Plato ${item.entityId} no encontrado en IndexedDB`);
          await removeFromSyncQueue(item.id);
        }
      }
    }
    
    // Buscar platos pendientes que no estén en la cola
    console.log('🔍 Buscando platos pendientes de sincronización...');
    const pendingPlatos = await getPendingPlatos();
    console.log(`📋 Platos pendientes: ${pendingPlatos.length}`);
    
    for (const plato of pendingPlatos) {
      try {
        console.log(`🍽️ Sincronizando plato pendiente: ${plato.name} (${plato.id})`);
        const success = await syncPlato(plato);
        
        if (success.success) {
          console.log(`✅ Plato pendiente ${plato.id} sincronizado correctamente`);
        } else {
          console.error(`❌ Error al sincronizar plato pendiente ${plato.id}: ${success.error}`);
        }
      } catch (syncError) {
        console.error(`❌ Excepción al sincronizar plato pendiente ${plato.id}: ${syncError}`);
      }
    }
    
    console.log('✅ Sincronización completada');
    return true;
  } catch (error) {
    console.error('❌ Error durante la sincronización:', error);
    return false;
  } finally {
    isSyncing = false;
  }
};

// Método ultra-minimal usando XMLHttpRequest sin headers
const tryUltraMinimalSync = async (data, platoId) => {
  try {
    console.log('🚨 Intentando sincronización ultra-minimal para plato:', platoId);
    
    // Crear un objeto XMLHttpRequest directamente
    const xhr = new XMLHttpRequest();
    
    // Configurar una promesa para manejar la respuesta
    const responsePromise = new Promise((resolve) => {
      // Configurar timeout
      const timeoutId = setTimeout(() => {
        console.warn('⏱️ Timeout en sincronización ultra-minimal');
        xhr.abort();
        resolve(false);
      }, 15000);
      
      xhr.onreadystatechange = async function() {
        if (xhr.readyState === 4) {
          clearTimeout(timeoutId);
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('✅ Sincronización ultra-minimal exitosa');
            try {
              await updatePlatoSyncStatus(platoId, 'synced');
            } catch (dbError) {
              console.error('Error al actualizar estado en BD:', dbError);
            }
            resolve(true);
          } else {
            console.error(`❌ Error en sincronización ultra-minimal: ${xhr.status}`);
            resolve(false);
          }
        }
      };
      
      xhr.onerror = function() {
        clearTimeout(timeoutId);
        console.error('❌ Error de red en sincronización ultra-minimal');
        resolve(false);
      };
    });
    
    // Usar método POST con datos minimalistas
    xhr.open('POST', `${API_URL}/platos/emergency-sync`, true);
    
    // Solo agregar Content-Type, nada más
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    // Preparar datos ultra-minimalistas
    const adaptedData = await adaptPlatoDataWithImageOptimization(data);
    const minimalData = {
      id: adaptedData.id,
      name: (adaptedData.name || "").substring(0, 30),
      price: Number(adaptedData.price) || 0
    };
    
    // Enviar los datos
    xhr.send(JSON.stringify(minimalData));
    
    return await responsePromise;
  } catch (error) {
    console.error('❌ Error en sincronización ultra-minimal:', error);
    return false;
  }
};

// Procesar la cola de sincronización
const processSyncQueue = async () => {
  if (!await isOnline() || isSyncing) {
    console.log(`No se puede procesar la cola. En línea: ${_isOnline}, Sincronizando: ${isSyncing}`);
    return false;
  }
  
  isSyncing = true;
  console.log('Iniciando procesamiento de cola de sincronización...');
  
  try {
    const syncItems = await getSyncQueue();
    
    if (syncItems.length === 0) {
      console.log('No hay elementos en la cola de sincronización');
      isSyncing = false;
      return true;
    }
    
    console.log(`Procesando ${syncItems.length} elementos en la cola de sincronización`);
    
    // Procesar cada elemento de la cola
    for (const item of syncItems) {
      let syncSuccess = false;
      
      if (item.type === 'create' && item.entityType === 'plato') {
        syncSuccess = await syncPlatoToServer(item.data);
      }
      // Aquí pueden agregarse más tipos de sincronización según sea necesario
      
      if (syncSuccess) {
        // Eliminar de la cola si la sincronización fue exitosa
        await removeFromSyncQueue(item.id);
        console.log(`Elemento ${item.id} eliminado de la cola de sincronización`);
      } else {
        console.log(`No se pudo sincronizar el elemento ${item.id}, se reintentará más tarde`);
      }
    }
    
    console.log('Procesamiento de cola de sincronización completado');
    return true;
  } catch (error) {
    console.error('Error al procesar cola de sincronización:', error);
    return false;
  } finally {
    isSyncing = false;
  }
};

// Método de sincronización extremadamente simplificado para problemas persistentes
export const syncMinimalDataOnly = async (data, platoId, retryCount = 0) => {
  const maxRetries = SYNC_CONFIG.maxRetries;
  
  // Usar datos minimalistas pero incluir la imagen optimizada
  const adaptedData = await adaptPlatoDataWithImageOptimization(data);
  const minimalData = {
    id: adaptedData.id,
    name: adaptedData.name?.substring(0, 50) || 'Plato sin nombre',
    price: Number(adaptedData.price) || 0,
    description: adaptedData.description?.substring(0, 100) || '',
    category: adaptedData.category || 'principal',
    image: adaptedData.image, // Incluir la imagen optimizada
    is_available: Boolean(adaptedData.is_available),
    minimal_sync: true
  };
  
  return new Promise((resolve) => {
    // Establecer timeout para toda la operación
    const operationTimeoutId = setTimeout(() => {
      console.warn('⏱️ Timeout global de la operación de sincronización');
      resolve(false);
    }, 30000);
    
    const xhr = new XMLHttpRequest();
    
    // Configurar timeouts más estrictos
    xhr.timeout = 15000;
    
    xhr.onreadystatechange = async function() {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          clearTimeout(operationTimeoutId);
          try {
            await updatePlatoSyncStatus(platoId, 'synced');
            console.log(`✅ Sincronización exitosa para plato ${platoId}`);
          } catch (error) {
            console.error('Error al actualizar estado:', error);
          }
          resolve(true);
        } else if (xhr.status === 0) {
          // Conexión abortada o no establecida
          console.warn('⚠️ Conexión interrumpida');
          handleRetry();
        } else if (xhr.status === 431) {
          console.error(`❌ Error 431 (Headers demasiado grandes) - Intentando método ultraminimal`);
          tryUltraMinimalSync(adaptedData, platoId).then(success => {
            clearTimeout(operationTimeoutId);
            resolve(success);
          });
        } else {
          console.error(`❌ Error HTTP ${xhr.status} en sincronización`);
          handleRetry();
        }
      }
    };
    
    xhr.ontimeout = function() {
      console.warn('⏱️ Timeout de la petición HTTP');
      handleRetry();
    };
    
    xhr.onerror = function() {
      console.error('❌ Error de red en sincronización');
      handleRetry();
    };
    
    // Función para manejar reintentos
    const handleRetry = () => {
      if (retryCount < maxRetries) {
        const delay = SYNC_CONFIG.retryIntervals[retryCount] || 5000;
        console.log(`🔄 Reintentando en ${delay}ms... (${retryCount + 1}/${maxRetries})`);
        
        setTimeout(() => {
          clearTimeout(operationTimeoutId);
          syncMinimalDataOnly(data, platoId, retryCount + 1)
            .then(success => resolve(success));
        }, delay);
      } else {
        clearTimeout(operationTimeoutId);
        console.warn('❌ Agotados todos los reintentos de sincronización');
        resolve(false);
      }
    };
    
    try {
      // Usar método POST con headers mínimos
      xhr.open('POST', `${API_URL}/platos`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      // Enviar los datos minimalistas
      xhr.send(JSON.stringify(minimalData));
    } catch (error) {
      console.error('❌ Error al iniciar la petición:', error);
      handleRetry();
    }
  });
};

// Sincronizar un plato con el servidor
const syncPlatoToServer = async (plato, retryCount = 0) => {
  const maxRetries = SYNC_CONFIG.maxRetries;
  
  // Si el plato está marcado como problemático, omitirlo
  if (plato.sync_problematic) {
    console.warn(`⚠️ Omitiendo plato ${plato.id} marcado como problemático para sincronización`);
    return false;
  }
  
  console.log(`Sincronizando plato ${plato.id} con el servidor (intento ${retryCount + 1}/${maxRetries + 1})...`);
  
  try {
    // Omitir verificación si está desactivada
    if (!SYNC_CONFIG.skipServerAvailabilityCheck) {
      // Verificar si el servidor está disponible
      const serverAvailable = await checkServerAvailability();
      if (!serverAvailable) {
        console.error('❌ El servidor no está disponible. Posponiendo sincronización.');
        return false;
      }
    }
    
    // Preparar datos para sincronización incluyendo la imagen
    let adaptedData = await adaptPlatoDataWithImageOptimization(plato);
    let syncData = {
      id: adaptedData.id,
      name: adaptedData.name?.substring(0, 50) || 'Plato sin nombre',
      price: Number(adaptedData.price) || 0,
      description: adaptedData.description?.substring(0, 100) || '',
      availableQuantity: Number(adaptedData.availableQuantity) || 0,
      is_available: Boolean(adaptedData.is_available),
      image: adaptedData.image || null, // Incluir la imagen
      minimal_sync: true
    };
    
    // Usar el método más confiable para sincronización
    return await syncPlato(adaptedData);
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    
    if (retryCount >= maxRetries) {
      try {
        await markPlatoAsSyncProblematic(plato.id);
      } catch (markError) {
        console.error('Error al marcar plato como problemático:', markError);
      }
    }
    
    return false;
  }
};

// Verificar estado de sincronización con el backend
const checkSyncStatus = async () => {
  try {
    console.log('🔄 Verificando estado de sincronización...');
    
    const response = await fetch(`${API_URL}/sync/status`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      credentials: 'omit' // Importante: no enviar cookies
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Estado de sincronización:', data);
      
      // Si no existe la tabla, intentar crearla
      if (!data.data.mysql.tablaPlatos) {
        console.log('⚠️ La tabla platos no existe, intentando configurar...');
        await setupSync();
      }
      
      return data.data;
    } else {
      console.error('❌ Error al verificar estado de sincronización:', await response.text());
      return null;
    }
  } catch (error) {
    console.error('❌ Error al verificar estado de sincronización:', error);
    return null;
  }
};

// Configurar la sincronización - crear tablas necesarias
const setupSync = async () => {
  try {
    console.log('🔄 Configurando sincronización...');
    
    const response = await fetch(`${API_URL}/sync/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      body: JSON.stringify({ force: false })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Configuración de sincronización completada:', data);
      return true;
    } else {
      console.error('❌ Error al configurar sincronización:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ Error al configurar sincronización:', error);
    return false;
  }
};

// Inicializar el servicio de sincronización
const initSyncService = () => {
  console.log('🔄 Inicializando servicio de sincronización...');
  
  // Probar conexiones y configurar sincronización
  Promise.all([
    testServerConnection(),
    checkSyncStatus()
  ]).then(([isApiConnected, syncStatus]) => {
    console.log(`✅ Estado de conexión directa - API: ${isApiConnected}`);
    
    if (isApiConnected) {
      // Configurar escuchas para eventos de conexión
      setupConnectionListeners();
      
      // Si hay estado de sincronización, proceder con la sincronización
      if (syncStatus && syncStatus.mysql && syncStatus.mysql.connected) {
        console.log('📊 MySQL conectado, procediendo con sincronización');
        syncData();
        
        // Reactivar la sincronización periódica (cada 1 minuto)
        const syncInterval = setInterval(syncData, 60000);
      } else {
        console.log('⚠️ MySQL no está configurado correctamente, intentando configurar...');
        setupSync().then(success => {
          if (success) {
            console.log('✅ Configuración exitosa, iniciando sincronización');
            syncData();
            
            // Reactivar la sincronización periódica (cada 1 minuto)
            const syncInterval = setInterval(syncData, 60000);
          }
        });
      }
    } else {
      console.error('❌ No se pudo establecer conexión con el servidor.');
    }
  });
  
  console.log('⚙️ Servicio de sincronización inicializado');
};

// Exportar las funciones necesarias
export {
  initSyncService,
  syncData,
  isOnline,
  _isOnline,
  testServerConnection,
  testMySQLConnection,
  checkSyncStatus,
  setupSync,
  syncPlato,
  adaptPlatoDataWithImageOptimization
};

// Asegúrate de que la función que maneja la sincronización tenga un mejor manejo de errores

/**
 * Función para sincronizar un plato con el servidor, asegurando que la imagen se incluya
 * @param {Object} plato - El plato a sincronizar
 * @returns {Promise<Object>} - Resultado de la sincronización
 */
const syncPlato = async (plato) => {
  console.log(`🔄 Sincronizando plato: ${plato.name} (ID: ${plato.id})`);
  
  try {
    // Preparar los datos para enviar (incluir la imagen optimizada)
    const platoToSync = await adaptPlatoDataWithImageOptimization(plato);
    
    // Omitir la imagen en los logs para evitar mensajes demasiado largos
    console.log('📤 Datos a enviar:', { 
      ...platoToSync, 
      image: platoToSync.image ? 'Imagen en base64 (omitida en log)' : null 
    });
    
    // Imprimir la URL exacta para depuración
    const url = SYNC_CONFIG.platoUrl; // Usar la configuración existente
    console.log(`🔗 URL de sincronización: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(platoToSync),
      // Evitar que se incluyan cookies u otros datos de autenticación si no son necesarios
      credentials: 'omit'
    });
    
    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error de sincronización (${response.status}): ${errorText}`);
      
      // Intentar con el método de sincronización minimalista si hay un error
      if (response.status >= 400) {
        console.log('⚠️ Intentando sincronización minimalista como fallback...');
        return await syncMinimalDataOnly(plato);
      }
      
      return {
        success: false,
        message: `Error de servidor: ${response.status} ${response.statusText}`,
        error: errorText
      };
    }
    
    // Procesar la respuesta exitosa
    const responseData = await response.json();
    console.log('✅ Sincronización exitosa:', responseData);
    
    // Actualizar el estado de sincronización en IndexedDB
    try {
      await updatePlatoSyncStatus(plato.id, true);
      console.log(`✅ Estado de sincronización actualizado para plato ID: ${plato.id}`);
    } catch (syncStatusError) {
      console.warn(`⚠️ No se pudo actualizar el estado de sincronización: ${syncStatusError.message}`);
    }
    
    return {
      success: true,
      message: 'Plato sincronizado correctamente',
      data: responseData
    };
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    
    // Intentar con el método de sincronización minimalista si hay un error
    console.log('⚠️ Intentando sincronización minimalista como fallback...');
    return await syncMinimalDataOnly(plato);
  }
};

// Función para adaptar los datos del plato antes de sincronizar, con optimización de imágenes
const adaptPlatoDataWithImageOptimization = async (plato) => {
  // Crear una copia para no modificar el original
  const adaptedData = { ...plato };
  
  // Asegurarse de que todos los campos necesarios estén presentes
  adaptedData.id = plato.id;
  adaptedData.name = plato.name || 'Plato sin nombre';
  adaptedData.price = parseFloat(plato.price) || 0;
  adaptedData.description = plato.description || '';
  adaptedData.category = plato.category || 'principal';
  
  // Optimizar la imagen si existe
  if (plato.image && typeof plato.image === 'string' && plato.image.length > 0) {
    try {
      adaptedData.image = await optimizeImageForSync(plato.image);
      console.log(`Imagen optimizada para ${plato.name}`);
    } catch (error) {
      console.warn(`Error al optimizar imagen para ${plato.name}:`, error);
      adaptedData.image = plato.image; // Usar la original en caso de error
    }
  } else {
    adaptedData.image = plato.image || null;
  }
  
  adaptedData.image_url = plato.image_url || '';
  adaptedData.is_available = plato.is_available !== false;
  adaptedData.includesDrink = plato.includesDrink || false;
  adaptedData.availableQuantity = plato.availableQuantity || 0;
  
  return adaptedData;
};

/**
 * Actualiza el estado de sincronización de un elemento
 * @param {string} id - ID del elemento
 * @param {string|boolean} status - Estado de sincronización ('pending', 'synced', 'pending_deletion' o un booleano)
 * @returns {Promise<boolean>} - true si se actualizó correctamente
 */
export async function updateSyncStatus(id, status) {
  try {
    // Validar que el status sea uno de los valores permitidos o convertir booleano a string
    let validStatus = status;
    
    // Si es booleano, convertirlo al estado correspondiente
    if (typeof status === 'boolean') {
      validStatus = status === true ? 'synced' : 'pending';
    }
    
    // Ahora validar que sea uno de los estados permitidos
    if (!['pending', 'synced', 'pending_deletion'].includes(validStatus)) {
      console.warn(`⚠️ No se pudo actualizar el estado de sincronización: Estado inválido: ${status}. Debe ser uno de: pending, synced, pending_deletion`);
      return false;
    }
    
    // Continuar con la lógica existente para actualizar el estado
    // ...existing code...
    
    return true;
  } catch (error) {
    console.error('Error al actualizar estado de sincronización:', error);
    return false;
  }
}