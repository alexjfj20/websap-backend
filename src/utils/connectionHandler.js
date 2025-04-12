// connectionHandler.js - Utilidad para manejar problemas de conexión

import apiConfig from '../config/apiConfig';

// Estado de la conexión
let isConnected = navigator.onLine;
let apiAvailable = false;
let connectionTestInProgress = false;
let offlineMode = localStorage.getItem('offlineMode') === 'true';

/**
 * Prueba la conexión al API con diferentes dominios alternativos
 * @returns {Promise<boolean>} - true si se encuentra una API disponible
 */
export const testApiConnection = async () => {
  // Si ya está en progreso una prueba, esperar
  if (connectionTestInProgress) {
    return apiAvailable;
  }

  connectionTestInProgress = true;
  console.log('🔄 Probando conexión con la API...');

  // Dominios a probar (en orden de preferencia)
  const domains = [
    apiConfig.API_DOMAIN,                   // Dominio configurado actual
    'https://api.allseo.xyz',              // Servidor principal de producción
    'https://allseo.xyz',                  // Servidor principal sin subdominio
    'https://api.websap.app',              // Servidor alternativo
    'http://localhost:3000'                // Local para desarrollo
  ];

  // Evitar duplicados
  const uniqueDomains = [...new Set(domains)];
  
  // Probar cada dominio
  for (const domain of uniqueDomains) {
    try {
      console.log(`🔍 Probando API en: ${domain}`);
      
      // Usar un timeout para evitar esperar demasiado
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${domain}/api/test/ping`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
        credentials: 'omit'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ Conexión exitosa con: ${domain}`);
        
        // Guardar el dominio que funciona
        localStorage.setItem('apiUrl', domain);
        
        // Actualizar configuración
        apiAvailable = true;
        offlineMode = false;
        localStorage.setItem('offlineMode', 'false');
        
        connectionTestInProgress = false;
        return true;
      }
    } catch (error) {
      console.warn(`❌ Error al conectar con ${domain}:`, error.name === 'AbortError' ? 'Timeout' : error.message);
    }
  }
  
  console.error('❌ No se pudo conectar con ningún servidor API');
  
  // Si no hay conexión, activar modo offline
  apiAvailable = false;
  offlineMode = true;
  localStorage.setItem('offlineMode', 'true');
  
  connectionTestInProgress = false;
  return false;
};

/**
 * Comprueba si la aplicación está en modo offline
 * @returns {boolean} - true si está en modo offline
 */
export const isOfflineMode = () => offlineMode;

/**
 * Establece manualmente el modo offline
 * @param {boolean} status - true para activar el modo offline
 */
export const setOfflineMode = (status) => {
  offlineMode = status;
  localStorage.setItem('offlineMode', status ? 'true' : 'false');
  console.log(`${status ? '🔌 Modo offline activado' : '🌐 Modo offline desactivado'}`);
};

/**
 * Configurar los listeners para eventos de conexión
 */
export const setupConnectionListeners = () => {
  // Escuchar cambios en la conexión
  window.addEventListener('online', async () => {
    isConnected = true;
    console.log('🌐 Conexión a Internet detectada');
    
    // Probar si la API está disponible
    const apiIsAvailable = await testApiConnection();
    
    // Notificar a la aplicación del cambio
    window.dispatchEvent(new CustomEvent('api-connection-change', { detail: { connected: apiIsAvailable } }));
  });
  
  window.addEventListener('offline', () => {
    isConnected = false;
    apiAvailable = false;
    console.log('🔌 Conexión a Internet perdida');
    
    // Notificar a la aplicación del cambio
    window.dispatchEvent(new CustomEvent('api-connection-change', { detail: { connected: false } }));
  });
  
  // Realizar un test inicial al cargar
  setTimeout(() => {
    testApiConnection().then(available => {
      window.dispatchEvent(new CustomEvent('api-connection-change', { detail: { connected: available } }));
    });
  }, 1000);
};

// Inicializar
setupConnectionListeners();

export default {
  testApiConnection,
  isOfflineMode,
  setOfflineMode,
  apiAvailable,
  isConnected
};