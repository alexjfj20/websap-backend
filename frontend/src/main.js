import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import axios from 'axios'
import { API_CONFIG } from './services/apiConfig'

// Configuración global de axios
axios.defaults.baseURL = API_CONFIG.baseURL;
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.timeout = API_CONFIG.timeout;

// Interceptor para manejar errores globales
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('Error en solicitud API:', error.message);
    
    // Si es un error de autenticación y no estamos en la página de login
    if (error.response && error.response.status === 401 && router.currentRoute.value.name !== 'login') {
      console.warn('Sesión expirada o inválida, redirigiendo a login');
      router.push({ name: 'login' });
    }
    
    return Promise.reject(error);
  }
);

// Crear la aplicación Vue
const app = createApp(App);

// Registrar servicios globales
app.config.globalProperties.$axios = axios;
app.config.globalProperties.$apiUrl = API_CONFIG.baseURL;

// Montar la aplicación
app.use(store).use(router).mount('#app');

// Información de diagnóstico
console.log('🌟 WebSAP iniciado');
console.log('📡 API URL:', API_CONFIG.baseURL);
console.log('🔒 Autenticación configurada');