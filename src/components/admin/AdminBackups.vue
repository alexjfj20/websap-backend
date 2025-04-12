<template>
  <div class="backups-container">
    <h2 class="section-title">Gestión de Respaldos</h2>
    
    <div class="backups-actions">
      <button @click="createNewBackup" class="create-backup-btn" :disabled="creating">
        <span v-if="creating">
          <span class="loading-spinner"></span> Creando respaldo...
        </span>
        <span v-else>
          <span class="action-icon">💾</span> Crear respaldo ahora
        </span>
      </button>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando respaldos...</p>
    </div>
    
    <div v-else-if="backups.length === 0" class="empty-state">
      <div class="empty-icon">📂</div>
      <p>No hay respaldos disponibles</p>
      <p class="empty-desc">Crea tu primer respaldo haciendo clic en el botón "Crear respaldo ahora"</p>
    </div>
    
    <div v-else class="backups-grid">
      <div v-for="backup in backups" :key="backup.id" class="backup-card">
        <div class="backup-icon">💾</div>
        <div class="backup-info">
          <h3>{{ backup.archivo }}</h3>
          <p class="backup-date">Fecha: {{ formatDate(backup.fecha) }}</p>
          <p class="backup-size">Tamaño: {{ backup.tamano }}</p>
        </div>
        <div class="backup-actions">
          <button @click="restoreBackup(backup)" class="restore-btn" :disabled="restoring === backup.id">
            <span v-if="restoring === backup.id">Restaurando...</span>
            <span v-else>Restaurar</span>
          </button>
          <button @click="downloadBackup(backup)" class="download-btn">Descargar</button>
          <button @click="deleteBackup(backup)" class="delete-btn" :disabled="deleting === backup.id">
            <span v-if="deleting === backup.id">Eliminando...</span>
            <span v-else>Eliminar</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Modal de confirmación para restaurar respaldo -->
    <div v-if="showRestoreModal" class="modal-overlay" @click.self="cancelRestore">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Confirmar restauración</h3>
          <button @click="cancelRestore" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p class="warning-text">
            <span class="warning-icon">⚠️</span>
            Estás a punto de restaurar el sistema a partir del respaldo seleccionado. Esta acción sobrescribirá los datos actuales.
          </p>
          <p>¿Estás seguro de que deseas continuar?</p>
        </div>
        <div class="modal-footer">
          <button @click="cancelRestore" class="cancel-btn">Cancelar</button>
          <button @click="confirmRestore" class="confirm-btn">Confirmar restauración</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { getBackups, createBackup, restoreBackup, deleteBackup as deleteBackupFromDB } from '../../services/backupService';
import { confirm, alert } from '../../services/dialogService';

export default {
  name: 'AdminBackups',
  setup() {
    const backups = ref([]);
    const loading = ref(true);
    const creating = ref(false);
    const restoring = ref(null);
    const deleting = ref(null);
    const selectedBackup = ref(null);
    const showRestoreModal = ref(false);
    
    // Cargar respaldos al montar el componente
    onMounted(async () => {
      await fetchBackups();
    });
    
    // Obtener respaldos
    const fetchBackups = async () => {
      try {
        loading.value = true;
        const response = await getBackups();
        
        if (response && response.success) {
          backups.value = response.data || [];
          
          // Ordenar por fecha (más reciente primero)
          backups.value.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        } else {
          throw new Error('Error al cargar respaldos');
        }
      } catch (error) {
        console.error('Error al obtener respaldos:', error);
        await alert('Error al cargar los respaldos: ' + (error.message || 'Error desconocido'));
      } finally {
        loading.value = false;
      }
    };
    
    // Formatear fecha
    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A';
      
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        
        return new Intl.DateTimeFormat('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).format(date);
      } catch (e) {
        return 'Fecha inválida';
      }
    };
    
    // Crear nuevo respaldo
    const createNewBackup = async () => {
      try {
        creating.value = true;
        const result = await createBackup();
        
        if (result && result.success) {
          // Agregar el nuevo respaldo a la lista
          backups.value.unshift(result.data);
          await alert('Respaldo creado correctamente');
        } else {
          throw new Error('Error al crear el respaldo');
        }
      } catch (error) {
        console.error('Error al crear respaldo:', error);
        await alert('Error al crear respaldo: ' + (error.message || 'Error desconocido'));
      } finally {
        creating.value = false;
      }
    };
    
    // Iniciar proceso de restauración
    const restoreBackup = (backup) => {
      selectedBackup.value = backup;
      showRestoreModal.value = true;
    };
    
    // Cancelar restauración
    const cancelRestore = () => {
      showRestoreModal.value = false;
      selectedBackup.value = null;
    };
    
    // Confirmar restauración
    const confirmRestore = async () => {
      try {
        if (!selectedBackup.value) return;
        
        showRestoreModal.value = false;
        restoring.value = selectedBackup.value.id;
        
        const result = await restoreBackup(selectedBackup.value.id);
        
        if (result && result.success) {
          await alert('Respaldo restaurado correctamente. Se recargará la página para aplicar los cambios.');
          // Recargar la página
          window.location.reload();
        } else {
          throw new Error('Error al restaurar el respaldo');
        }
      } catch (error) {
        console.error('Error al restaurar respaldo:', error);
        await alert('Error al restaurar respaldo: ' + (error.message || 'Error desconocido'));
      } finally {
        restoring.value = null;
        selectedBackup.value = null;
      }
    };
    
    // Descargar respaldo
    const downloadBackup = async (backup) => {
      try {
        // En una implementación real, esto descargaría el archivo del servidor
        // Para el prototipo, simulamos la descarga
        const element = document.createElement('a');
        element.setAttribute('href', 'data:application/zip;charset=utf-8,' + encodeURIComponent('Contenido simulado de respaldo'));
        element.setAttribute('download', backup.archivo);
        
        element.style.display = 'none';
        document.body.appendChild(element);
        
        element.click();
        
        document.body.removeChild(element);
        
        await alert('Respaldo descargado correctamente');
      } catch (error) {
        console.error('Error al descargar respaldo:', error);
        await alert('Error al descargar respaldo: ' + (error.message || 'Error desconocido'));
      }
    };
    
    // Eliminar respaldo
    const deleteBackup = async (backup) => {
      try {
        const confirmed = await confirm(`¿Estás seguro de eliminar el respaldo "${backup.archivo}"?`, {
          title: 'Confirmar eliminación',
          confirmText: 'Eliminar',
          cancelText: 'Cancelar'
        });
        
        if (confirmed) {
          deleting.value = backup.id;
          const result = await deleteBackupFromDB(backup.id);
          
          if (result && result.success) {
            // Eliminar el respaldo de la lista
            backups.value = backups.value.filter(b => b.id !== backup.id);
            await alert('Respaldo eliminado correctamente');
          } else {
            throw new Error('Error al eliminar el respaldo');
          }
        }
      } catch (error) {
        console.error('Error al eliminar respaldo:', error);
        await alert('Error al eliminar respaldo: ' + (error.message || 'Error desconocido'));
      } finally {
        deleting.value = null;
      }
    };
    
    return {
      backups,
      loading,
      creating,
      restoring,
      deleting,
      selectedBackup,
      showRestoreModal,
      formatDate,
      createNewBackup,
      restoreBackup,
      cancelRestore,
      confirmRestore,
      downloadBackup,
      deleteBackup
    };
  }
};
</script>

<style scoped>
.backups-container {
  padding: 0;
}

.section-title {
  font-size: 24px;
  margin-bottom: 30px;
  color: #333;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 10px;
}

.backups-actions {
  margin-bottom: 30px;
  display: flex;
  justify-content: flex-end;
}

.create-backup-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 20px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.create-backup-btn:hover:not(:disabled) {
  background-color: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.create-backup-btn:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.action-icon {
  font-size: 18px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 15px;
}

.spinner, .loading-spinner {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.3);
  border-top: 3px solid white;
  animation: spin 1s linear infinite;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4CAF50;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  color: #666;
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px dashed #ddd;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-desc {
  font-style: italic;
  font-size: 14px;
  margin-top: 10px;
  color: #888;
}

.backups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.backup-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
}

.backup-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.backup-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  height: 80px;
  background-color: #e8f5e9;
  color: #388e3c;
}

.backup-info {
  padding: 15px;
}

.backup-info h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #333;
  word-break: break-all;
}

.backup-date, .backup-size {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.backup-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 15px;
  border-top: 1px solid #eee;
}

.backup-actions button {
  padding: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s;
}

.restore-btn {
  grid-column: 1 / 3;
  background-color: #2196F3;
  color: white;
}

.restore-btn:hover:not(:disabled) {
  background-color: #0b7dda;
}

.download-btn {
  background-color: #4CAF50;
  color: white;
}

.download-btn:hover {
  background-color: #45a049;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.delete-btn:hover:not(:disabled) {
  background-color: #d32f2f;
}

.restore-btn:disabled,
.delete-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.warning-text {
  background-color: #fff3e0;
  padding: 15px;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.warning-icon {
  font-size: 20px;
}

.modal-footer {
  padding: 15px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #eee;
}

.cancel-btn, .confirm-btn {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.cancel-btn {
  background-color: #f1f1f1;
  color: #333;
}

.cancel-btn:hover {
  background-color: #e1e1f1;
}

.confirm-btn {
  background-color: #2196F3;
  color: white;
}

.confirm-btn:hover {
  background-color: #0b7dda;
}

@media (max-width: 768px) {
  .backups-grid {
    grid-template-columns: 1fr;
  }
  
  .backup-actions {
    grid-template-columns: 1fr;
  }
  
  .restore-btn {
    grid-column: auto;
  }
}
</style>
