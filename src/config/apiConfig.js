// apiConfig.js - Configuración centralizada para URLs de API

// Determinar el entorno actual 
const isProd = process.env.NODE_ENV === 'production';

// Verificar si hay una API URL especificada en localStorage
const storedApiUrl = localStorage.getItem('apiUrl');

// API real sin subdirectorios 'api' o 'raw' al final
const apiDomain = storedApiUrl || (isProd ? 'https://api.allseo.xyz' : 'http://localhost:3000');

// Configuración para entorno de producción y desarrollo
const config = {
  // URLs para producción (servidor real)
  production: {
    API_URL: `${apiDomain}/api`,
    RAW_URL: `${apiDomain}/raw`,
    API_TEST_ENDPOINT: `${apiDomain}/api/test/ping`,
    API_DOMAIN: apiDomain
  },
  // URLs para desarrollo local
  development: {
    API_URL: `${apiDomain}/api`,
    RAW_URL: `${apiDomain}/raw`,
    API_TEST_ENDPOINT: `${apiDomain}/api/test/ping`,
    API_DOMAIN: apiDomain
  }
};

// Exportar la configuración según el entorno
const currentConfig = isProd ? config.production : config.development;

export default currentConfig;