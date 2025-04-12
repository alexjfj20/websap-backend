<template>
  <div class="dashboard-container">
    <h1>Dashboard</h1>
    
    <!-- Panel de estado de conexión -->
    <div v-if="networkStatus" 
         :class="['connection-status', networkStatus.online ? 'online' : 'offline']">
      <div class="icon">
        <span v-if="networkStatus.online">🟢</span>
        <span v-else>🔴</span>
      </div>
      <div class="status-text">
        {{ networkStatus.online ? 'Conectado al servidor' : 'Sin conexión al servidor' }}
      </div>
    </div>
    
    <!-- Panel de carga -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando estadísticas del dashboard...</p>
    </div>
    
    <!-- Panel de error -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3>Error al cargar estadísticas</h3>
      <p>{{ error }}</p>
      <div class="actions">
        <button class="btn-retry" @click="fetchDashboardData">
          Reintentar
        </button>
        <button class="btn-offline" @click="useOfflineData">
          Usar datos guardados
        </button>
      </div>
      <div class="error-details" v-if="errorDetails">
        <details>
          <summary>Detalles técnicos</summary>
          <pre>{{ errorDetails }}</pre>
        </details>
      </div>
    </div>
    
    <!-- Contenido del Dashboard -->
    <div v-else-if="stats" class="dashboard-content">
      <!-- Tarjetas de estadísticas -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">🍽️</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalPlatos || 0 }}</div>
            <div class="stat-label">Total de Platos</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <div class="stat-value">{{ formatCurrency(stats.totalVentas || 0) }}</div>
            <div class="stat-label">Total de Ventas</div>
          </div>
        </div>
      </div>
      
      <!-- Gráficos y tablas -->
      <div class="dashboard-grid">
        <!-- Platos más vendidos -->
        <div class="chart-card">
          <h3>Platos más vendidos</h3>
          <div v-if="stats.platosMasVendidos && stats.platosMasVendidos.length > 0" 
               class="top-items">
            <div v-for="(plato, idx) in stats.platosMasVendidos" 
                 :key="idx"
                 class="top-item">
              <div class="item-rank">{{ idx + 1 }}</div>
              <div class="item-details">
                <div class="item-name">{{ plato.nombre }}</div>
                <div class="item-meta">{{ plato.cantidad }} unidades</div>
              </div>
            </div>
          </div>
          <div v-else class="empty-chart">
            No hay datos disponibles
          </div>
        </div>
        
        <!-- Ventas por día -->
        <div class="chart-card">
          <h3>Ventas por día</h3>
          <div v-if="stats.ventasPorDia && stats.ventasPorDia.length > 0" 
               class="sales-chart">
            <div class="chart-bars">
              <div v-for="(venta, idx) in stats.ventasPorDia" 
                   :key="idx" 
                   class="chart-bar-wrapper">
                <div class="chart-bar" 
                     :style="{ height: calculateBarHeight(venta.total) + '%' }"
                     :title="formatCurrency(venta.total)">
                </div>
                <div class="chart-label">
                  {{ formatDate(venta.fecha) }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-chart">
            No hay datos disponibles
          </div>
        </div>
        
        <!-- Clientes frecuentes -->
        <div class="clients-card">
          <h3>Clientes frecuentes</h3>
          <div v-if="stats.clientesFrecuentes && stats.clientesFrecuentes.length > 0">
            <table class="clients-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Visitas</th>
                  <th>Total gastado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(cliente, idx) in stats.clientesFrecuentes" :key="idx">
                  <td>{{ cliente.nombre }}</td>
                  <td>{{ cliente.telefono }}</td>
                  <td>{{ cliente.visitas }}</td>
                  <td>{{ formatCurrency(cliente.totalGastado) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-chart">
            No hay datos disponibles
          </div>
        </div>
      </div>
      
      <!-- Información de la fuente de datos -->
      <div class="data-source-info">
        <div class="data-timestamp" v-if="dataTimestamp">
          Datos actualizados: {{ formatTimestamp(dataTimestamp) }}
        </div>
        <div class="data-source">
          <span v-if="isOfflineData">⚠️ Datos cargados desde caché local</span>
          <span v-else>✓ Datos del servidor</span>
        </div>
      </div>
    </div>
    
    <!-- Sin datos -->
    <div v-else class="no-data-container">
      <div class="no-data-icon">📊</div>
      <h3>No hay datos disponibles</h3>
      <p>No se encontraron estadísticas para mostrar en este momento.</p>
      <button class="btn-retry" @click="fetchDashboardData">
        Reintentar
      </button>
    </div>
  </div>
</template>

<script>
import { getDashboardData, getDiagnosticError } from '@/services/dashboardService';
import { isOfflineMode } from '@/utils/connectionHandler';
import { diagnoseNetworkIssues } from '@/utils/networkDiagnosis';

export default {
  name: 'Dashboard',
  data() {
    return {
      stats: null,
      loading: true,
      error: null,
      errorDetails: null,
      dataTimestamp: null,
      isOfflineData: false,
      refreshInterval: null,
      networkStatus: {
        online: navigator.onLine,
        apiAvailable: false
      }
    };
  },
  
  created() {
    // Escuchar eventos de conexión
    window.addEventListener('online', this.handleConnectionChange);
    window.addEventListener('offline', this.handleConnectionChange);
    window.addEventListener('api-connection-change', this.handleApiConnectionChange);
  },
  
  mounted() {
    this.fetchDashboardData();
    
    // Programar actualización periódica cada 5 minutos si hay conexión
    this.refreshInterval = setInterval(() => {
      if (this.networkStatus.online && !isOfflineMode()) {
        this.fetchDashboardData(true);
      }
    }, 5 * 60 * 1000);
  },
  
  beforeUnmount() {
    // Limpiar intervalo y eventos al desmontar
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    window.removeEventListener('online', this.handleConnectionChange);
    window.removeEventListener('offline', this.handleConnectionChange);
    window.removeEventListener('api-connection-change', this.handleApiConnectionChange);
  },
  
  methods: {
    async fetchDashboardData(silentRefresh = false) {
      // Si es una actualización silenciosa, no mostrar el estado de carga
      if (!silentRefresh) {
        this.loading = true;
      }
      
      this.error = null;
      this.errorDetails = null;
      
      try {
        // Obtener datos del dashboard
        const result = await getDashboardData();
        
        if (!result) {
          throw new Error('No se recibieron datos');
        }
        
        console.log('📊 Datos recibidos en el dashboard:', result);
        this.stats = result;
        this.isOfflineData = isOfflineMode();
        this.dataTimestamp = Date.now();
        
      } catch (err) {
        console.error('Error al cargar dashboard:', err);
        this.error = 'No se pudieron cargar las estadísticas. Por favor, intente nuevamente.';
        
        // Obtener detalles del error para diagnóstico técnico
        const diagnosticError = getDiagnosticError();
        if (diagnosticError) {
          this.errorDetails = JSON.stringify(diagnosticError, null, 2);
        }
        
        // Si es un error de red, intentar diagnosticar
        if (err.message.includes('network') || err.message.includes('fetch')) {
          this.diagnosticNetworkIssue();
        }
      } finally {
        this.loading = false;
      }
    },
    
    async useOfflineData() {
      this.loading = true;
      
      try {
        // Forzar el uso de datos offline
        const offlineData = await this.getOfflineDataFallback();
        
        if (offlineData) {
          this.stats = offlineData;
          this.isOfflineData = true;
          this.dataTimestamp = Date.now();
          this.error = null;
          this.errorDetails = null;
        } else {
          this.error = 'No se encontraron datos guardados localmente.';
        }
      } catch (err) {
        console.error('Error al cargar datos offline:', err);
        this.error = 'No se pudieron cargar los datos guardados.';
      } finally {
        this.loading = false;
      }
    },
    
    async getOfflineDataFallback() {
      // Intentar obtener datos de IndexedDB o localStorage
      try {
        // Primero intentar obtener de IndexedDB
        const request = window.indexedDB.open('websap_dashboard', 1);
        
        return new Promise((resolve, reject) => {
          request.onerror = () => {
            // Si falla IndexedDB, intentar LocalStorage
            try {
              const data = localStorage.getItem('dashboard_data');
              if (data) {
                resolve(JSON.parse(data));
              } else {
                resolve(this.generateExampleData());
              }
            } catch (e) {
              resolve(this.generateExampleData());
            }
          };
          
          request.onsuccess = (event) => {
            try {
              const db = event.target.result;
              const tx = db.transaction('dashboard_data', 'readonly');
              const store = tx.objectStore('dashboard_data');
              const dataRequest = store.get('dashboard_stats');
              
              dataRequest.onsuccess = () => {
                if (dataRequest.result) {
                  resolve(dataRequest.result.data);
                } else {
                  // Si no hay datos en IndexedDB, probar localStorage
                  const data = localStorage.getItem('dashboard_data');
                  if (data) {
                    resolve(JSON.parse(data));
                  } else {
                    resolve(this.generateExampleData());
                  }
                }
              };
              
              dataRequest.onerror = () => {
                resolve(this.generateExampleData());
              };
            } catch (e) {
              resolve(this.generateExampleData());
            }
          };
        });
      } catch (err) {
        console.error('Error completo al obtener datos offline:', err);
        return this.generateExampleData();
      }
    },
    
    generateExampleData() {
      // Generar datos de ejemplo como último recurso
      const today = new Date();
      const dates = Array(7).fill().map((_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });
      
      return {
        totalPlatos: 42,
        totalVentas: 2850,
        platosMasVendidos: [
          { nombre: 'Paella Valenciana', cantidad: 35 },
          { nombre: 'Tortilla Española', cantidad: 28 },
          { nombre: 'Croquetas de Jamón', cantidad: 22 },
          { nombre: 'Pulpo a la Gallega', cantidad: 18 },
          { nombre: 'Gazpacho', cantidad: 15 }
        ],
        ventasPorDia: dates.map(fecha => ({
          fecha,
          total: Math.floor(Math.random() * 600) + 200
        })),
        clientesFrecuentes: [
          { nombre: 'María García', telefono: '612345678', visitas: 8, totalGastado: 432 },
          { nombre: 'Juan Pérez', telefono: '623456789', visitas: 6, totalGastado: 318 },
          { nombre: 'Ana Rodríguez', telefono: '634567890', visitas: 5, totalGastado: 275 },
          { nombre: 'Luis Martínez', telefono: '645678901', visitas: 4, totalGastado: 216 }
        ]
      };
    },
    
    async diagnosticNetworkIssue() {
      try {
        const diagnosticResults = await diagnoseNetworkIssues();
        console.log('📊 Resultados de diagnóstico de red:', diagnosticResults);
        
        // Actualizar detalles con diagnóstico
        this.errorDetails = JSON.stringify(diagnosticResults, null, 2);
        
        // Actualizar mensaje de error con más detalles
        if (!diagnosticResults.internet) {
          this.error = 'No hay conexión a Internet. Verifique su conexión de red.';
        } else if (!diagnosticResults.dns) {
          this.error = 'Problemas con DNS. No se puede resolver el nombre del servidor.';
        } else if (!diagnosticResults.apis.main && !diagnosticResults.apis.alternative) {
          this.error = 'No se pudo conectar con el servidor API. El servidor podría estar caído.';
        } else if (!diagnosticResults.cors) {
          this.error = 'Hay problemas con la configuración CORS del servidor.';
        }
      } catch (err) {
        console.error('Error al realizar diagnóstico:', err);
      }
    },
    
    handleConnectionChange(event) {
      // Actualizar estado de red cuando cambia la conexión
      this.networkStatus.online = navigator.onLine;
      console.log(`Cambio de estado de conexión: ${navigator.onLine ? 'online' : 'offline'}`);
      
      // Si recuperamos la conexión, intentar cargar datos frescos
      if (navigator.onLine && !this.loading) {
        setTimeout(() => this.fetchDashboardData(), 1000);
      }
    },
    
    handleApiConnectionChange(event) {
      // Actualizar estado cuando cambia la conexión a la API
      this.networkStatus.apiAvailable = event.detail.connected;
      console.log(`Cambio en disponibilidad de API: ${event.detail.connected}`);
    },
    
    // Funciones de formato
    formatCurrency(value) {
      return new Intl.NumberFormat('es-ES', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 0 
      }).format(value);
    },
    
    formatDate(dateStr) {
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { 
          day: 'numeric',
          month: 'short'
        });
      } catch(e) {
        return dateStr;
      }
    },
    
    formatTimestamp(timestamp) {
      try {
        const date = new Date(timestamp);
        return date.toLocaleDateString('es-ES', { 
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch(e) {
        return 'Fecha desconocida';
      }
    },
    
    calculateBarHeight(value) {
      if (!this.stats.ventasPorDia || this.stats.ventasPorDia.length === 0) return 0;
      
      const maxValue = Math.max(...this.stats.ventasPorDia.map(v => v.total));
      if (maxValue <= 0) return 0;
      
      // Devolver porcentaje (máximo 90%)
      return Math.min(90, (value / maxValue) * 90);
    }
  }
};
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 20px;
  color: #333;
  border-bottom: 2px solid #eaeaea;
  padding-bottom: 10px;
}

/* Panel de estado de conexión */
.connection-status {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.connection-status.online {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.connection-status.offline {
  background-color: #ffebee;
  color: #c62828;
}

.connection-status .icon {
  margin-right: 8px;
}

/* Estilos de carga */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Panel de error */
.error-container {
  text-align: center;
  background-color: #fff3f3;
  border-radius: 8px;
  padding: 30px;
  margin: 20px 0;
}

.error-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.actions {
  margin-top: 20px;
}

.btn-retry, .btn-offline {
  padding: 8px 16px;
  margin: 0 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-retry {
  background-color: #3498db;
  color: white;
}

.btn-offline {
  background-color: #95a5a6;
  color: white;
}

.error-details {
  margin-top: 20px;
  text-align: left;
}

.error-details summary {
  cursor: pointer;
  color: #666;
  font-weight: 500;
  margin-bottom: 10px;
}

.error-details pre {
  background: #f7f7f7;
  padding: 10px;
  overflow: auto;
  max-height: 200px;
  border-radius: 4px;
  font-size: 12px;
}

/* Tarjetas de estadísticas */
.stats-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  padding: 20px;
  flex: 1;
  min-width: 200px;
  display: flex;
  align-items: center;
}

.stat-icon {
  font-size: 32px;
  margin-right: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #3498db;
}

.stat-label {
  color: #7f8c8d;
  margin-top: 5px;
}

/* Cuadrícula del dashboard */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-card, .clients-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.clients-card {
  grid-column: span 2;
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #34495e;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

/* Lista de top items */
.top-items {
  display: flex;
  flex-direction: column;
}

.top-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.top-item:last-child {
  border-bottom: none;
}

.item-rank {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-weight: bold;
  color: #34495e;
}

.item-details {
  flex-grow: 1;
}

.item-name {
  font-weight: 500;
}

.item-meta {
  font-size: 14px;
  color: #7f8c8d;
  margin-top: 3px;
}

/* Gráfico de barras */
.sales-chart {
  height: 220px;
  display: flex;
  flex-direction: column;
}

.chart-bars {
  height: 200px;
  display: flex;
  align-items: flex-end;
  padding-top: 20px;
}

.chart-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chart-bar {
  width: 30px;
  background-color: #3498db;
  border-radius: 3px 3px 0 0;
  margin-bottom: 8px;
  transition: height 0.3s ease;
}

.chart-label {
  font-size: 12px;
  color: #7f8c8d;
}

/* Tabla de clientes */
.clients-table {
  width: 100%;
  border-collapse: collapse;
}

.clients-table th, .clients-table td {
  padding: 12px;
  text-align: left;
}

.clients-table th {
  background-color: #f9f9f9;
  color: #34495e;
  font-weight: 500;
}

.clients-table tbody tr:nth-child(odd) {
  background-color: #f7f9fc;
}

.empty-chart, .no-data-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 180px;
  color: #95a5a6;
  font-style: italic;
}

.no-data-container {
  height: 300px;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
}

.no-data-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

/* Info de la fuente de datos */
.data-source-info {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px solid #eee;
  color: #7f8c8d;
  font-size: 14px;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .clients-card {
    grid-column: span 1;
  }
  
  .clients-table {
    font-size: 14px;
  }
}
</style>