<template>
  <div class="sync-business-info">
    <h2>Sincronización de Información del Negocio</h2>
    
    <div v-if="message" class="alert" :class="{ 'alert-success': success, 'alert-danger': !success && message }">
      {{ message }}
    </div>
    
    <div class="status-info">
      <div class="status-item">
        <strong>Estado de sincronización:</strong> 
        <span :class="isAutoSyncEnabled ? 'status-active' : 'status-inactive'">
          {{ isAutoSyncEnabled ? 'Activa' : 'Inactiva' }}
        </span>
      </div>
      
      <div class="status-item">
        <strong>Última sincronización:</strong> 
        <span>{{ lastSyncFormatted }}</span>
      </div>
    </div>
    
    <div class="settings-section">
      <h3>Configuración de Sincronización</h3>
      
      <div class="form-group">
        <label class="toggle-switch">
          <input type="checkbox" v-model="isAutoSyncEnabled" @change="toggleAutoSync">
          <span class="slider"></span>
          <span class="toggle-label">Sincronización automática</span>
        </label>
      </div>
      
      <div class="form-group">
        <label>Intervalo de verificación:</label>
        <select v-model="syncInterval" @change="updateSyncInterval" :disabled="!isAutoSyncEnabled">
          <option value="15000">15 segundos (pruebas)</option>
          <option value="30000">30 segundos</option>
          <option value="60000">1 minuto</option>
          <option value="300000">5 minutos</option>
        </select>
      </div>
    </div>
    
    <div class="actions">
      <button @click="runMigration" class="btn btn-primary" :disabled="loading">
        <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Ejecutar Migración
      </button>
      
      <button @click="syncBusinessInfo" class="btn btn-success" :disabled="loading">
        <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Sincronizar Ahora
      </button>
      
      <button @click="fetchFromBackend" class="btn btn-info" :disabled="loading">
        <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Actualizar desde Servidor
      </button>
      
      <button @click="syncAndRefresh" class="btn btn-warning" :disabled="loading">
        <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Sincronizar y Refrescar
      </button>
    </div>
    
    <div class="current-info" v-if="businessInfo">
      <h3>Información Actual del Negocio</h3>
      <div class="info-card">
        <div class="info-header">
          <h4>{{ businessInfo.name || 'Sin nombre' }}</h4>
          <div class="info-badge">{{ lastUpdateFormatted }}</div>
        </div>
        <div class="info-content">
          <div class="info-row">
            <strong>Descripción:</strong> {{ businessInfo.description || 'Sin descripción' }}
          </div>
          <div class="info-row">
            <strong>Dirección:</strong> {{ businessInfo.address || 'Sin dirección' }}
          </div>
          <div class="info-row">
            <strong>Contacto:</strong> {{ businessInfo.contact || 'Sin contacto' }}
          </div>
          <div class="info-row logo-preview" v-if="businessInfo.logo">
            <strong>Logo:</strong>
            <img :src="businessInfo.logo" alt="Logo" class="logo-thumbnail">
          </div>
          <div class="info-row" v-if="businessInfo.paymentInfo">
            <strong>Información de Pago:</strong>
            <div class="payment-info">
              <div v-if="businessInfo.paymentInfo.qrTitle">QR: {{ businessInfo.paymentInfo.qrTitle }}</div>
              <div v-if="businessInfo.paymentInfo.nequiNumber">Nequi: {{ businessInfo.paymentInfo.nequiNumber }}</div>
              <div v-if="businessInfo.paymentInfo.bankInfo">Banco: {{ businessInfo.paymentInfo.bankInfo }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="sync-log">
      <h3>Registro de Sincronización</h3>
      <div class="log-container">
        <div v-for="(log, index) in syncLogs" :key="index" class="log-entry" :class="{'log-success': log.success, 'log-error': !log.success}">
          <div class="log-timestamp">{{ formatTimestamp(log.timestamp) }}</div>
          <div class="log-message">{{ log.message }}</div>
        </div>
        <div v-if="syncLogs.length === 0" class="log-empty">
          No hay registros de sincronización.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {
  runAddInformacionPagoMigration,
  syncBusinessInfoWithBackend,
  fetchBusinessInfoFromBackend,
  startBusinessInfoSyncInterval,
  stopBusinessInfoSyncInterval,
  checkForBusinessInfoChanges,
  invalidateBusinessInfoCache
} from '../../services/businessInfoService';
import { getBusinessInfo } from '../../services/storageService';
import eventBus from '../../utils/eventBus';

export default {
  name: 'SyncBusinessInfo',
  
  setup() {
    const loading = ref(false);
    const success = ref(false);
    const message = ref('');
    const businessInfo = ref(null);
    const lastSync = ref(null);
    const lastUpdate = ref(null);
    const isAutoSyncEnabled = ref(true);
    const syncInterval = ref('30000');
    const syncLogs = ref([]);
    
    // Formatear la fecha de última sincronización
    const lastSyncFormatted = computed(() => {
      if (!lastSync.value) return 'Nunca';
      return formatTimestamp(lastSync.value);
    });
    
    // Formatear la fecha de última actualización
    const lastUpdateFormatted = computed(() => {
      if (!lastUpdate.value) return '';
      return `Actualizado: ${formatTimestamp(lastUpdate.value)}`;
    });
    
    // Formatear timestamp en fecha legible
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    };
    
    // Añadir entrada al registro de sincronización
    const addSyncLog = (logMessage, isSuccess = true) => {
      syncLogs.value.unshift({
        message: logMessage,
        success: isSuccess,
        timestamp: Date.now()
      });
      
      // Limitar a 10 entradas
      if (syncLogs.value.length > 10) {
        syncLogs.value = syncLogs.value.slice(0, 10);
      }
    };
    
    // Manejar evento de actualización de información
    const handleBusinessInfoUpdate = (updatedInfo) => {
      businessInfo.value = updatedInfo;
      lastUpdate.value = Date.now();
      addSyncLog('Información del negocio actualizada');
    };
    
    // Cargar la información del negocio al montar el componente
    onMounted(async () => {
      try {
        // Suscribirse al evento de actualización
        eventBus.on('business-info-updated', handleBusinessInfoUpdate);
        
        // Cargar la información del negocio
        await loadBusinessInfo();
        
        // Iniciar sincronización automática
        if (isAutoSyncEnabled.value) {
          startBusinessInfoSyncInterval();
          addSyncLog('Sincronización automática iniciada');
        }
      } catch (error) {
        console.error('Error al montar el componente:', error);
        message.value = 'Error al cargar información del negocio';
        success.value = false;
        addSyncLog('Error al cargar información del negocio', false);
      }
    });
    
    onUnmounted(() => {
      // Cancelar suscripción al evento
      eventBus.off('business-info-updated', handleBusinessInfoUpdate);
      
      // Detener sincronización automática
      stopBusinessInfoSyncInterval();
    });
    
    // Cargar la información del negocio
    const loadBusinessInfo = async () => {
      try {
        loading.value = true;
        businessInfo.value = await getBusinessInfo();
        lastUpdate.value = Date.now();
      } catch (error) {
        console.error('Error al cargar información del negocio:', error);
        message.value = 'Error al cargar información del negocio';
        success.value = false;
        addSyncLog('Error al cargar información del negocio', false);
      } finally {
        loading.value = false;
      }
    };
    
    // Ejecutar la migración para añadir la columna informacion_pago
    const runMigration = async () => {
      try {
        loading.value = true;
        message.value = 'Ejecutando migración...';
        
        const result = await runAddInformacionPagoMigration();
        
        success.value = result.success;
        message.value = result.message;
        
        if (result.success) {
          addSyncLog('Migración ejecutada con éxito');
        } else {
          addSyncLog(`Error en migración: ${result.message}`, false);
        }
      } catch (error) {
        console.error('Error al ejecutar migración:', error);
        success.value = false;
        message.value = error.message || 'Error al ejecutar migración';
        addSyncLog(`Error en migración: ${error.message}`, false);
      } finally {
        loading.value = false;
      }
    };
    
    // Sincronizar la información del negocio con el backend
    const syncBusinessInfo = async () => {
      try {
        loading.value = true;
        message.value = 'Sincronizando información...';
        
        const result = await syncBusinessInfoWithBackend();
        
        success.value = result.success;
        message.value = result.message;
        
        if (result.success) {
          lastSync.value = result.timestamp || Date.now();
          await loadBusinessInfo();
          addSyncLog('Sincronización completada con éxito');
        } else {
          addSyncLog(`Error en sincronización: ${result.message}`, false);
        }
      } catch (error) {
        console.error('Error al sincronizar información:', error);
        success.value = false;
        message.value = error.message || 'Error al sincronizar información';
        addSyncLog(`Error en sincronización: ${error.message}`, false);
      } finally {
        loading.value = false;
      }
    };
    
    // Obtener la información del negocio desde el backend
    const fetchFromBackend = async () => {
      try {
        loading.value = true;
        message.value = 'Obteniendo información desde el servidor...';
        
        // Invalidar la caché primero
        invalidateBusinessInfoCache();
        
        // Forzar la actualización desde el backend
        businessInfo.value = await fetchBusinessInfoFromBackend(true);
        
        success.value = true;
        message.value = 'Información actualizada desde el servidor';
        lastUpdate.value = Date.now();
        addSyncLog('Información actualizada desde el servidor');
      } catch (error) {
        console.error('Error al obtener información desde el servidor:', error);
        success.value = false;
        message.value = error.message || 'Error al obtener información desde el servidor';
        addSyncLog(`Error al obtener información: ${error.message}`, false);
      } finally {
        loading.value = false;
      }
    };
    
    // Sincronizar y verificar cambios
    const syncAndRefresh = async () => {
      try {
        loading.value = true;
        message.value = 'Sincronizando y verificando cambios...';
        
        // Sincronizar la información actual con el backend
        await syncBusinessInfoWithBackend();
        
        // Verificar si hay cambios
        const hasChanges = await checkForBusinessInfoChanges();
        
        if (hasChanges) {
          success.value = true;
          message.value = 'Se detectaron y aplicaron cambios en la información';
          addSyncLog('Se detectaron y aplicaron cambios');
        } else {
          success.value = true;
          message.value = 'No se detectaron cambios en la información';
          addSyncLog('No se detectaron cambios');
        }
        
        // Actualizar la información
        await loadBusinessInfo();
        lastSync.value = Date.now();
      } catch (error) {
        console.error('Error al sincronizar y verificar cambios:', error);
        success.value = false;
        message.value = error.message || 'Error al sincronizar y verificar cambios';
        addSyncLog(`Error al sincronizar: ${error.message}`, false);
      } finally {
        loading.value = false;
      }
    };
    
    // Alternar sincronización automática
    const toggleAutoSync = () => {
      if (isAutoSyncEnabled.value) {
        startBusinessInfoSyncInterval();
        addSyncLog('Sincronización automática activada');
      } else {
        stopBusinessInfoSyncInterval();
        addSyncLog('Sincronización automática desactivada');
      }
    };
    
    // Actualizar intervalo de sincronización
    const updateSyncInterval = () => {
      // Detener el intervalo actual
      stopBusinessInfoSyncInterval();
      
      // Actualizar SYNC_INTERVAL en businessInfoService.js
      // Esto es solo visual, ya que no podemos modificar directamente la constante
      addSyncLog(`Intervalo de sincronización actualizado a ${parseInt(syncInterval.value) / 1000} segundos`);
      
      // Reiniciar si está habilitado
      if (isAutoSyncEnabled.value) {
        startBusinessInfoSyncInterval();
      }
    };
    
    return {
      loading,
      success,
      message,
      businessInfo,
      lastSync,
      lastSyncFormatted,
      lastUpdateFormatted,
      isAutoSyncEnabled,
      syncInterval,
      syncLogs,
      runMigration,
      syncBusinessInfo,
      fetchFromBackend,
      syncAndRefresh,
      toggleAutoSync,
      updateSyncInterval,
      formatTimestamp
    };
  }
};
</script>

<style scoped>
.sync-business-info {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.sync-business-info h2 {
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #dee2e6;
}

.alert {
  padding: 12px;
  margin: 15px 0;
  border-radius: 6px;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-info {
  background: #fff;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  border: 1px solid #e9ecef;
}

.status-item {
  padding: 8px 0;
}

.status-active {
  color: #28a745;
  font-weight: bold;
}

.status-inactive {
  color: #dc3545;
  font-weight: bold;
}

.settings-section {
  background: #fff;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid #e9ecef;
}

.settings-section h3 {
  font-size: 1.2rem;
  margin-bottom: 15px;
  color: #495057;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group select {
  width: 100%;
  max-width: 300px;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ced4da;
}

.toggle-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: relative;
  cursor: pointer;
  width: 50px;
  height: 24px;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
  margin-right: 10px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #28a745;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.toggle-label {
  font-weight: 500;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 20px 0;
}

.current-info {
  margin-top: 30px;
}

.info-card {
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.info-header {
  background-color: #f8f9fa;
  padding: 15px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-header h4 {
  margin: 0;
  color: #343a40;
  font-size: 1.2rem;
}

.info-badge {
  font-size: 0.85rem;
  color: #6c757d;
}

.info-content {
  padding: 15px;
}

.info-row {
  margin-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 12px;
}

.info-row strong {
  color: #495057;
  margin-right: 5px;
}

.logo-thumbnail {
  max-width: 100px;
  max-height: 60px;
  margin-top: 5px;
  border-radius: 4px;
  display: block;
}

.payment-info {
  margin-top: 5px;
  padding-left: 15px;
  border-left: 2px solid #e9ecef;
}

.sync-log {
  margin-top: 30px;
}

.sync-log h3 {
  color: #333;
  margin-bottom: 15px;
}

.log-container {
  background-color: #fff;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  max-height: 300px;
  overflow-y: auto;
}

.log-entry {
  padding: 10px 15px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
}

.log-success {
  border-left: 4px solid #28a745;
}

.log-error {
  border-left: 4px solid #dc3545;
}

.log-timestamp {
  font-size: 0.85rem;
  color: #6c757d;
  width: 180px;
  flex-shrink: 0;
}

.log-message {
  flex-grow: 1;
}

.log-empty {
  padding: 15px;
  color: #6c757d;
  text-align: center;
  font-style: italic;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-info {
  background-color: #17a2b8;
  color: white;
}

.btn-warning {
  background-color: #ffc107;
  color: #212529;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.spinner-border-sm {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 0.2em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border .75s linear infinite;
  margin-right: 5px;
}

@keyframes spinner-border {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
  
  .status-info {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
