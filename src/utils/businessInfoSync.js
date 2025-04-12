// src/utils/businessInfoSync.js

import apiService from '../services/apiService';
import { getBusinessInfo } from '../services/storageService';

/**
 * Sincroniza la información del negocio (incluyendo información de pago) con el backend
 * @param {Object} businessInfo - Información del negocio a sincronizar (opcional)
 * @returns {Promise<Object>} - Resultado de la sincronización
 */
export async function syncBusinessInfoWithBackend(businessInfoParam) {
  try {
    // Obtener la información del negocio desde IndexedDB si no se proporciona
    const businessInfo = businessInfoParam || await getBusinessInfo();
    
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

export default {
  syncBusinessInfoWithBackend
};
