import { reactive } from 'vue';

// Estado reactivo del WebSocket
export const webSocketState = reactive({
  connected: false,
  reconnecting: false,
  error: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  socket: null,
  messages: [],
  enableWebsocket: false // Nueva bandera para habilitar/deshabilitar conexiones WebSocket
});

// Opciones de configuración
let config = {
  reconnectInterval: 2000,
  reconnectAttempts: 5
};

// Variable para almacenar el temporizador de reconexión
let reconnectTimer = null;

/**
 * Inicializa la conexión WebSocket
 * @param {string} url - URL del servidor WebSocket
 * @param {Object} options - Opciones de configuración
 */
export function initializeWebSocket(url, options = {}) {
  config = { ...config, ...options };
  webSocketState.maxReconnectAttempts = config.reconnectAttempts;
  
  // Comprobar si el navegador soporta WebSocket
  if (!('WebSocket' in window)) {
    console.warn('Este navegador no soporta WebSocket');
    return;
  }
  
  // Permitir deshabilitar WebSocket en entornos de desarrollo
  // o cuando el backend no soporta WebSockets
  if (process.env.NODE_ENV === 'development' && !webSocketState.enableWebsocket) {
    console.info('WebSocket deshabilitado en entorno de desarrollo. ' +
                 'Para habilitarlo, use enableWebSocket()');
    return;
  }
  
  // Si ya existe una conexión activa, cerrarla primero
  if (webSocketState.socket) {
    webSocketState.socket.close();
  }

  try {
    webSocketState.reconnecting = false;
    webSocketState.error = null;
    
    // Crear nueva conexión
    console.log(`Intentando conectar a WebSocket: ${url}`);
    const socket = new WebSocket(url);
    
    socket.onopen = () => {
      console.log('Conexión WebSocket establecida');
      webSocketState.connected = true;
      webSocketState.reconnecting = false;
      webSocketState.error = null;
      webSocketState.reconnectAttempts = 0;
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        webSocketState.messages.push(data);
        console.log('Mensaje recibido:', data);
      } catch (err) {
        console.error('Error al parsear mensaje WebSocket:', event.data);
      }
    };
    
    socket.onclose = (event) => {
      webSocketState.connected = false;
      
      if (!event.wasClean) {
        console.log('Conexión WebSocket cerrada inesperadamente');
        scheduleReconnect();
      } else {
        console.log('Conexión WebSocket cerrada');
      }
    };
    
    socket.onerror = (error) => {
      console.error('Error WebSocket:', error);
      webSocketState.error = 'Error de conexión';
      webSocketState.connected = false;
      
      // Solo programar reconexión si no estamos ya en ese proceso
      if (!webSocketState.reconnecting) {
        scheduleReconnect();
      }
    };
    
    // Guardar referencia al socket
    webSocketState.socket = socket;
    
  } catch (error) {
    console.error('Error al inicializar WebSocket:', error);
    webSocketState.error = `Error al inicializar: ${error.message}`;
    webSocketState.connected = false;
    scheduleReconnect();
  }
}

/**
 * Habilita las conexiones WebSocket
 */
export function enableWebSocket() {
  webSocketState.enableWebsocket = true;
  console.log('WebSocket habilitado. Para conectar, llame a initializeWebSocket() con la URL apropiada');
}

/**
 * Deshabilita las conexiones WebSocket
 */
export function disableWebSocket() {
  webSocketState.enableWebsocket = false;
  if (webSocketState.socket) {
    closeWebSocket();
  }
  console.log('WebSocket deshabilitado');
}

/**
 * Programa un intento de reconexión después del intervalo configurado
 */
function scheduleReconnect() {
  // Limpiar cualquier temporizador existente
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  
  // Verificar si debemos intentar reconectar
  if (webSocketState.reconnectAttempts >= webSocketState.maxReconnectAttempts) {
    console.log('Número máximo de reconexiones alcanzado');
    webSocketState.reconnecting = false;
    return;
  }
  
  if (!webSocketState.enableWebsocket && process.env.NODE_ENV === 'development') {
    console.log('WebSocket deshabilitado. No se intentará reconectar.');
    return;
  }
  
  // Programar reconexión
  webSocketState.reconnecting = true;
  webSocketState.reconnectAttempts++;
  console.log(`Programando reconexión ${webSocketState.reconnectAttempts}/${webSocketState.maxReconnectAttempts} en ${config.reconnectInterval}ms`);
  
  reconnectTimer = setTimeout(() => {
    if (webSocketState.socket && webSocketState.socket.url) {
      console.log('Intentando reconexión...');
      initializeWebSocket(webSocketState.socket.url);
    }
  }, config.reconnectInterval);
}

/**
 * Intenta reconectar inmediatamente
 */
export function reconnect() {
  if (webSocketState.socket && webSocketState.socket.url) {
    initializeWebSocket(webSocketState.socket.url);
  }
}

/**
 * Detiene los intentos de reconexión
 */
export function stopReconnecting() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
  }
  webSocketState.reconnecting = false;
  console.log('Intentos de reconexión detenidos');
}

/**
 * Cierra la conexión WebSocket
 */
export function closeWebSocket() {
  stopReconnecting();
  
  if (webSocketState.socket) {
    try {
      webSocketState.socket.close();
    } catch (error) {
      console.error('Error al cerrar WebSocket:', error);
    }
    webSocketState.socket = null;
  }
  
  webSocketState.connected = false;
  console.log('Conexión WebSocket cerrada manualmente');
}

/**
 * Envía un mensaje a través del WebSocket
 * @param {Object} data - Datos a enviar
 * @returns {boolean} - true si el mensaje se envió correctamente
 */
export function sendMessage(data) {
  if (!webSocketState.socket || webSocketState.socket.readyState !== WebSocket.OPEN) {
    console.error('WebSocket no está conectado');
    return false;
  }
  
  try {
    const message = JSON.stringify(data);
    webSocketState.socket.send(message);
    console.log('Mensaje enviado:', data);
    return true;
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    return false;
  }
}

// Deshabilitar WebSocket por defecto en desarrollo
if (process.env.NODE_ENV === 'development') {
  webSocketState.enableWebsocket = false;
}

export default {
  webSocketState,
  initializeWebSocket,
  reconnect,
  closeWebSocket,
  sendMessage,
  stopReconnecting,
  enableWebSocket,
  disableWebSocket
};
