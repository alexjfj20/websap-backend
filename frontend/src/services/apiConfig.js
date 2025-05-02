// Configuración de la API para diferentes entornos
const isProduction = window.location.hostname.includes('allseo.xyz');
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// URLs base para entornos
const RENDER_API_URL = 'https://websap-backend.onrender.com/api';
const LOCAL_API_URL = 'http://localhost:10000/api';

// Configuración de la API según el entorno
export const API_CONFIG = {
  baseURL: isProduction ? RENDER_API_URL : LOCAL_API_URL,
  timeout: 15000, // 15 segundos
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Endpoints de la API
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    verifyToken: '/auth/verify-token'
  },
  menu: {
    getMenu: '/public/menu',
    saveMenu: '/public/menu/save'
  },
  orders: {
    getOrders: '/orders',
    createOrder: '/orders/create',
    updateOrder: '/orders/update'
  }
};

// Estado del entorno para depuración
export const ENV_INFO = {
  isProduction,
  isDevelopment,
  apiUrl: API_CONFIG.baseURL,
  appVersion: '1.0.0'
};

// Función para obtener la URL completa de un endpoint
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.baseURL}${endpoint}`;
};

// Imprimir información en consola para depuración
console.log('📡 API Configuration:', ENV_INFO);

export default {
  API_CONFIG,
  API_ENDPOINTS,
  ENV_INFO,
  getApiUrl
};