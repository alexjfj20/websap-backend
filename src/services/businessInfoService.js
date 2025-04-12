// src/services/businessInfoService.js

import apiService from './apiService';
import { getBusinessInfo, saveBusinessInfo } from './storageService';
import eventBus from '../utils/eventBus';

// Constantes para la sincronización
const SYNC_INTERVAL = 30000; // 30 segundos
const CACHE_DURATION = 300000; // 5 minutos
let syncIntervalId = null;
let lastSyncTimestamp = 0;
let lastFetchTimestamp = 0;
let businessInfoCache = null;
let isInitialized = false;

/**
 * Sincroniza la información del negocio guardada en IndexedDB con el backend
 * @returns {Promise<Object>} - Resultado de la sincronización
 */
export async function syncBusinessInfoWithBackend() {
  try {
    // Obtener la información del negocio desde IndexedDB
    const businessInfo = await getBusinessInfo();
    
    if (!businessInfo || Object.keys(businessInfo).length === 0) {
      console.log('No hay información del negocio para sincronizar');
      return {
        success: false,
        message: 'No hay información del negocio para sincronizar'
      };
    }
    
    console.log('Sincronizando información del negocio con el backend:', businessInfo);
    
    // Asegurarse de que el token esté configurado en apiService
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token);
    }
    
    // Obtener el ID del restaurante del usuario actual
    const userResponse = await apiService.get('/auth/me');
    if (!userResponse || !userResponse.success || !userResponse.user || !userResponse.user.restaurante_id) {
      console.warn('No se pudo obtener el restaurante del usuario actual');
      return {
        success: false,
        message: 'No se pudo obtener el restaurante del usuario actual'
      };
    }
    
    const restauranteId = userResponse.user.restaurante_id;
    
    // Preparar los datos para actualizar el restaurante
    const restauranteData = {
      nombre: businessInfo.name,
      descripcion: businessInfo.description,
      direccion: businessInfo.address,
      telefono: businessInfo.contact,
      logo: businessInfo.logo,
      // Guardar la información de pago como un campo JSON
      informacion_pago: JSON.stringify(businessInfo.paymentInfo || {})
    };
    
    // Actualizar el restaurante en el backend
    const response = await apiService.put(`/restaurantes/${restauranteId}`, restauranteData);
    
    if (response && response.success) {
      console.log('Información del negocio sincronizada con éxito');
      lastSyncTimestamp = Date.now();
      
      // Notificar a todos los componentes que la información ha sido sincronizada
      eventBus.emit('business-info-updated', businessInfo);
      
      return {
        success: true,
        message: 'Información del negocio sincronizada con éxito',
        timestamp: lastSyncTimestamp
      };
    } else {
      console.warn('Error al sincronizar información del negocio:', response);
      return {
        success: false,
        message: response.message || 'Error al sincronizar información del negocio'
      };
    }
  } catch (error) {
    console.error('Error al sincronizar información del negocio:', error);
    return {
      success: false,
      message: error.message || 'Error al sincronizar información del negocio'
    };
  }
}

/**
 * Obtiene la información del negocio desde el backend y la guarda en IndexedDB
 * @param {boolean} forceUpdate - Forzar la actualización aunque esté en caché
 * @returns {Promise<Object>} - Información del negocio
 */
export async function fetchBusinessInfoFromBackend(forceUpdate = false) {
  try {
    // Si tenemos información en caché y no ha pasado el tiempo de caché, usarla
    const now = Date.now();
    if (businessInfoCache && !forceUpdate && (now - lastFetchTimestamp) < CACHE_DURATION) {
      console.log('Usando información de negocio en caché');
      return businessInfoCache;
    }
    
    // Asegurarse de que el token esté configurado en apiService
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token);
    }
    
    // Obtener el ID del restaurante del usuario actual
    const userResponse = await apiService.get('/auth/me');
    if (!userResponse || !userResponse.success || !userResponse.user || !userResponse.user.restaurante_id) {
      console.warn('No se pudo obtener el restaurante del usuario actual');
      throw new Error('No se pudo obtener el restaurante del usuario actual');
    }
    
    const restauranteId = userResponse.user.restaurante_id;
    
    // Obtener el restaurante del backend
    const response = await apiService.get(`/restaurantes/${restauranteId}`);
    
    if (response && response.success && response.restaurante) {
      const restaurante = response.restaurante;
      
      // Convertir la información a formato de negocio
      let paymentInfo = {};
      try {
        if (restaurante.informacion_pago) {
          paymentInfo = JSON.parse(restaurante.informacion_pago);
        }
      } catch (e) {
        console.warn('Error al parsear información de pago:', e);
      }
      
      const businessInfo = {
        name: restaurante.nombre,
        description: restaurante.descripcion,
        address: restaurante.direccion,
        contact: restaurante.telefono,
        logo: restaurante.logo,
        paymentInfo
      };
      
      // Guardar en IndexedDB
      await saveBusinessInfo(businessInfo);
      
      // Actualizar caché y timestamp
      businessInfoCache = businessInfo;
      lastFetchTimestamp = now;
      
      // Notificar a todos los componentes que la información ha sido actualizada
      eventBus.emit('business-info-updated', businessInfo);
      
      console.log('Información del negocio obtenida con éxito:', businessInfo);
      return businessInfo;
    } else {
      console.warn('Error al obtener información del negocio:', response);
      throw new Error(response?.message || 'Error al obtener información del negocio');
    }
  } catch (error) {
    console.error('Error al obtener información del negocio desde el backend:', error);
    
    // Si hay un error, intentar obtener la información desde IndexedDB
    try {
      const businessInfo = await getBusinessInfo();
      if (businessInfo) {
        return businessInfo;
      }
    } catch (localError) {
      console.error('Error al obtener información local:', localError);
    }
    
    throw error;
  }
}

/**
 * Actualiza la información del negocio en IndexedDB y la sincroniza con el backend
 * @param {Object} businessInfo - Nueva información del negocio
 * @returns {Promise<Object>} - Resultado de la actualización
 */
export async function updateBusinessInfo(businessInfo) {
  try {
    // Guardar en IndexedDB
    await saveBusinessInfo(businessInfo);
    
    // Actualizar caché y timestamp
    businessInfoCache = businessInfo;
    lastFetchTimestamp = Date.now();
    
    // Notificar a todos los componentes que la información ha sido actualizada
    eventBus.emit('business-info-updated', businessInfo);
    
    // Sincronizar con el backend
    const syncResult = await syncBusinessInfoWithBackend();
    
    return {
      success: true,
      message: 'Información del negocio actualizada con éxito',
      syncResult
    };
  } catch (error) {
    console.error('Error al actualizar información del negocio:', error);
    return {
      success: false,
      message: error.message || 'Error al actualizar información del negocio'
    };
  }
}

/**
 * Verifica si hay cambios en la información del negocio
 * @returns {Promise<boolean>} - True si hay cambios, false si no
 */
export async function checkForBusinessInfoChanges() {
  try {
    // Obtener información actual desde IndexedDB
    const localInfo = await getBusinessInfo();
    
    // Obtener información desde el backend
    const backendInfo = await fetchBusinessInfoFromBackend(true);
    
    // Comparar ambas informaciones
    const localString = JSON.stringify(localInfo);
    const backendString = JSON.stringify(backendInfo);
    
    const hasChanges = localString !== backendString;
    
    if (hasChanges) {
      console.log('Se detectaron cambios en la información del negocio');
      
      // Actualizar la información local con la del backend
      await saveBusinessInfo(backendInfo);
      
      // Notificar a todos los componentes
      eventBus.emit('business-info-updated', backendInfo);
    }
    
    return hasChanges;
  } catch (error) {
    console.error('Error al verificar cambios en información del negocio:', error);
    return false;
  }
}

/**
 * Inicia la verificación periódica de cambios en la información del negocio
 * @param {boolean} disableSync - Si es true, la sincronización se desactiva (útil para vistas compartidas)
 */
export function startBusinessInfoSyncInterval(disableSync = false) {
  // Si se solicita deshabilitar la sincronización (por ejemplo, en vistas compartidas), salir
  if (disableSync) {
    console.log('Sincronización de información del negocio desactivada (modo vista compartida)');
    return;
  }

  if (syncIntervalId) {
    clearInterval(syncIntervalId);
  }
  
  // Inicializar con una primera sincronización
  if (!isInitialized) {
    fetchBusinessInfoFromBackend()
      .catch(error => console.error('Error en sincronización inicial:', error));
    isInitialized = true;
  }
  
  syncIntervalId = setInterval(() => {
    checkForBusinessInfoChanges()
      .catch(error => console.error('Error en verificación periódica:', error));
  }, SYNC_INTERVAL);
  
  console.log('Verificación periódica de información del negocio iniciada');
}

/**
 * Detiene la verificación periódica
 */
export function stopBusinessInfoSyncInterval() {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
    console.log('Verificación periódica de información del negocio detenida');
  }
}

/**
 * Ejecuta la migración para añadir la columna informacion_pago a la tabla restaurantes
 * @returns {Promise<Object>} - Resultado de la migración
 */
export async function runAddInformacionPagoMigration() {
  try {
    // Asegurarse de que el token esté configurado en apiService
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token);
    }
    
    const response = await apiService.get('/restaurantes/migrate/add-informacion-pago');
    
    if (response && response.success) {
      console.log('Migración ejecutada con éxito:', response.message);
      return {
        success: true,
        message: response.message || 'Migración ejecutada con éxito'
      };
    } else {
      console.warn('Error al ejecutar migración:', response);
      return {
        success: false,
        message: response.message || 'Error al ejecutar migración'
      };
    }
  } catch (error) {
    console.error('Error al ejecutar migración:', error);
    return {
      success: false,
      message: error.message || 'Error al ejecutar migración'
    };
  }
}

/**
 * Limpia la caché y fuerza una nueva carga desde el backend
 */
export function invalidateBusinessInfoCache() {
  businessInfoCache = null;
  lastFetchTimestamp = 0;
}

export default {
  syncBusinessInfoWithBackend,
  fetchBusinessInfoFromBackend,
  updateBusinessInfo,
  checkForBusinessInfoChanges,
  startBusinessInfoSyncInterval,
  stopBusinessInfoSyncInterval,
  runAddInformacionPagoMigration,
  invalidateBusinessInfoCache
};
