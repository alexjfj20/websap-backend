// src/utils/syncPaymentInfo.js

import apiService from '../services/apiService';
import { getBusinessInfo } from '../services/storageService';

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
    
    console.log('Ejecutando migración para añadir columna informacion_pago...');
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
    
    console.log('Datos a enviar al backend:', restauranteData);
    
    // Actualizar el restaurante en el backend
    const response = await apiService.put(`/restaurantes/${restauranteId}`, restauranteData);
    
    if (response && response.success) {
      console.log('Información del negocio sincronizada con éxito');
      return {
        success: true,
        message: 'Información del negocio sincronizada con éxito'
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

// Ejecutar la migración y sincronizar la información del negocio
export async function syncAllBusinessInfo() {
  try {
    console.log('Iniciando proceso de sincronización completa...');
    
    // Primero ejecutar la migración
    const migrationResult = await runAddInformacionPagoMigration();
    console.log('Resultado de la migración:', migrationResult);
    
    // Luego sincronizar la información del negocio
    const syncResult = await syncBusinessInfoWithBackend();
    console.log('Resultado de la sincronización:', syncResult);
    
    return {
      success: migrationResult.success && syncResult.success,
      message: `Migración: ${migrationResult.message}. Sincronización: ${syncResult.message}`
    };
  } catch (error) {
    console.error('Error en el proceso de sincronización completa:', error);
    return {
      success: false,
      message: error.message || 'Error en el proceso de sincronización completa'
    };
  }
}

export default {
  runAddInformacionPagoMigration,
  syncBusinessInfoWithBackend,
  syncAllBusinessInfo
};
