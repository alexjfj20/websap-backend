/**
 * Servicio para manejar las peticiones API al backend
 */

// URL base de la API
const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000/api' 
  : '/api';

// Token de autenticación
let token = localStorage.getItem('token') || '';

/**
 * Configura el token de autenticación
 * @param {string} newToken 
 */
const setToken = (newToken) => {
  token = newToken;
  if (newToken) {
    localStorage.setItem('token', newToken);
  } else {
    localStorage.removeItem('token');
  }
};

/**
 * Realiza una petición GET a la API
 * @param {string} endpoint - Ruta de la API
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<any>} - Respuesta de la API
 */
const get = async (endpoint, options = {}) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(options.headers || {})
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
      ...options
    });
    
    if (options.responseType === 'blob') {
      return response.blob();
    }
    
    // Si la respuesta no es JSON, devolver el texto
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      return {
        success: response.ok,
        data: text,
        status: response.status
      };
    }
    
    const data = await response.json();
    
    // Si la respuesta tiene un código 401 o 403, podría ser un problema de autenticación
    if (response.status === 401 || response.status === 403) {
      console.warn(`Error de autenticación en ${endpoint}:`, data);
      
      // Si estamos en desarrollo, permitir continuar con una respuesta simulada
      if (process.env.NODE_ENV === 'development') {
        console.log('Modo desarrollo: devolviendo respuesta simulada para', endpoint);
        return {
          success: false,
          error: data.message || 'Error de autenticación',
          status: response.status,
          simulatedResponse: true
        };
      }
    }
    
    if (!response.ok) {
      throw new Error(data.message || 'Error en la petición');
    }
    
    return data;
  } catch (error) {
    console.error(`Error en GET ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Realiza una petición POST a la API
 * @param {string} endpoint - Ruta de la API
 * @param {Object} body - Cuerpo de la petición
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<any>} - Respuesta de la API
 */
const post = async (endpoint, body = {}, options = {}) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(options.headers || {})
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      ...options
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error en la petición');
    }
    
    return data;
  } catch (error) {
    console.error(`Error en POST ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Realiza una petición PUT a la API
 * @param {string} endpoint - Ruta de la API
 * @param {Object} body - Cuerpo de la petición
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<any>} - Respuesta de la API
 */
const put = async (endpoint, body = {}, options = {}) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(options.headers || {})
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
      ...options
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error en la petición');
    }
    
    return data;
  } catch (error) {
    console.error(`Error en PUT ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Realiza una petición DELETE a la API
 * @param {string} endpoint - Ruta de la API
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<any>} - Respuesta de la API
 */
const del = async (endpoint, options = {}) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(options.headers || {})
    };
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
      ...options
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error en la petición');
    }
    
    return data;
  } catch (error) {
    console.error(`Error en DELETE ${endpoint}:`, error);
    throw error;
  }
};

export default {
  setToken,
  get,
  post,
  put,
  delete: del
};
