<template>
  <div class="dashboard-container">
    <h2 class="section-title">Dashboard</h2>
    
    <div v-if="loading" class="loading-spinner-container">
      <div class="spinner"></div>
      <p>Cargando datos...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="loadStats" class="retry-button">Reintentar</button>
    </div>
    
    <div v-else class="dashboard-content">
      <!-- Tarjetas de estadísticas -->
      <div class="stats-cards">
        <div class="stat-card users">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <h3>{{ stats.totalUsers }}</h3>
            <p>Usuarios Registrados</p>
          </div>
        </div>
        
        <div class="stat-card menu">
          <div class="stat-icon">🍽️</div>
          <div class="stat-info">
            <h3>{{ stats.activePayments }}</h3>
            <p>Pagos Activos</p>
          </div>
        </div>
        
        <div class="stat-card sales">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <h3>{{ formatCurrency(stats.totalIncome) }}</h3>
            <p>Ingresos Totales</p>
          </div>
        </div>
      </div>
      
      <!-- Actividad Reciente -->
      <div class="recent-activity">
        <h3>Actividad Reciente</h3>
        <div v-if="stats.recentActivity && stats.recentActivity.length > 0" class="activity-list">
          <div v-for="(activity, index) in stats.recentActivity" :key="index" class="activity-item">
            <div class="activity-icon" :class="activity.tipo">
              <span v-if="activity.tipo === 'user_login'">👤</span>
              <span v-else-if="activity.tipo === 'system'">📝</span>
              <span v-else>📝</span>
            </div>
            <div class="activity-content">
              <p><strong>{{ activity.usuario_nombre }}</strong> {{ activity.accion }}</p>
              <span class="activity-time">{{ formatDate(activity.fecha) }}</span>
            </div>
          </div>
        </div>
        <p v-else class="no-activity">No hay actividad reciente registrada</p>
      </div>
      
      <!-- Estado del Sistema -->
      <div class="system-status">
        <h3>Estado del Sistema</h3>
        <div class="status-info">
          <p><strong>Estado:</strong> <span :class="'status-' + stats.status.toLowerCase()">{{ stats.status }}</span></p>
          <p><strong>Último respaldo:</strong> {{ formatDate(stats.lastBackup) }}</p>
          <p><strong>Usuarios activos:</strong> {{ stats.activeUsers }}</p>
          <p><strong>Usuarios inactivos:</strong> {{ stats.inactiveUsers }}</p>
        </div>
      </div>
    </div>
    
    <!-- Botón para refrescar -->
    <button @click="loadStats" class="refresh-button">
      <span class="refresh-icon">🔄</span> Actualizar Datos
    </button>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { getDashboardStats } from '../../services/adminService';

export default {
  name: 'AdminDashboard',
  setup() {
    const stats = ref({
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      activePayments: 0,
      pendingPayments: 0,
      overduePayments: 0,
      totalIncome: 0,
      status: 'Normal',
      lastBackup: null,
      recentActivity: []
    });
    const loading = ref(true);
    const error = ref(null);

    // Cargar estadísticas del dashboard
    const loadStats = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        console.log('Cargando estadísticas del dashboard...');
        
        // Intentar obtener los datos del servicio
        const response = await getDashboardStats();
        
        if (response && response.success && response.data) {
          console.log('Estadísticas cargadas correctamente:', response.data);
          stats.value = response.data;
        } else {
          // Si hay un error en la respuesta, usar datos de respaldo
          console.warn('Error en la respuesta del servicio, usando datos de respaldo');
          error.value = response.error || 'Error al cargar las estadísticas';
          
          // Mantener los datos actuales si ya teníamos algunos
          if (stats.value.totalUsers === 0) {
            // Si no teníamos datos, usar valores por defecto
            stats.value = {
              totalUsers: 4,
              activeUsers: 3,
              inactiveUsers: 1,
              activePayments: 28,
              pendingPayments: 8,
              overduePayments: 3,
              totalIncome: 15750000,
              status: 'Normal',
              lastBackup: new Date().toISOString(),
              recentActivity: [
                {
                  tipo: 'user_login',
                  usuario_nombre: 'Admin',
                  accion: 'inició sesión en el sistema',
                  fecha: new Date().toISOString()
                },
                {
                  tipo: 'system',
                  usuario_nombre: 'Sistema',
                  accion: 'realizó una sincronización de datos',
                  fecha: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                }
              ]
            };
          }
        }
      } catch (e) {
        console.error('Error al cargar estadísticas:', e);
        error.value = e.message || 'Error al cargar las estadísticas';
        
        // Usar datos de respaldo en caso de error
        if (stats.value.totalUsers === 0) {
          stats.value = {
            totalUsers: 4,
            activeUsers: 3,
            inactiveUsers: 1,
            activePayments: 28,
            pendingPayments: 8,
            overduePayments: 3,
            totalIncome: 15750000,
            status: 'Normal',
            lastBackup: new Date().toISOString(),
            recentActivity: [
              {
                tipo: 'system',
                usuario_nombre: 'Sistema',
                accion: 'inició en modo de respaldo',
                fecha: new Date().toISOString()
              }
            ]
          };
        }
      } finally {
        loading.value = false;
      }
    };

    // Formatear fecha
    const formatDate = (dateString) => {
      if (!dateString) return 'No disponible';
      
      try {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        console.error('Error al formatear fecha:', e);
        return dateString;
      }
    };

    // Formatear moneda
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(value);
    };

    // Cargar datos al montar el componente
    onMounted(() => {
      loadStats();
    });

    return {
      stats,
      loading,
      error,
      loadStats,
      formatDate,
      formatCurrency
    };
  }
};
</script>

<style scoped>
.dashboard-container {
  padding: 0;
}

.section-title {
  font-size: 24px;
  margin-bottom: 30px;
  color: #333;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 15px rgba(0,0,0,0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.users {
  background-color: #e3f2fd;
  color: #1976d2;
}

.stat-icon.menus {
  background-color: #e8f5e9;
  color: #388e3c;
}

.stat-icon.sales {
  background-color: #fff8e1;
  color: #ffa000;
}

.stat-icon.system {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.stat-content h3 {
  font-size: 24px;
  margin: 0 0 5px 0;
  color: #333;
}

.stat-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.dashboard-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 30px;
}

.action-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 15px 20px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.action-button:hover {
  background-color: #45a049;
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}

.action-icon {
  font-size: 20px;
}
</style>
