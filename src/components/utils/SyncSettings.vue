// src/components/utils/SyncSettings.vue

<template>
  <div class="sync-settings">
    <h3>Configuración de Sincronización</h3>
    
    <div class="settings-form">
      <div class="form-group">
        <label for="autoSyncImages">
          <input 
            type="checkbox" 
            id="autoSyncImages" 
            v-model="settings.autoSyncImages"
            @change="saveSettings"
          />
          Sincronizar imágenes automáticamente
        </label>
        <div class="help-text">
          Cuando está activado, las imágenes se sincronizarán automáticamente con el servidor
        </div>
      </div>
      
      <div class="form-group">
        <label for="compressImages">
          <input 
            type="checkbox" 
            id="compressImages" 
            v-model="settings.compressImages"
            @change="saveSettings"
          />
          Comprimir imágenes antes de sincronizar
        </label>
        <div class="help-text">
          Reduce el tamaño de las imágenes para mejorar la velocidad de sincronización
        </div>
      </div>
      
      <div class="form-group">
        <label for="maxImageSize">Tamaño máximo de imagen (KB):</label>
        <input 
          type="number" 
          id="maxImageSize" 
          v-model.number="settings.maxImageSize"
          min="100" 
          max="2000"
          @change="saveSettings"
        />
        <div class="help-text">
          Las imágenes más grandes que este valor serán comprimidas automáticamente
        </div>
      </div>
    </div>
    
    <div class="sync-actions">
      <button 
        @click="syncAllImages" 
        class="sync-button"
        :disabled="isSyncing"
      >
        {{ isSyncing ? 'Sincronizando...' : 'Sincronizar todas las imágenes ahora' }}
      </button>
      
      <div v-if="message" :class="['sync-message', messageType]">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { extractIndexedDBImages } from '@/scripts/extractIndexedDBImages';

// Clave para almacenar la configuración en localStorage
const STORAGE_KEY = 'websap_sync_settings';

export default {
  name: 'SyncSettings',
  setup() {
    // Estado de sincronización
    const isSyncing = ref(false);
    const message = ref('');
    const messageType = ref('info');
    
    // Configuración por defecto
    const defaultSettings = {
      autoSyncImages: true,
      compressImages: true,
      maxImageSize: 500 // KB
    };
    
    // Cargar configuración desde localStorage o usar valores por defecto
    const settings = reactive(loadSettings());
    
    // Función para cargar la configuración
    function loadSettings() {
      try {
        const savedSettings = localStorage.getItem(STORAGE_KEY);
        if (savedSettings) {
          return JSON.parse(savedSettings);
        }
      } catch (error) {
        console.error('Error al cargar configuración de sincronización:', error);
      }
      return { ...defaultSettings };
    }
    
    // Función para guardar la configuración
    function saveSettings() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        showMessage('Configuración guardada', 'success');
      } catch (error) {
        console.error('Error al guardar configuración de sincronización:', error);
        showMessage('Error al guardar configuración', 'error');
      }
    }
    
    // Función para sincronizar todas las imágenes
    async function syncAllImages() {
      try {
        isSyncing.value = true;
        showMessage('Sincronizando imágenes...', 'info');
        
        const result = await extractIndexedDBImages();
        
        if (result.success) {
          showMessage(result.message, 'success');
        } else {
          showMessage(result.message, 'error');
        }
      } catch (error) {
        console.error('Error al sincronizar imágenes:', error);
        showMessage('Error al sincronizar imágenes: ' + error.message, 'error');
      } finally {
        isSyncing.value = false;
      }
    }
    
    // Función para mostrar mensajes
    function showMessage(text, type = 'info') {
      message.value = text;
      messageType.value = type;
      
      // Limpiar el mensaje después de 5 segundos
      setTimeout(() => {
        message.value = '';
      }, 5000);
    }
    
    // Cargar configuración al montar el componente
    onMounted(() => {
      // Si no hay configuración guardada, guardar la configuración por defecto
      if (!localStorage.getItem(STORAGE_KEY)) {
        saveSettings();
      }
    });
    
    return {
      settings,
      isSyncing,
      message,
      messageType,
      saveSettings,
      syncAllImages
    };
  }
};
</script>

<style scoped>
.sync-settings {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.settings-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: flex;
  align-items: center;
  font-weight: 500;
  margin-bottom: 5px;
}

input[type="checkbox"] {
  margin-right: 8px;
}

input[type="number"] {
  width: 100px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.help-text {
  font-size: 12px;
  color: #666;
  margin-top: 3px;
  margin-left: 24px;
}

.sync-actions {
  margin-top: 20px;
}

.sync-button {
  padding: 10px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.sync-button:hover {
  background-color: #45a049;
}

.sync-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.sync-message {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
}

.sync-message.info {
  background-color: #e7f3fe;
  border: 1px solid #b6d4fe;
  color: #084298;
}

.sync-message.success {
  background-color: #d1e7dd;
  border: 1px solid #badbcc;
  color: #0f5132;
}

.sync-message.warning {
  background-color: #fff3cd;
  border: 1px solid #ffecb5;
  color: #664d03;
}

.sync-message.error {
  background-color: #f8d7da;
  border: 1px solid #f5c2c7;
  color: #842029;
}
</style>
