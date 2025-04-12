<template>
  <div class="backups-container">
    <div class="backups-header">
      <h2>Gestión de Respaldos</h2>
      <button 
        @click="createBackup" 
        class="action-button primary"
        :disabled="isCreatingBackup"
      >
        <span class="button-icon">
          <span v-if="isCreatingBackup" class="loading-spinner"></span>
          <span v-else>💾</span>
        </span>
        {{ isCreatingBackup ? 'Creando respaldo...' : 'Crear Nuevo Respaldo' }}
      </button>
    </div>

    <!-- Lista de backups -->
    <div class="backups-content">
      <div class="backups-info">
        <p>Los respaldos permiten guardar una copia de seguridad de todos los datos del sistema. Se recomienda crear respaldos periódicamente para prevenir pérdidas de información.</p>
      </div>

      <!-- Estado de carga -->
      <div v-if="isLoading" class="loading-container">
        <div class="spinner"></div>
        <p>Cargando respaldos...</p>
      </div>
      
      <!-- Lista de respaldos -->
      <div v-else-if="backups.length > 0" class="backups-list">
        <div v-for="backup in backups" :key="backup.id" class="backup-item">
          <div class="backup-info">
            <h3>{{ backup.archivo || 'Respaldo sin nombre' }}</h3>
            <p class="backup-date">{{ formatDate(backup.fecha) }}</p>
          </div>
          <div class="backup-actions">
            <button 
              @click="confirmRestoreBackup(backup)" 
              class="action-btn restore"
              title="Restaurar respaldo"
            >
              🔄 Restaurar
            </button>
            <button 
              @click="downloadBackup(backup)" 
              class="action-btn download"
              title="Descargar respaldo"
            >
              📥 Descargar
            </button>
            <button 
              @click="confirmDeleteBackup(backup)" 
              class="action-btn delete"
              title="Eliminar respaldo"
            >
              🗑️ Eliminar
            </button>
          </div>
        </div>
      </div>
      
      <!-- Mensaje cuando no hay respaldos -->
      <div v-else class="no-backups">
        <div class="empty-state">
          <span class="empty-icon">💾</span>
          <p>No hay respaldos disponibles</p>
          <p>Crea un nuevo respaldo para guardar una copia de seguridad de tus datos</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import apiService from '../../services/apiService';
import { confirm, alert } from '../../services/dialogService';

export default {
  name: 'BackupsView',
  setup() {
    // Estado
    const backups = ref([]);
    const isLoading = ref(true);
    const isCreatingBackup = ref(false);
    
    // Cargar respaldos cuando se monta el componente
    onMounted(() => {
      loadBackups();
    });
    
    // Cargar la lista de respaldos desde la API
    const loadBackups = async () => {
      try {
        isLoading.value = true;
        const response = await apiService.get('/backups');
        
        if (response.success) {
          backups.value = response.data || [];
        } else {
          throw new Error(response.message || 'Error al cargar respaldos');
        }
      } catch (error) {
        console.error('Error al cargar respaldos:', error);
        await alert('Error al cargar respaldos: ' + (error.message || 'Error desconocido'));
      } finally {
        isLoading.value = false;
      }
    };
    
    // Crear un nuevo respaldo
    const createBackup = async () => {
      try {
        isCreatingBackup.value = true;
        const response = await apiService.post('/backups');
        
        if (response.success) {
          backups.value.unshift(response.data);
          await alert('Respaldo creado correctamente');
        } else {
          throw new Error(response.message || 'Error al crear respaldo');
        }
      } catch (error) {
        console.error('Error al crear respaldo:', error);
        await alert('Error al crear respaldo: ' + (error.message || 'Error desconocido'));
      } finally {
        isCreatingBackup.value = false;
      }
    };
    
    // Confirmar restauración de un respaldo
    const confirmRestoreBackup = async (backup) => {
      try {
        const confirmed = await confirm(
          `¿Estás seguro de restaurar la base de datos con el respaldo "${backup.archivo}"? Todos los datos actuales serán reemplazados por los datos del respaldo.`,
          {
            title: 'Restaurar Respaldo',
            confirmText: 'Restaurar',
            cancelText: 'Cancelar'
          }
        );
        
        if (confirmed) {
          isLoading.value = true;
          const response = await apiService.post(`/backups/${backup.id}/restore`);
          
          if (response.success) {
            await alert('Base de datos restaurada correctamente. La página se recargará para aplicar los cambios.');
            window.location.reload();
          } else {
            throw new Error(response.message || 'Error al restaurar respaldo');
          }
        }
      } catch (error) {
        console.error('Error al restaurar respaldo:', error);
        await alert('Error al restaurar respaldo: ' + (error.message || 'Error desconocido'));
        isLoading.value = false;
      }
    };
    
    // Descargar un respaldo
    const downloadBackup = (backup) => {
      try {
        window.open(`/api/backups/${backup.id}/download`, '_blank');
      } catch (error) {
        console.error('Error al descargar respaldo:', error);
        alert('Error al descargar respaldo. Inténtalo nuevamente.');
      }
    };
    
    // Confirmar eliminación de un respaldo
    const confirmDeleteBackup = async (backup) => {
      try {
        const confirmed = await confirm(
          `¿Estás seguro de eliminar el respaldo "${backup.archivo}"? Esta acción no se puede deshacer.`,
          {
            title: 'Eliminar Respaldo',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
          }
        );
        
        if (confirmed) {
          isLoading.value = true;
          const response = await apiService.delete(`/backups/${backup.id}`);
          
          if (response.success) {
            backups.value = backups.value.filter(b => b.id !== backup.id);
            await alert('Respaldo eliminado correctamente');
          } else {
            throw new Error(response.message || 'Error al eliminar respaldo');
          }
        }
      } catch (error) {
        console.error('Error al eliminar respaldo:', error);
        await alert('Error al eliminar respaldo: ' + (error.message || 'Error desconocido'));
      } finally {
        isLoading.value = false;
      }
    };
    
    // Formatear fecha
    const formatDate = (dateStr) => {
      if (!dateStr) return 'Fecha desconocida';
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    return {
      backups,
      isLoading,
      isCreatingBackup,
      loadBackups,
      createBackup,
      confirmRestoreBackup,
      downloadBackup,
      confirmDeleteBackup,
      formatDate
    };
  }
};
</script>

<style scoped>
.backups-container {
  padding: 20px;
}

.backups-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.backups-header h2 {
  font-size: 24px;
  margin: 0;
  color: #333;
}

.action-button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.3s;
}

.action-button.primary {
  background-color: #28a745;
  color: white;
}

.action-button.primary:hover:not(:disabled) {
  background-color: #218838;
}

.action-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

.button-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.backups-info {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #e9f7ef;
  border-left: 4px solid #28a745;
  border-radius: 4px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #28a745;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

.backups-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.backup-item:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.backup-info h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.backup-date {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 14px;
}

.backup-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.action-btn.restore {
  background-color: #007bff;
  color: white;
}

.action-btn.restore:hover {
  background-color: #0069d9;
}

.action-btn.download {
  background-color: #17a2b8;
  color: white;
}

.action-btn.download:hover {
  background-color: #138496;
}

.action-btn.delete {
  background-color: #dc3545;
  color: white;
}

.action-btn.delete:hover {
  background-color: #c82333;
}

.no-backups {
  text-align: center;
  padding: 40px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 5px 0;
  color: #666;
}

.empty-state p:first-of-type {
  font-size: 18px;
  color: #333;
  font-weight: bold;
}

@media (max-width: 768px) {
  .backup-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .backup-actions {
    margin-top: 16px;
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
