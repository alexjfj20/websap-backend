/**
 * Configuración de la API para WebSAP
 * Este archivo contiene la configuración para conectar el frontend con el backend
 */

// Detectar entorno
const isProduction = process.env.NODE_ENV === 'production' || window.location.hostname.includes('allseo.xyz');
const isDevelopment = !isProduction;

// URLs de API según el entorno
const API_URLS = {
  production: 'https://websap-backend.onrender.com/api',
  development: 'http://localhost:10000/api'
};

// Configuración exportada
export default {
  // URL base de la API según el entorno
  baseURL: isProduction ? API_URLS.production : API_URLS.development,
  
  // Timeout para peticiones (en milisegundos)
  timeout: 30000,
  
  // Credenciales
  withCredentials: false,
  
  // Endpoints principales
  endpoints: {
    auth: {
      login: '/auth/login',
      verifyToken: '/auth/verify-token',
      logout: '/auth/logout'
    },
    menu: {
      getAll: '/public/menu',
      save: '/public/menu/save',
      getItem: '/public/menu/item'
    },
    orders: {
      getAll: '/orders',
      create: '/orders/create',
      update: '/orders/update',
      delete: '/orders/delete'
    }
  },
  
  // Versión actual
  version: '1.0.0',
  
  // Información de entorno
  env: {
    isProduction,
    isDevelopment,
    baseURL: isProduction ? API_URLS.production : API_URLS.development
  }
};