// src/services/platoService.js

import { savePlato, getAllPlatos, updatePlatoSyncStatus, deletePlato as deleteFromDB } from './indexedDBService';
import { isOnline } from './syncService';
import { adaptPlatoData } from '../utils/dataAdapters';
import { getCurrentUserRestaurant } from './restauranteService';
import apiConfig from '../config/apiConfig'; // Importar la configuración centralizada

// Usar la URL de la configuración
const API_URL = apiConfig.API_URL;

// Crear un nuevo plato
const createPlato = async (platoData) => {
  console.log('Datos originales recibidos:', platoData);
  
  // Adaptar datos si es necesario
  const adaptedData = adaptPlatoData(platoData);
  console.log('Datos adaptados para creación:', adaptedData);
  
  console.log('Estructura del objeto platoData:', Object.keys(platoData));
  console.log('Tipo de datos de platoData:', typeof platoData);
  
  try {
    // Una sola verificación de conexión
    const online = await isOnline();
    
    // Obtener el restaurante del usuario actual
    let restauranteId = null;
    try {
      const restauranteResponse = await getCurrentUserRestaurant();
      if (restauranteResponse.success && restauranteResponse.restaurante) {
        restauranteId = restauranteResponse.restaurante.id;
        // Añadir el ID del restaurante a los datos del plato
        adaptedData.restaurante_id = restauranteId;
      }
    } catch (error) {
      console.error('Error al obtener restaurante del usuario:', error);
    }
    
    // Si estamos en línea, intentamos guardar en el servidor
    if (online) {
      console.log('Conexión a internet detectada, intentando guardar en servidor...');
      try {
        // Obtener el token de autenticación
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/platos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(adaptedData)
        });
        
        console.log('Respuesta del servidor:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Plato creado en el servidor:', data);
          return data;
        } else {
          console.error(`Error del servidor: ${response.status}`);
          const errorText = await response.text();
          console.error('Detalles del error:', errorText);
          // No lanzamos excepción, continuamos con guardado local
          console.log('Continuando con guardado local debido a error del servidor...');
        }
      } catch (error) {
        console.error('Error detallado al crear plato en el servidor:', error);
        console.log('Continuando con guardado local debido a error de red...');
      }
    } else {
      console.log('Sin conexión a internet, procediendo con guardado local...');
    }
    
    // Guardado local (tanto si estamos offline como si hubo error en el servidor)
    console.log('Guardando plato en IndexedDB...');
    const savedPlato = await savePlato(adaptedData);
    console.log('Plato guardado localmente:', savedPlato);
    console.log('Estructura final del platoToSave:', Object.keys(savedPlato));
    return savedPlato;
  } catch (error) {
    console.error('Error detallado en createPlato:', error);
    throw new Error('No se pudo crear el plato. Por favor intente nuevamente: ' + error.message);
  }
};

// src/services/platoService.js (continuación)

// Obtener todos los platos
const getPlatos = async () => {
  console.log('Obteniendo platos...');
  
  try {
    // Obtener el restaurante del usuario actual
    let restauranteId = null;
    try {
      const restauranteResponse = await getCurrentUserRestaurant();
      if (restauranteResponse.success && restauranteResponse.restaurante) {
        restauranteId = restauranteResponse.restaurante.id;
      }
    } catch (error) {
      console.error('Error al obtener restaurante del usuario:', error);
    }
    
    // Intentamos obtener del servidor si hay conexión
    if (await isOnline()) {
      console.log('Conexión a internet detectada, intentando obtener del servidor...');
      try {
        // Obtener el token de autenticación
        const token = localStorage.getItem('token');
        
        // Construir la URL con el ID del restaurante si está disponible
        let url = `${API_URL}/platos`;
        if (restauranteId) {
          url += `?restauranteId=${restauranteId}`;
        }
        
        const response = await fetch(url, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        
        console.log('Respuesta del servidor:', response.status);
        
        if (!response.ok) {
          console.error(`Error del servidor: ${response.status}`);
          throw new Error(`Error al obtener platos: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Platos obtenidos del servidor:', data);
        return data;
      } catch (error) {
        console.error('Error al obtener platos del servidor:', error);
        console.log('Continuando con obtención local...');
      }
    } else {
      console.log('Sin conexión a internet, obteniendo localmente...');
    }
    
    // Si no hay conexión o falló la petición al servidor, obtenemos de IndexedDB
    console.log('Obteniendo platos de IndexedDB...');
    const localPlatos = await getAllPlatos();
    console.log('Platos obtenidos localmente:', localPlatos);
    return localPlatos;
  } catch (error) {
    console.error('Error general al obtener platos:', error);
    throw new Error('No se pudieron obtener los platos. Por favor intente nuevamente.');
  }
};

// src/services/platoService.js (continuación)

// Sincronizar platos pendientes con el servidor
const syncPlatosWithServer = async () => {
  if (!await isOnline()) {
    console.log('Sin conexión a internet. Intentando más tarde...');
    return;
  }

  console.log('Iniciando sincronización de platos con el servidor...');
  
  try {
    const platosLocales = await getAllPlatos(); // Obtener platos de IndexedDB
    
    if (platosLocales.length === 0) {
      console.log('No hay platos locales para sincronizar');
      return;
    }
    
    console.log(`Sincronizando ${platosLocales.length} platos...`);

    for (const plato of platosLocales) {
      // Manejar platos pendientes para crear/actualizar
      if (plato.syncStatus === 'pending') {
        try {
          console.log(`Sincronizando plato ID ${plato.id} (${plato.name})...`);
          
          const response = await fetch(`${API_URL}/platos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: plato.name,
              description: plato.description,
              price: plato.price,
              category: plato.category,
              image_url: plato.image_url,
              is_available: plato.is_available
            })
          });

          if (response.ok) {
            const responseData = await response.json();
            console.log(`Plato ID ${plato.id} sincronizado con éxito:`, responseData);
            
            // Actualizar estado de sincronización en IndexedDB
            await updatePlatoSyncStatus(plato.id, 'synced');
          } else {
            console.error(`Error al sincronizar plato ID ${plato.id}: ${response.status}`);
            const errorText = await response.text();
            console.error('Detalles del error:', errorText);
          }
        } catch (error) {
          console.error(`Error de red al sincronizar plato ID ${plato.id}:`, error);
        }
      } 
      // Manejar platos pendientes para eliminación
      else if (plato.syncStatus === 'pending_deletion') {
        try {
          console.log(`Sincronizando eliminación de plato ID ${plato.id} (${plato.name})...`);
          
          // Si el plato tiene un ID de servidor, intentamos eliminarlo
          if (plato.serverId) {
            const response = await fetch(`${API_URL}/platos/${plato.serverId}`, {
              method: 'DELETE'
            });
            
            if (response.ok) {
              console.log(`Plato ID ${plato.id} eliminado del servidor con éxito`);
              // Ahora podemos eliminarlo localmente
              await deleteFromIndexedDB(plato.id);
            } else {
              console.error(`Error al eliminar plato ID ${plato.id} del servidor: ${response.status}`);
              const errorText = await response.text();
              console.error('Detalles del error:', errorText);
            }
          } else {
            // Si no tiene ID de servidor, solo lo eliminamos localmente
            console.log(`Plato ID ${plato.id} nunca se sincronizó con el servidor, eliminando localmente`);
            await deleteFromIndexedDB(plato.id);
          }
        } catch (error) {
          console.error(`Error de red al eliminar plato ID ${plato.id}:`, error);
        }
      } else {
        console.log(`Plato ID ${plato.id} ya está sincronizado, omitiendo...`);
      }
    }
    
    console.log('Sincronización completada');
  } catch (error) {
    console.error('Error general durante la sincronización:', error);
  }
};

// src/services/platoService.js (continuación)

// Mejorado para evitar múltiples intentos de sincronización simultáneos
let isSyncing = false;
const safeSync = async () => {
  if (isSyncing) {
    console.log('Ya hay una sincronización en progreso, omitiendo...');
    return;
  }
  
  isSyncing = true;
  try {
    await syncPlatosWithServer();
  } catch (error) {
    console.error('Error en sincronización segura:', error);
  } finally {
    isSyncing = false;
  }
};

// Configurar sincronización periódica con mejor manejo
const syncInterval = setInterval(safeSync, 60000); // Cada 60 segundos

// Función para iniciar sincronización manual
const startManualSync = () => {
  console.log('Iniciando sincronización manual...');
  safeSync();
};

// Borrar un plato
const deletePlato = async (id) => {
  console.log(`Iniciando borrado de plato ID ${id}...`);
  
  try {
    // Primero intentamos borrar en el servidor si hay conexión
    if (await isOnline()) {
      console.log('Conexión a internet detectada, intentando borrar en servidor...');
      try {
        const response = await fetch(`${API_URL}/platos/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          console.error(`Error del servidor al borrar: ${response.status}`);
          throw new Error(`Error al borrar plato: ${response.status}`);
        }
        
        console.log(`Plato ID ${id} borrado en el servidor`);
        
        // Si se borró correctamente en el servidor, también lo borramos localmente
        await deleteFromIndexedDB(id);
        
        return true;
      } catch (error) {
        console.error('Error al borrar plato en el servidor:', error);
        // Continuamos para marcarlo como pendiente de borrado localmente
      }
    }
    
    // Si no hay conexión o falló el borrado en el servidor, lo marcamos como pendiente
    console.log(`Marcando plato ID ${id} como pendiente de borrado...`);
    await markPlatoForDeletion(id);
    
    return true;
  } catch (error) {
    console.error('Error general al borrar plato:', error);
    throw new Error('No se pudo borrar el plato. Por favor intente nuevamente.');
  }
};

// Implementar la función deleteFromIndexedDB
const deleteFromIndexedDB = async (id) => {
  console.log(`Eliminando plato ID ${id} de IndexedDB...`);
  try {
    await deleteFromDB(id); // Usar la función importada de indexedDBService
    console.log(`Plato ID ${id} eliminado de IndexedDB`);
    return true;
  } catch (error) {
    console.error(`Error al eliminar plato ID ${id} de IndexedDB:`, error);
    throw error;
  }
};

// Implementar la función markPlatoForDeletion
const markPlatoForDeletion = async (id) => {
  console.log(`Marcando plato ID ${id} para eliminación futura...`);
  try {
    await updatePlatoSyncStatus(id, 'pending_deletion');
    console.log(`Plato ID ${id} marcado para eliminación`);
    return true;
  } catch (error) {
    console.error(`Error al marcar plato ID ${id} para eliminación:`, error);
    throw error;
  }
};

// Agregar función para detener la sincronización
const stopSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    console.log('Sincronización periódica detenida');
  }
};

// Exportar funciones
export {
  createPlato,
  getPlatos,
  syncPlatosWithServer,
  startManualSync,
  deletePlato,
  deleteFromIndexedDB,
  markPlatoForDeletion,
  stopSync
};