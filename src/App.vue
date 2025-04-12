<template>
  <div id="app" :class="{ 'dark-mode': isDarkMode }">
    <!-- WebSocket Status Indicator with improved messaging -->
    <div v-if="wsState.reconnecting" class="ws-status reconnecting">
      <span class="loading-spinner"></span> 
      Reconectando... (Intento {{ wsState.reconnectAttempts }} de {{ wsState.maxReconnectAttempts }})
      <button @click="stopReconnecting" class="reconnect-btn stop-btn">Cancelar</button>
    </div>
    <div v-else-if="wsState.error" class="ws-status error">
      <span class="error-icon">⚠️</span> Error de conexión: {{ wsState.error }}
      <button @click="handleReconnect" class="reconnect-btn">Reconectar</button>
    </div>
    
    <nav class="main-nav" v-if="showNav">
      <div class="nav-container">
        <router-link to="/" class="nav-logo">WebSAP</router-link>
        <div class="nav-links">
          <router-link to="/">Inicio</router-link>
          <router-link to="/about">Acerca de</router-link>
          <template v-if="isLoggedIn">
            <router-link to="/menu">Menú</router-link>
            <!-- Enlaces específicos según el rol -->
            <router-link v-if="isSuperAdmin" to="/superadmin">Admin</router-link>
            <router-link v-if="isEmployee" to="/employee">Panel Empleado</router-link>
            <a href="#" @click.prevent="logout">Cerrar Sesión</a>
          </template>
          <template v-else>
            <router-link to="/login">Iniciar Sesión</router-link>
            <router-link to="/register">Registrarse</router-link>
          </template>
          
          <!-- Dark Mode Toggle Button with Inline SVGs as fallback -->
          <button @click="toggleDarkMode" class="dark-mode-toggle" aria-label="Cambiar modo oscuro">
            <template v-if="isDarkMode">
              <!-- Sol - SVG inline como respaldo -->
              <svg v-if="svgFallback" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" class="theme-icon">
                <path fill="currentColor" d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.758a.75.75 0 001.06-1.061l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
              </svg>
              <img v-else src="@/assets/img/sun.svg" alt="Modo claro" class="theme-icon">
            </template>
            <template v-else>
              <!-- Luna - SVG inline como respaldo -->
              <svg v-if="svgFallback" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" class="theme-icon">
                <path fill="currentColor" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" />
              </svg>
              <img v-else src="@/assets/img/moon.svg" alt="Modo oscuro" class="theme-icon">
            </template>
          </button>
        </div>
      </div>
    </nav>
    
    <router-view />
    
    <!-- Componente para manejar reservas de WhatsApp (invisible) -->
    <WhatsAppReservationHandler ref="whatsappHandler" />
    
    <!-- Simulador de WhatsApp para pruebas -->
    <WhatsAppSimulator />
    
    <!-- Dialog component for global usage -->
    <DialogContainer />
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted, provide, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DialogContainer from './components/DialogContainer.vue';
import WhatsAppReservationHandler from './components/WhatsAppReservationHandler.vue';
import WhatsAppSimulator from './components/WhatsAppSimulator.vue'; // Importar el componente
import './utils/testReservations'; // Importar utilidades de prueba
import { 
  webSocketState, 
  initializeWebSocket, 
  closeWebSocket, 
  reconnect, 
  disableWebSocket 
} from './services/webSocketService';
import { isAuthenticated, hasRole, logout as authLogout } from './services/authService';
import { initSyncService } from './services/syncService';

export default {
  name: 'App',
  components: {
    DialogContainer,
    WhatsAppReservationHandler,
    WhatsAppSimulator // Registrar el componente
  },
  data() {
    return {
      isLoggedIn: isAuthenticated(),
      isDarkMode: localStorage.getItem('darkMode') === 'true',
      svgFallback: false, // Variable para controlar si usamos SVG inline
      whatsappHandler: null
    }
  },
  computed: {
    wsState() {
      return webSocketState;
    },
    showNav() {
      return !this.$route.path.match(/^\/menu\/[^\/]+$/);
    },
    isSuperAdmin() {
      return this.isLoggedIn && hasRole('Superadministrador');
    },
    isEmployee() {
      return this.isLoggedIn && hasRole('Empleado');
    }
  },
  watch: {
    $route() {
      this.isLoggedIn = isAuthenticated();
    }
  },
  methods: {
    logout() {
      authLogout();
      this.isLoggedIn = false;
      this.$router.push('/');
    },
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      
      // Guardar preferencia en localStorage
      localStorage.setItem('darkMode', this.isDarkMode);
      
      // Aplicar el tema a la etiqueta html y al elemento body para mayor consistencia
      nextTick(() => {
        if (this.isDarkMode) {
          document.documentElement.classList.add('dark-mode');
          document.body.classList.add('dark-mode');
        } else {
          document.documentElement.classList.remove('dark-mode');
          document.body.classList.remove('dark-mode');
        }
      });
    },
    handleReconnect() {
      reconnect();
    },
    stopReconnecting() {
      stopReconnecting();
    }
  },
  mounted() {
    // Verificar si podemos cargar las imágenes
    const testImg = new Image();
    testImg.onerror = () => {
      console.warn('Error al cargar imágenes SVG, usando fallback inline');
      this.svgFallback = true;
    };
    testImg.src = require('@/assets/img/sun.svg');

    // Aplicar el tema inicial
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    }
    
    // Detectar preferencia del sistema si no hay preferencia guardada
    if (localStorage.getItem('darkMode') === null) {
      const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDarkMode = prefersDarkMode;
      localStorage.setItem('darkMode', prefersDarkMode);
      
      if (prefersDarkMode) {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
      }
    }
    
    // Deshabilitar WebSocket para evitar errores de conexión ya que tu backend no lo soporta aún
    disableWebSocket();

    // Inicializar el servicio de sincronización al cargar la app
    initSyncService();
  },
  unmounted() {
    closeWebSocket();
  }
}
</script>

<style>
@import './assets/theme.css';

/* Estilos globales */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-color);
  background-color: var(--bg-color);
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Estilos para la navegación */
.main-nav {
  background-color: var(--nav-bg);
  box-shadow: 0 2px 8px var(--shadow-color);
  padding: 15px 0;
  transition: all 0.3s ease;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  font-size: 24px;
  font-weight: bold;
  color: var(--primary-color);
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 20px;
  align-items: center;
}

.nav-links a {
  color: var(--text-color);
  text-decoration: none;
  padding: 5px 10px;
  border-radius: 4px;
  transition: all 0.3s;
}

.nav-links a:hover {
  background-color: rgba(76, 175, 80, 0.1);
  color: var(--primary-color);
}

.nav-links a.router-link-exact-active {
  color: var(--primary-color);
  font-weight: bold;
}

/* Dark Mode Toggle Button */
.dark-mode-toggle {
  background-color: transparent;
  border: none;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: var(--text-color);
  margin-left: 10px;
  position: relative;
}

.dark-mode-toggle:hover {
  background-color: var(--shadow-color);
}

.theme-icon {
  width: 20px;
  height: 20px;
  color: var(--text-color);
  transition: transform 0.5s ease;
}

.dark-mode-toggle:hover .theme-icon {
  transform: rotate(30deg);
}

html.dark-mode .dark-mode-toggle .theme-icon {
  filter: brightness(0.9) contrast(1.5);
}

/* Ajustes responsivos */
@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 15px;
  }
  
  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
  }
}

/* WebSocket status styles */
.ws-status {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 6px 15px;
  font-size: 12px;
  color: white;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.ws-status.reconnecting {
  background-color: #ff9800;
}

.ws-status.error {
  background-color: #f44336;
}

.reconnect-btn, .stop-btn {
  background-color: white;
  border: none;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 11px;
  cursor: pointer;
  margin-left: 8px;
}

.reconnect-btn {
  color: #f44336;
}

.stop-btn {
  color: #ff9800;
}

.reconnect-btn:hover, .stop-btn:hover {
  background-color: #f9f9f9;
}

.loading-spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

.error-icon {
  font-size: 14px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>