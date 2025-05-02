import axios from 'axios';
import { API_CONFIG, API_ENDPOINTS, getApiUrl } from './apiConfig';

// Crear una instancia de axios con la configuración preestablecida
const apiClient = axios.create(API_CONFIG);

// Clave para almacenar el token en localStorage
const TOKEN_KEY = 'websap_auth_token';
const USER_KEY = 'websap_user';

// Función para iniciar sesión
export const login = async (username, password) => {
  try {
    console.log('Intentando login en:', getApiUrl(API_ENDPOINTS.auth.login));
    
    const response = await apiClient.post(API_ENDPOINTS.auth.login, {
      username,
      password
    });
    
    // Verificar respuesta exitosa
    if (response.data && response.data.success) {
      // Guardar el token y la información del usuario
      localStorage.setItem(TOKEN_KEY, response.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      
      console.log('Login exitoso');
      return {
        success: true,
        user: response.data.user,
        token: response.data.token
      };
    } else {
      console.error('Error de respuesta del servidor:', response.status, response.data);
      return {
        success: false,
        error: response.data.error || 'Error desconocido'
      };
    }
  } catch (error) {
    console.error('Error de respuesta del servidor:', error.response?.status, error.response?.data);
    
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Error de conexión'
    };
  }
};

// Función para verificar si el usuario está autenticado
export const isAuthenticated = async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  
  // Si no hay token, no está autenticado
  if (!token) {
    return false;
  }
  
  // Intentar verificar el token con el servidor
  try {
    const response = await apiClient.post(API_ENDPOINTS.auth.verifyToken, { token });
    
    if (response.data && response.data.valid) {
      return true;
    } else {
      // Token inválido, eliminar el token y la información del usuario
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return false;
    }
  } catch (error) {
    console.error('Error al verificar token:', error);
    
    // Si hay un error de conexión, consideramos válido el token para permitir
    // el funcionamiento offline (opcional, puede cambiarse)
    if (!error.response) {
      console.warn('Error de conexión al verificar token, asumimos válido temporalmente');
      return true;
    }
    
    // Otros errores, token inválido
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return false;
  }
};

// Función para cerrar sesión
export const logout = async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  
  // Si hay token, intentar hacer logout en el servidor
  if (token) {
    try {
      await apiClient.post(API_ENDPOINTS.auth.logout, { token });
    } catch (error) {
      console.error('Error al hacer logout en el servidor:', error);
    }
  }
  
  // Eliminar token e información del usuario independientemente de la respuesta del servidor
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  
  return { success: true };
};

// Función para obtener el usuario actual
export const getCurrentUser = () => {
  const userJson = localStorage.getItem(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

// Función para obtener el token actual
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Interceptor para agregar el token a las solicitudes
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default {
  login,
  logout,
  isAuthenticated,
  getCurrentUser,
  getToken,
  apiClient
};