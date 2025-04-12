// src/services/restauranteService.js

import apiService from './apiService';

/**
 * Obtiene todos los restaurantes del usuario actual
 * @returns {Promise<Object>} - Respuesta con los restaurantes
 */
export async function getRestaurantes() {
  try {
    // Asegurarse de que el token esté configurado en apiService
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token);
    }
    
    const response = await apiService.get('/restaurantes');
    
    if (response && response.success) {
      return {
        success: true,
        restaurantes: response.restaurantes || []
      };
    } else {
      throw new Error(response.message || 'Error al obtener restaurantes');
    }
  } catch (error) {
    console.error('Error al obtener restaurantes:', error);
    return {
      success: false,
      error: error.message || 'Error al obtener restaurantes',
      restaurantes: []
    };
  }
}

/**
 * Obtiene un restaurante específico
 * @param {number} restauranteId - ID del restaurante
 * @returns {Promise<Object>} - Respuesta con el restaurante
 */
export async function getRestaurante(restauranteId) {
  try {
    // Asegurarse de que el token esté configurado en apiService
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token);
    }
    
    const response = await apiService.get(`/restaurantes/${restauranteId}`);
    
    if (response && response.success) {
      return {
        success: true,
        restaurante: response.restaurante
      };
    } else {
      throw new Error(response.message || 'Error al obtener restaurante');
    }
  } catch (error) {
    console.error(`Error al obtener restaurante ${restauranteId}:`, error);
    return {
      success: false,
      error: error.message || 'Error al obtener restaurante'
    };
  }
}

/**
 * Crea un nuevo restaurante
 * @param {Object} restauranteData - Datos del restaurante
 * @returns {Promise<Object>} - Respuesta con el restaurante creado
 */
export async function createRestaurante(restauranteData) {
  try {
    // Asegurarse de que el token esté configurado en apiService
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token);
    }
    
    const response = await apiService.post('/restaurantes', restauranteData);
    
    if (response && response.success) {
      return {
        success: true,
        restaurante: response.restaurante,
        message: response.message || 'Restaurante creado correctamente'
      };
    } else {
      throw new Error(response.message || 'Error al crear restaurante');
    }
  } catch (error) {
    console.error('Error al crear restaurante:', error);
    return {
      success: false,
      error: error.message || 'Error al crear restaurante'
    };
  }
}

/**
 * Actualiza un restaurante existente
 * @param {number} restauranteId - ID del restaurante
 * @param {Object} restauranteData - Datos del restaurante
 * @returns {Promise<Object>} - Respuesta con el restaurante actualizado
 */
export async function updateRestaurante(restauranteId, restauranteData) {
  try {
    // Asegurarse de que el token esté configurado en apiService
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token);
    }
    
    const response = await apiService.put(`/restaurantes/${restauranteId}`, restauranteData);
    
    if (response && response.success) {
      return {
        success: true,
        restaurante: response.restaurante,
        message: response.message || 'Restaurante actualizado correctamente'
      };
    } else {
      throw new Error(response.message || 'Error al actualizar restaurante');
    }
  } catch (error) {
    console.error(`Error al actualizar restaurante ${restauranteId}:`, error);
    return {
      success: false,
      error: error.message || 'Error al actualizar restaurante'
    };
  }
}

/**
 * Regenera el enlace compartido de un restaurante
 * @param {number} restauranteId - ID del restaurante
 * @returns {Promise<Object>} - Respuesta con el nuevo enlace
 */
export async function regenerateLink(restauranteId) {
  try {
    // Asegurarse de que el token esté configurado en apiService
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token);
    }
    
    const response = await apiService.post(`/restaurantes/${restauranteId}/regenerate-link`);
    
    if (response && response.success) {
      return {
        success: true,
        enlace_compartido: response.enlace_compartido,
        message: response.message || 'Enlace regenerado correctamente'
      };
    } else {
      throw new Error(response.message || 'Error al regenerar enlace');
    }
  } catch (error) {
    console.error(`Error al regenerar enlace para restaurante ${restauranteId}:`, error);
    return {
      success: false,
      error: error.message || 'Error al regenerar enlace'
    };
  }
}

/**
 * Asigna un usuario a un restaurante
 * @param {number} restauranteId - ID del restaurante
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<Object>} - Respuesta de la asignación
 */
export async function assignUserToRestaurant(restauranteId, usuarioId) {
  try {
    // Asegurarse de que el token esté configurado en apiService
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token);
    }
    
    const response = await apiService.post(`/restaurantes/${restauranteId}/asignar-usuario/${usuarioId}`);
    
    if (response && response.success) {
      return {
        success: true,
        message: response.message || 'Usuario asignado correctamente'
      };
    } else {
      throw new Error(response.message || 'Error al asignar usuario');
    }
  } catch (error) {
    console.error(`Error al asignar usuario ${usuarioId} a restaurante ${restauranteId}:`, error);
    return {
      success: false,
      error: error.message || 'Error al asignar usuario'
    };
  }
}

/**
 * Obtiene el restaurante del usuario actual
 * @returns {Promise<Object>} - Respuesta con el restaurante
 */
export async function getCurrentUserRestaurant() {
  try {
    const response = await getRestaurantes();
    
    if (response.success && response.restaurantes.length > 0) {
      // Devolver el primer restaurante (un usuario regular solo tiene uno)
      return {
        success: true,
        restaurante: response.restaurantes[0]
      };
    } else {
      return {
        success: false,
        error: 'No se encontró ningún restaurante asociado al usuario',
        restaurante: null
      };
    }
  } catch (error) {
    console.error('Error al obtener restaurante del usuario:', error);
    return {
      success: false,
      error: error.message || 'Error al obtener restaurante del usuario',
      restaurante: null
    };
  }
}

// Exportación por defecto para compatibilidad con importaciones existentes
export default {
  getRestaurantes,
  getRestaurante,
  createRestaurante,
  updateRestaurante,
  regenerateLink,
  assignUserToRestaurant,
  getCurrentUserRestaurant
};
