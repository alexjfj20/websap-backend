<template>
  <div class="dashboard-container">
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon users">👥</div>
        <div class="stat-content">
          <h3>{{ stats.totalUsers || 0 }}</h3>
          <p>Usuarios</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon payments">💰</div>
        <div class="stat-content">
          <h3>{{ stats.activePayments || 0 }}</h3>
          <p>Pagos Activos</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon pending">⏱️</div>
        <div class="stat-content">
          <h3>{{ stats.pendingPayments || 0 }}</h3>
          <p>Pagos Pendientes</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon system">🔄</div>
        <div class="stat-content">
          <h3>{{ systemStatus }}</h3>
          <p>Estado del Sistema</p>
        </div>
      </div>
    </div>
    
    <div class="dashboard-sections">
      <div class="dashboard-section">
        <h3>Usuarios Recientes</h3>
        <div class="loading-container" v-if="isLoading">
          <div class="spinner"></div>
          <p>Cargando usuarios...</p>
        </div>
        <table class="dashboard-table" v-else>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in recentUsers" :key="user.id">
              <td>{{ user.nombre }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span class="status-badge" :class="user.estado === 'activo' ? 'active' : 'inactive'">
                  {{ user.estado }}
                </span>
              </td>
              <td>
                <button @click="viewUserDetails(user)" class="action-btn view">
                  👁️
                </button>
              </td>
            </tr>
            <tr v-if="recentUsers.length === 0">
              <td colspan="4" class="no-data">No hay usuarios registrados</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="dashboard-section">
        <h3>Actividad Reciente</h3>
        <div class="loading-container" v-if="isLoading">
          <div class="spinner"></div>
          <p>Cargando actividad...</p>
        </div>
        <div class="activity-list" v-else>
          <div v-for="(log, index) in recentActivity" :key="index" class="activity-item">
            <div class="activity-time">{{ formatDate(log.fecha) }}</div>
            <div class="activity-content">
              <strong>{{ log.usuario_nombre || 'Usuario' }}</strong>: {{ log.accion }}
            </div>
          </div>
          <div v-if="recentActivity.length === 0" class="no-data">
            No hay actividad reciente
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import apiService from '../../services/apiService';
import { alert } from '../../services/dialogService';

export default {
  name: 'DashboardView',
  setup() {
    // Estado
    const stats = ref({
      totalUsers: 0,
      activePayments: 0,
      pendingPayments: 0
    });
    const systemStatus = ref('Normal');
    const recentUsers = ref([]);
    const recentActivity = ref([]);
    const isLoading = ref(true);
    
    // Cargar datos al montar el componente
    onMounted(() => {
      loadDashboardData();
    });
    
    // Cargar datos del dashboard
    const loadDashboardData = async () => {
      try {
        isLoading.value = true;
        
        // Hacer llamadas API en paralelo
        const [statsResponse, usersResponse, logsResponse] = await Promise.all([
          apiService.get('/admin/stats'),
          apiService.get('/users?limit=5'),
          apiService.get('/logs?limit=10')
        ]);
        
        // Procesar respuesta de estadísticas
        if (statsResponse.success) {
          stats.value = statsResponse.data;
          systemStatus.value = statsResponse.data.systemStatus || 'Normal';
        }
        
        // Procesar usuarios recientes
        if (usersResponse.success) {
          recentUsers.value = usersResponse.data || [];
        }
        
        // Procesar logs de actividad
        if (logsResponse.success) {
          recentActivity.value = logsResponse.data || [];
        }
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        await alert('Error al cargar los datos del dashboard: ' + (error.message || 'Error desconocido'));
      } finally {
        isLoading.value = false;
      }
    };
    
    // Ver detalles de usuario
    const viewUserDetails = (user) => {
      // Implementar navegación a detalles de usuario o mostrar modal
      console.log('Ver detalles del usuario:', user);
    };
    
    // Formatear fecha
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    };
    
    return {
      stats,
      systemStatus,
      recentUsers,
      recentActivity,
      isLoading,
      viewUserDetails,
      formatDate
    };
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px 0;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.15);
}

.stat-icon {
  width: 50px;
  height: 50px;
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

.stat-icon.payments {
  background-color: #e8f5e9;
  color: #388e3c;
}

.stat-icon.pending {
  background-color: #fff3e0;
  color: #f57c00;
}

.stat-icon.system {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.stat-content h3 {
  margin: 0 0 5px 0;
  font-size: 24px;
}

.stat-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.dashboard-sections {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 992px) {
  .dashboard-sections {
    grid-template-columns: 1fr 1fr;
  }
}

.dashboard-section {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.dashboard-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  font-size: 18px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.dashboard-table {
  width: 100%;
  border-collapse: collapse;
}

.dashboard-table th,
.dashboard-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.dashboard-table th {
  font-weight: 600;
  color: #555;
}

.dashboard-table tbody tr:hover {
  background-color: #f9f9f9;
}

.status-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.status-badge.active {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-badge.inactive {
  background-color: #ffebee;
  color: #d32f2f;
}

.action-btn {
  width: 30px;
  height: 30px;
  border: none;
  background-color: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: background-color 0.2s;
}

.action-btn.view:hover {
  background-color: #e3f2fd;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.activity-item {
  padding: 10px;
  border-radius: 6px;
  background-color: #f9f9f9;
  transition: background-color 0.2s;
}

.activity-item:hover {
  background-color: #f0f0f0;
}

.activity-time {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.activity-content {
  font-size: 14px;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}
</style>
