<template>
  <div class="logs-container">
    <h2 class="section-title">Registros del Sistema</h2>
    
    <div class="logs-controls">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchTerm" 
          placeholder="Buscar en registros..." 
          class="search-input"
          @input="debounceSearch"
        />
        <button class="search-btn">🔍</button>
      </div>
      
      <div class="filters">
        <select v-model="typeFilter" class="filter-select" @change="applyFilters">
          <option value="">Todos los tipos</option>
          <option value="info">Información</option>
          <option value="warning">Advertencia</option>
          <option value="error">Error</option>
          <option value="success">Éxito</option>
        </select>
        
        <select v-model="dateFilter" class="filter-select" @change="applyFilters">
          <option value="">Todas las fechas</option>
          <option value="today">Hoy</option>
          <option value="yesterday">Ayer</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mes</option>
        </select>
      </div>
      
      <div class="actions">
        <button @click="refreshLogs" class="refresh-btn">
          <span class="btn-icon">🔄</span> Actualizar
        </button>
        <button @click="downloadLogs" class="download-btn">
          <span class="btn-icon">⬇️</span> Descargar
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando registros...</p>
    </div>
    
    <div v-else-if="filteredLogs.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <p>No se encontraron registros</p>
    </div>
    
    <div v-else class="logs-table-wrapper">
      <table class="logs-table">
        <thead>
          <tr>
            <th class="timestamp-col">Fecha y Hora</th>
            <th class="type-col">Tipo</th>
            <th class="user-col">Usuario</th>
            <th class="message-col">Mensaje</th>
            <th class="actions-col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in filteredLogs" :key="log.id" :class="'log-row ' + log.type">
            <td>{{ formatDate(log.timestamp) }}</td>
            <td>
              <span class="log-type" :class="log.type">
                {{ getTypeLabel(log.type) }}
              </span>
            </td>
            <td>{{ log.user || 'Sistema' }}</td>
            <td class="message-cell">{{ log.message }}</td>
            <td>
              <button @click="viewLogDetails(log)" class="detail-btn">
                <span>👁️</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-if="filteredLogs.length > 0" class="pagination">
      <button 
        @click="changePage(currentPage - 1)" 
        :disabled="currentPage === 1"
        class="pagination-btn"
      >
        &lt; Anterior
      </button>
      
      <div class="page-numbers">
        <button 
          v-for="page in displayedPages" 
          :key="page" 
          @click="changePage(page)"
          :class="['page-number', { active: currentPage === page }]"
        >
          {{ page }}
        </button>
      </div>
      
      <button 
        @click="changePage(currentPage + 1)" 
        :disabled="currentPage === totalPages"
        class="pagination-btn"
      >
        Siguiente &gt;
      </button>
    </div>
    
    <!-- Modal para ver detalles de un log -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Detalles del Registro</h3>
          <button @click="closeModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="log-detail-item">
            <span class="detail-label">Fecha y Hora:</span>
            <span class="detail-value">{{ formatDate(selectedLog.timestamp) }}</span>
          </div>
          <div class="log-detail-item">
            <span class="detail-label">Tipo:</span>
            <span class="detail-value">
              <span class="log-type" :class="selectedLog.type">
                {{ getTypeLabel(selectedLog.type) }}
              </span>
            </span>
          </div>
          <div class="log-detail-item">
            <span class="detail-label">Usuario:</span>
            <span class="detail-value">{{ selectedLog.user || 'Sistema' }}</span>
          </div>
          <div class="log-detail-item">
            <span class="detail-label">Mensaje:</span>
            <span class="detail-value">{{ selectedLog.message }}</span>
          </div>
          <div class="log-detail-item">
            <span class="detail-label">Detalles adicionales:</span>
            <pre class="detail-value detail-json">{{ JSON.stringify(selectedLog.details, null, 2) }}</pre>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="close-btn">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { getLogs, downloadLogsCSV } from '../../services/adminService';
import { alert } from '../../services/dialogService';

export default {
  name: 'AdminLogs',
  setup() {
    const logs = ref([]);
    const loading = ref(true);
    const searchTerm = ref('');
    const typeFilter = ref('');
    const dateFilter = ref('');
    const currentPage = ref(1);
    const pageSize = ref(10);
    
    // Modal para detalles
    const showModal = ref(false);
    const selectedLog = ref({});
    
    // Variable para setTimeout de búsqueda
    let searchTimeout = null;
    
    onMounted(async () => {
      await fetchLogs();
    });
    
    // Obtener logs
    const fetchLogs = async () => {
      try {
        loading.value = true;
        
        const response = await getLogs();
        
        if (response && response.success) {
          logs.value = response.data || [];
        } else {
          throw new Error('Error al cargar logs');
        }
      } catch (error) {
        console.error('Error al obtener logs:', error);
        await alert('Error al cargar los logs: ' + (error.message || 'Error desconocido'));
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
    
    // Obtener etiqueta para el tipo de log
    const getTypeLabel = (type) => {
      switch (type) {
        case 'info': return 'Información';
        case 'warning': return 'Advertencia';
        case 'error': return 'Error';
        case 'success': return 'Éxito';
        default: return type;
      }
    };
    
    // Filtrar logs
    const filteredLogs = computed(() => {
      let result = [...logs.value];
      
      // Filtrar por término de búsqueda
      if (searchTerm.value) {
        const term = searchTerm.value.toLowerCase();
        result = result.filter(log => 
          (log.message && log.message.toLowerCase().includes(term)) ||
          (log.user && log.user.toLowerCase().includes(term))
        );
      }
      
      // Filtrar por tipo
      if (typeFilter.value) {
        result = result.filter(log => log.type === typeFilter.value);
      }
      
      // Filtrar por fecha
      if (dateFilter.value) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (dateFilter.value) {
          case 'today':
            result = result.filter(log => {
              const logDate = new Date(log.timestamp);
              return logDate >= today;
            });
            break;
          case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            result = result.filter(log => {
              const logDate = new Date(log.timestamp);
              return logDate >= yesterday && logDate < today;
            });
            break;
          case 'week':
            const lastWeek = new Date(today);
            lastWeek.setDate(lastWeek.getDate() - 7);
            result = result.filter(log => {
              const logDate = new Date(log.timestamp);
              return logDate >= lastWeek;
            });
            break;
          case 'month':
            const lastMonth = new Date(today);
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            result = result.filter(log => {
              const logDate = new Date(log.timestamp);
              return logDate >= lastMonth;
            });
            break;
        }
      }
      
      return result;
    });
    
    // Paginación
    const totalPages = computed(() => {
      return Math.ceil(filteredLogs.value.length / pageSize.value);
    });
    
    const displayedPages = computed(() => {
      const pages = [];
      const maxVisiblePages = 5;
      
      if (totalPages.value <= maxVisiblePages) {
        for (let i = 1; i <= totalPages.value; i++) {
          pages.push(i);
        }
      } else {
        let startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
          startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i);
        }
      }
      
      return pages;
    });
    
    const paginatedLogs = computed(() => {
      const startIdx = (currentPage.value - 1) * pageSize.value;
      return filteredLogs.value.slice(startIdx, startIdx + pageSize.value);
    });
    
    // Cambiar página
    const changePage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
      }
    };
    
    // Debounce para la búsqueda
    const debounceSearch = () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentPage.value = 1;
      }, 300);
    };
    
    // Aplicar filtros
    const applyFilters = () => {
      currentPage.value = 1;
    };
    
    // Actualizar logs
    const refreshLogs = async () => {
      await fetchLogs();
      await alert('Registros actualizados correctamente');
    };
    
    // Descargar logs
    const downloadLogs = async () => {
      try {
        loading.value = true;
        const result = await downloadLogsCSV();
        
        if (result && result.success) {
          // En una implementación real, esto descargaría un archivo
          const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          
          link.setAttribute('href', url);
          link.setAttribute('download', `logs_${new Date().toISOString().split('T')[0]}.csv`);
          link.style.visibility = 'hidden';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          await alert('Logs descargados correctamente');
        } else {
          throw new Error('Error al descargar logs');
        }
      } catch (error) {
        console.error('Error al descargar logs:', error);
        await alert('Error al descargar logs: ' + (error.message || 'Error desconocido'));
      } finally {
        loading.value = false;
      }
    };
    
    // Ver detalles de log
    const viewLogDetails = (log) => {
      selectedLog.value = log;
      showModal.value = true;
    };
    
    // Cerrar modal
    const closeModal = () => {
      showModal.value = false;
    };
    
    return {
      logs,
      loading,
      searchTerm,
      typeFilter,
      dateFilter,
      currentPage,
      totalPages,
      displayedPages,
      filteredLogs,
      showModal,
      selectedLog,
      formatDate,
      getTypeLabel,
      debounceSearch,
      applyFilters,
      refreshLogs,
      downloadLogs,
      changePage,
      viewLogDetails,
      closeModal
    };
  }
};
</script>

<style scoped>
.logs-container {
  padding: 0;
}

.section-title {
  font-size: 24px;
  margin-bottom: 30px;
  color: #333;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 10px;
}

.logs-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 15px;
  border: 1px solid #ddd;
  border-radius: 50px;
  font-size: 15px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.search-btn {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.filters {
  display: flex;
  gap: 10px;
}

.filter-select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  min-width: 150px;
}

.actions {
  display: flex;
  gap: 10px;
}

.refresh-btn, 
.download-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.refresh-btn {
  background-color: #2196F3;
  color: white;
}

.refresh-btn:hover {
  background-color: #0b7dda;
}

.download-btn {
  background-color: #4CAF50;
  color: white;
}

.download-btn:hover {
  background-color: #45a049;
}

.btn-icon {
  font-size: 16px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 15px;
}

.spinner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4CAF50;
  animation: spin 1s linear infinite;
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
  font-style: italic;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px dashed #ddd;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.logs-table-wrapper {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
}

.logs-table th, 
.logs-table td {
  padding: 15px;
  text-align: left;
}

.logs-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.logs-table td {
  border-top: 1px solid #eee;
}

.logs-table tr:hover td {
  background-color: #f9f9f9;
}

.timestamp-col {
  width: 180px;
}

.type-col {
  width: 120px;
}

.user-col {
  width: 150px;
}

.actions-col {
  width: 80px;
  text-align: center;
}

.message-cell {
  max-width: 400px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-type {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 50px;
  font-size: 12px;
  font-weight: 500;
}

.log-type.info {
  background-color: #e3f2fd;
  color: #1976d2;
}

.log-type.warning {
  background-color: #fff3e0;
  color: #f57c00;
}

.log-type.error {
  background-color: #ffebee;
  color: #d32f2f;
}

.log-type.success {
  background-color: #e8f5e9;
  color: #388e3c;
}

.detail-btn {
  background-color: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 5px;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.detail-btn:hover {
  opacity: 1;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
  align-items: center;
}

.pagination-btn {
  background-color: #f1f1f1;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-btn:not(:disabled):hover {
  background-color: #e1e1e1;
}

.page-numbers {
  display: flex;
  gap: 5px;
}

.page-number {
  background-color: #f1f1f1;
  border: none;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.page-number.active {
  background-color: #4CAF50;
  color: white;
}

.page-number:not(.active):hover {
  background-color: #e1e1e1;
}

/* Modal de detalles */
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
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

.log-detail-item {
  margin-bottom: 15px;
}

.detail-label {
  font-weight: bold;
  display: block;
  margin-bottom: 5px;
  color: #333;
}

.detail-value {
  display: block;
  color: #666;
}

.detail-json {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
}

.modal-footer button {
  padding: 8px 15px;
  background-color: #f1f1f1;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.modal-footer button:hover {
  background-color: #e1e1e1;
}

@media (max-width: 768px) {
  .logs-controls {
    flex-direction: column;
  }
  
  .search-box, .filters, .actions {
    width: 100%;
  }
  
  .filters {
    flex-wrap: wrap;
  }
  
  .filter-select {
    flex: 1;
    min-width: 100px;
  }
  
  .actions {
    justify-content: space-between;
  }
  
  .logs-table .timestamp-col,
  .logs-table .user-col {
    display: none;
  }
}
</style>
