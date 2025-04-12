<template>
  <div class="admin-dashboard">
    <h2>Panel de Control</h2>
    
    <!-- Panel de carga -->
    <div v-if="loading" class="loading-panel">
      <div class="spinner"></div>
      <p>Cargando estadísticas del dashboard...</p>
    </div>
    
    <!-- Panel de error -->
    <div v-else-if="error" class="error-panel">
      <p class="error-message">{{ error }}</p>
      <button @click="cargarDatos" class="btn btn-retry">Reintentar</button>
    </div>
    
    <!-- Contenido del dashboard -->
    <div v-else-if="dashboardData" class="dashboard-content">
      <!-- Tarjetas de estadísticas -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">👤</div>
          <div class="stat-value">{{ dashboardData.estadisticas.totalUsuarios }}</div>
          <div class="stat-label">Usuarios</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">🍽️</div>
          <div class="stat-value">{{ dashboardData.estadisticas.totalRestaurantes }}</div>
          <div class="stat-label">Restaurantes</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-value">{{ dashboardData.estadisticas.totalPedidos }}</div>
          <div class="stat-label">Pedidos</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-value">{{ formatCurrency(dashboardData.estadisticas.totalVentas) }}</div>
          <div class="stat-label">Ventas</div>
        </div>
      </div>
      
      <!-- Gráfico de ventas -->
      <div class="chart-panel">
        <h3>Ventas Mensuales</h3>
        <div class="chart-container">
          <div class="chart">
            <div 
              v-for="(item, index) in dashboardData.graficoVentas" 
              :key="`venta-${index}`" 
              class="chart-bar"
              :style="{ height: calcBarHeight(item.ventas) + '%' }">
              <span class="chart-tooltip">{{ formatCurrency(item.ventas) }}</span>
            </div>
          </div>
          <div class="chart-labels">
            <span 
              v-for="(item, index) in dashboardData.graficoVentas" 
              :key="`label-${index}`" 
              class="chart-label">
              {{ item.mes }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Paneles inferiores -->
      <div class="lower-panels">
        <!-- Restaurantes populares -->
        <div class="panel">
          <h3>Restaurantes Populares</h3>
          <div class="restaurant-list">
            <div 
              v-for="(restaurante, index) in dashboardData.restaurantesPopulares" 
              :key="`rest-${index}`"
              class="restaurant-item">
              <div class="restaurant-rank">{{ index + 1 }}</div>
              <div class="restaurant-info">
                <div class="restaurant-name">{{ restaurante.nombre }}</div>
                <div class="restaurant-orders">{{ restaurante.pedidos }} pedidos</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Usuarios activos -->
        <div class="panel">
          <h3>Usuarios Activos</h3>
          <div class="user-list">
            <div 
              v-for="(usuario, index) in dashboardData.usuariosActivos" 
              :key="`user-${index}`"
              class="user-item">
              <div class="user-avatar">
                {{ getInitials(usuario.nombre) }}
              </div>
              <div class="user-info">
                <div class="user-name">{{ usuario.nombre }}</div>
                <div class="user-role">{{ usuario.rol }}</div>
              </div>
              <div class="user-access">
                <span class="access-date">{{ formatDate(usuario.ultimoAcceso) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Pie de página del dashboard -->
      <div class="dashboard-footer">
        <div class="data-updated">
          Datos actualizados: {{ fechaActualizacion }}
        </div>
      </div>
    </div>
    
    <!-- Sin datos -->
    <div v-else class="no-data">
      <p>No hay datos disponibles para mostrar.</p>
      <button @click="cargarDatos" class="btn btn-retry">Cargar datos</button>
    </div>
  </div>
</template>

<script>
// Importamos el nuevo servicio
import { obtenerDatosDashboard } from '@/services/adminDashboardService';

export default {
  name: 'AdminDashboard',
  
  data() {
    return {
      dashboardData: {
        estadisticas: {
          totalUsuarios: 0,
          totalRestaurantes: 0,
          totalPedidos: 0,
          totalVentas: 0
        },
        graficoVentas: [],
        restaurantesPopulares: [],
        usuariosActivos: []
      },
      loading: true,
      error: null
    };
  },
  
  async created() {
    await this.cargarDatosDashboard();
  },
  
  methods: {
    async cargarDatosDashboard() {
      try {
        console.log('Cargando estadísticas del dashboard...');
        this.loading = true;
        
        const respuesta = await obtenerDatosDashboard();
        
        if (respuesta && respuesta.success && respuesta.data) {
          this.dashboardData = respuesta.data;
          console.log('Datos del dashboard cargados correctamente');
        } else {
          console.warn('Respuesta incorrecta del API de dashboard');
          // No hacemos nada porque el servicio ya proporciona datos de respaldo
        }
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        // No hacemos nada porque el servicio ya maneja los errores
      } finally {
        this.loading = false;
      }
    },
    
    formatCurrency(value) {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
      }).format(value);
    },
    
    formatDate(dateStr) {
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return dateStr;
      }
    },
    
    getInitials(name) {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    },
    
    calcBarHeight(value) {
      if (!this.dashboardData || !this.dashboardData.graficoVentas) return 0;
      
      const maxVenta = Math.max(
        ...this.dashboardData.graficoVentas.map(item => item.ventas)
      );
      
      return (value / maxVenta) * 80; // 80% como altura máxima
    }
  }
};
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

h2 {
  margin-bottom: 20px;
  color: #333;
}

/* Estilos para el panel de carga */
.loading-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Estilos para el panel de error */
.error-panel {
  background-color: #ffebee;
  border-left: 4px solid #f44336;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.error-message {
  color: #d32f2f;
  margin: 0 0 10px 0;
}

.btn-retry {
  background-color: #2196f3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-retry:hover {
  background-color: #1976d2;
}

/* Estilos para las tarjetas de estadísticas */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

@media (max-width: 1000px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  font-size: 28px;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

/* Estilos para el gráfico */
.chart-panel {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.chart-container {
  height: 250px;
  margin-top: 20px;
}

.chart {
  display: flex;
  align-items: flex-end;
  height: 200px;
  gap: 10px;
}

.chart-bar {
  flex: 1;
  background-color: #3498db;
  min-width: 30px;
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: height 0.3s;
}

.chart-bar:hover {
  background-color: #2980b9;
}

.chart-tooltip {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
  white-space: nowrap;
}

.chart-bar:hover .chart-tooltip {
  opacity: 1;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.chart-label {
  flex: 1;
  text-align: center;
  font-size: 12px;
  color: #666;
  min-width: 30px;
}

/* Estilos para paneles inferiores */
.lower-panels {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .lower-panels {
    grid-template-columns: 1fr;
  }
}

.panel {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Estilos para lista de restaurantes */
.restaurant-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.restaurant-item:last-child {
  border-bottom: none;
}

.restaurant-rank {
  width: 24px;
  height: 24px;
  background-color: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #333;
  margin-right: 12px;
}

.restaurant-info {
  flex: 1;
}

.restaurant-name {
  font-weight: 500;
  margin-bottom: 2px;
}

.restaurant-orders {
  font-size: 12px;
  color: #666;
}

/* Estilos para lista de usuarios */
.user-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.user-item:last-child {
  border-bottom: none;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 12px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 500;
  margin-bottom: 2px;
}

.user-role {
  font-size: 12px;
  color: #666;
}

.user-access {
  font-size: 12px;
  color: #888;
}

/* Estilos para pie de página */
.dashboard-footer {
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px solid #eee;
  color: #888;
  font-size: 12px;
  text-align: right;
}

/* Sin datos */
.no-data {
  padding: 40px;
  text-align: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  color: #666;
}
</style>
