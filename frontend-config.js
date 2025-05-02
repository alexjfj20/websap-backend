// Archivo de configuración para el frontend
// Este archivo debe copiarse/adaptarse al proyecto frontend

// Configuración para las llamadas a la API
export const API_CONFIG = {
  // URL base de la API para desarrollo local
  DEV_API_URL: 'http://localhost:3000/api',
  
  // URL base de la API para producción
  PROD_API_URL: 'https://websap-backend.onrender.com/api',
  
  // Determinar automáticamente qué URL usar según el entorno
  getBaseUrl() {
    // Si estamos en producción (dominio allseo.xyz)
    if (window.location.hostname.includes('allseo.xyz')) {
      return this.PROD_API_URL;
    }
    // De lo contrario, estamos en desarrollo
    return this.DEV_API_URL;
  }
};

// Instrucciones de uso:
/*
1. Copia este archivo al proyecto frontend
2. Importa la configuración en tus archivos que hacen llamadas a la API:
   import { API_CONFIG } from '@/config/api-config';

3. Usa la URL base en tus llamadas:
   axios.get(`${API_CONFIG.getBaseUrl()}/menu`)
     .then(response => {
       // Procesar respuesta
     });
*/