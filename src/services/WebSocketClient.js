/**
 * Clase cliente para manejar conexiones WebSocket con reconexión automática
 */
export default class WebSocketClient {
  /**
   * Constructor
   * @param {String} url - URL del servidor WebSocket
   * @param {Object} options - Opciones de configuración
   */
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectInterval: 3000, // Intervalo entre intentos de reconexión (3 segundos)
      reconnectAttempts: 5,    // Número máximo de intentos de reconexión
      ...options
    };
    
    this.socket = null;
    this.reconnectCount = 0;
    this.isConnecting = false;
    this.listeners = {
      message: [],
      open: [],
      close: [],
      error: []
    };
  }

  /**
   * Iniciar la conexión WebSocket
   */
  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || 
                       this.socket.readyState === WebSocket.OPEN)) {
      console.log('WebSocket: Ya existe una conexión activa o en proceso');
      return;
    }

    this.isConnecting = true;
    
    try {
      console.log(`WebSocket: Intentando conectar a ${this.url}`);
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = (event) => {
        console.log('WebSocket: Conexión establecida');
        this.isConnecting = false;
        this.reconnectCount = 0;
        this._notifyListeners('open', event);
      };
      
      this.socket.onmessage = (event) => {
        this._notifyListeners('message', event);
      };
      
      this.socket.onclose = (event) => {
        console.log(`WebSocket: Conexión cerrada (código: ${event.code})`);
        this._notifyListeners('close', event);
        this._attemptReconnect();
      };
      
      this.socket.onerror = (event) => {
        console.error('WebSocket: Error en la conexión', event);
        this._notifyListeners('error', event);
      };
    } catch (error) {
      console.error('WebSocket: Error al crear la conexión', error);
      this.isConnecting = false;
      this._attemptReconnect();
    }
  }

  /**
   * Intentar reconexión si es apropiado
   * @private
   */
  _attemptReconnect() {
    if (this.isConnecting) return;
    
    if (this.reconnectCount < this.options.reconnectAttempts) {
      this.reconnectCount++;
      console.log(`WebSocket: Intentando reconectar (${this.reconnectCount}/${this.options.reconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.options.reconnectInterval);
    } else {
      console.error(`WebSocket: Máximo número de intentos de reconexión (${this.options.reconnectAttempts}) alcanzado.`);
    }
  }

  /**
   * Notificar a los listeners de un evento
   * @param {string} type - Tipo de evento ('message', 'open', 'close', 'error')
   * @param {Event} event - Objeto evento
   * @private
   */
  _notifyListeners(type, event) {
    if (this.listeners[type]) {
      this.listeners[type].forEach(callback => callback(event));
    }
  }

  /**
   * Añadir un listener para un tipo de evento
   * @param {string} type - Tipo de evento ('message', 'open', 'close', 'error') 
   * @param {function} callback - Función callback a ejecutar
   */
  on(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }

  /**
   * Eliminar un listener específico
   * @param {string} type - Tipo de evento
   * @param {function} callback - Callback a eliminar
   */
  off(type, callback) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
    }
  }

  /**
   * Enviar un mensaje al servidor WebSocket
   * @param {any} data - Datos a enviar
   * @returns {boolean} - true si se envió correctamente, false en caso contrario
   */
  send(data) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket: Intento de envío sin conexión establecida');
      return false;
    }
    
    try {
      // Si es un objeto, lo convertimos a JSON
      const message = typeof data === 'object' ? JSON.stringify(data) : data;
      this.socket.send(message);
      return true;
    } catch (error) {
      console.error('WebSocket: Error al enviar mensaje', error);
      return false;
    }
  }

  /**
   * Cerrar la conexión WebSocket
   * @param {number} code - Código de cierre
   * @param {string} reason - Razón del cierre
   */
  disconnect(code = 1000, reason = 'Cierre normal') {
    if (this.socket) {
      try {
        this.socket.close(code, reason);
      } catch (error) {
        console.error('WebSocket: Error al cerrar la conexión', error);
      }
    }
    
    // Limpiar todos los listeners
    Object.keys(this.listeners).forEach(type => {
      this.listeners[type] = [];
    });
  }

  /**
   * Obtener el estado de la conexión
   * @returns {string} - Estado actual de la conexión
   */
  getState() {
    if (!this.socket) return 'CLOSED';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'OPEN';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
      default:
        return 'CLOSED';
    }
  }
}
