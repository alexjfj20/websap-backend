// src/components/utils/IndexedDBBackup.vue

<template>
  <div class="indexeddb-backup">
    <button @click="backupIndexedDB" class="backup-button" :disabled="isBackingUp">
      {{ isBackingUp ? 'Procesando...' : 'Sincronizar imágenes originales' }}
    </button>
    <div v-if="message" :class="['backup-message', messageType]">
      {{ message }}
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { extractIndexedDBImages } from '@/scripts/extractIndexedDBImages';
import { optimizeImageForSync } from '@/services/imageService';

export default {
  name: 'IndexedDBBackup',
  setup() {
    const isBackingUp = ref(false);
    const message = ref('');
    const messageType = ref('info');

    // Función para hacer respaldo de IndexedDB
    const backupIndexedDB = async () => {
      try {
        isBackingUp.value = true;
        message.value = 'Recuperando y optimizando imágenes originales...';
        messageType.value = 'info';
        
        // Extraer imágenes de IndexedDB y sincronizarlas con MySQL
        const result = await extractIndexedDBImages();
        
        if (result.success) {
          message.value = result.message;
          messageType.value = 'success';
        } else {
          message.value = result.message;
          messageType.value = 'error';
        }
      } catch (error) {
        console.error('Error al recuperar imágenes originales:', error);
        message.value = 'Error al recuperar imágenes originales: ' + error.message;
        messageType.value = 'error';
      } finally {
        isBackingUp.value = false;
        
        // Limpiar el mensaje después de 10 segundos
        setTimeout(() => {
          message.value = '';
        }, 10000);
      }
    };

    return {
      isBackingUp,
      message,
      messageType,
      backupIndexedDB
    };
  }
};
</script>

<style scoped>
.indexeddb-backup {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.backup-button {
  padding: 10px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.backup-button:hover {
  background-color: #45a049;
}

.backup-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.backup-message {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  max-width: 400px;
  text-align: center;
}

.backup-message.info {
  background-color: #e7f3fe;
  border: 1px solid #b6d4fe;
  color: #084298;
}

.backup-message.success {
  background-color: #d1e7dd;
  border: 1px solid #badbcc;
  color: #0f5132;
}

.backup-message.warning {
  background-color: #fff3cd;
  border: 1px solid #ffecb5;
  color: #664d03;
}

.backup-message.error {
  background-color: #f8d7da;
  border: 1px solid #f5c2c7;
  color: #842029;
}
</style>
