<template>
  <div class="admin-container">
    <header class="admin-header">
      <h1>Panel de Administración</h1>
      <div class="user-info">
        <span>{{ currentUser?.nombre || 'Administrador' }}</span>
        <button @click="logout" class="logout-btn">Cerrar Sesión</button>
      </div>
    </header>

    <div class="admin-layout">
      <!-- Barra lateral de navegación -->
      <aside class="sidebar">
        <nav class="nav-menu">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            :class="['nav-item', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            <span class="nav-icon">{{ tab.icon }}</span>
            <span class="nav-text">{{ tab.name }}</span>
          </button>
        </nav>
      </aside>

      <!-- Contenido principal -->
      <main class="content">
        <!-- Dashboard -->
        <div v-if="activeTab === 'dashboard'" class="tab-content">
          <AdminDashboard @change-tab="changeTab" />
        </div>

        <!-- Usuarios -->
        <div v-if="activeTab === 'users'" class="tab-content">
          <AdminUsers @user-created="refreshDashboard" />
        </div>

        <!-- Inventario -->
        <div v-if="activeTab === 'inventory'" class="tab-content">
          <AdminInventory />
        </div>

        <!-- Gestión de productos -->
        <div v-if="activeTab === 'products'" class="tab-content">
          <MenuComponent />
        </div>

        <!-- Gestión de Reservas -->
        <div v-if="activeTab === 'reservas'" class="tab-content">
          <AdminReservas ref="adminReservasRef" />
        </div>

        <!-- Sincronización de Información del Negocio -->
        <div v-if="activeTab === 'sync-business-info'" class="tab-content">
          <SyncBusinessInfo />
        </div>

        <!-- Configuración de la Aplicación -->
        <div v-if="activeTab === 'config'" class="tab-content">
          <AdminConfig />
        </div>

        <!-- Respaldos -->
        <div v-if="activeTab === 'backups'" class="tab-content">
          <AdminBackups />
        </div>

        <!-- Logs -->
        <div v-if="activeTab === 'logs'" class="tab-content">
          <AdminLogs />
        </div>

        <!-- Reportes -->
        <div v-if="activeTab === 'reports'" class="tab-content">
          <h2>Reportes</h2>
          <p>Módulo de reportes en desarrollo...</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { getCurrentUser, logout, hasRole } from '../services/authService';
import { alert } from '../services/dialogService';
import AdminDashboard from '../components/admin/AdminDashboard.vue';
import AdminInventory from '../components/admin/AdminInventory.vue';
import AdminUsers from '../components/admin/AdminUsers.vue';
import AdminBackups from '../components/admin/AdminBackups.vue';
import AdminLogs from '../components/admin/AdminLogs.vue';
import AdminConfig from '../components/admin/AdminConfig.vue';
import MenuComponent from '../components/MenuComponent.vue';
import AdminReservas from '@/components/admin/AdminReservas.vue';
import SyncBusinessInfo from '@/components/admin/SyncBusinessInfo.vue'; // Importar componente SyncBusinessInfo
import eventBus from '@/utils/eventBus';

export default {
  name: 'AdminView',
  components: {
    AdminDashboard,
    AdminInventory,
    AdminUsers,
    AdminBackups,
    AdminLogs,
    MenuComponent,
    AdminReservas,
    SyncBusinessInfo, // Registrar componente SyncBusinessInfo
    AdminConfig
  },
  setup() {
    const router = useRouter();
    const activeTab = ref('dashboard');
    const currentUser = ref(null);
    
    // Definir pestañas disponibles
    const tabs = [
      { id: 'dashboard', name: 'Dashboard', icon: '📊' },
      { id: 'users', name: 'Usuarios', icon: '👥' },
      { id: 'inventory', name: 'Inventario', icon: '📦' },
      { id: 'products', name: 'Gestión de Productos', icon: '🍔' },
      { id: 'reservas', name: 'Gestión de Reservas', icon: '📅' },
      { id: 'sync-business-info', name: 'Sincronización de Información del Negocio', icon: '🔄' },
      { id: 'config', name: 'Configuración', icon: '⚙️' },
      { id: 'backups', name: 'Respaldos', icon: '💾' },
      { id: 'logs', name: 'Logs', icon: '📝' },
      { id: 'reports', name: 'Reportes', icon: '📈' }
    ];

    // Referencia al componente AdminReservas
    const adminReservasRef = ref(null);
    
    // Escuchar eventos de nueva reserva
    const handleNuevaReserva = () => {
      // Si la pestaña activa es reservas, actualizamos inmediatamente
      if (activeTab.value === 'reservas' && adminReservasRef.value) {
        adminReservasRef.value.refreshReservations();
      }
    };
    
    onMounted(async () => {
      try {
        // Verificar permisos de Administrador
        const user = getCurrentUser();
        
        if (!user) {
          await alert('Debe iniciar sesión para acceder a esta sección', {
            title: 'Acceso Restringido'
          });
          router.push('/login');
          return;
        }
        
        // Verificar rol de Administrador
        if (!hasRole('Administrador') && !hasRole('Superadministrador')) {
          await alert('No tiene permisos para acceder a esta sección', {
            title: 'Acceso Denegado'
          });
          router.push('/menu');
          return;
        }
        
        currentUser.value = user;

        eventBus.on('nueva-reserva', handleNuevaReserva);
      } catch (error) {
        console.error('Error al cargar la vista de Administrador:', error);
      }
    });

    onUnmounted(() => {
      eventBus.off('nueva-reserva', handleNuevaReserva);
    });

    // Cambiar de pestaña
    const changeTab = (tabId) => {
      if (tabs.some(tab => tab.id === tabId)) {
        activeTab.value = tabId;
      }
    };

    // Cerrar sesión
    const handleLogout = async () => {
      try {
        logout();
        router.push('/login');
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        await alert('Error al cerrar sesión. Por favor, intente nuevamente.');
      }
    };

    // Función para refrescar el dashboard cuando se crea un usuario
    const refreshDashboard = () => {
      console.log("Se creó un nuevo usuario, se actualizará el dashboard");
      // Cambiar temporalmente a otra pestaña y luego volver a dashboard
      // para forzar la recarga del componente
      if (activeTab.value === 'dashboard') {
        activeTab.value = '_temp';
        setTimeout(() => {
          activeTab.value = 'dashboard';
        }, 10);
      }
    };

    return {
      activeTab,
      currentUser,
      tabs,
      changeTab,
      logout: handleLogout,
      refreshDashboard,
      adminReservasRef
    };
  }
};
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.admin-header {
  background-color: #1c2b36;
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.admin-header h1 {
  font-size: 1.5rem;
  margin: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logout-btn {
  background-color: rgba(255,255,255,0.1);
  color: white;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background-color: rgba(255,255,255,0.2);
}

.admin-layout {
  display: flex;
  flex: 1;
}

.sidebar {
  width: 250px;
  background-color: #2c3e50;
  color: white;
  padding: 20px 0;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: transparent;
  border: none;
  color: #ecf0f1;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background-color: rgba(255,255,255,0.1);
}

.nav-item.active {
  background-color: rgba(255,255,255,0.2);
  border-left-color: #4CAF50;
  font-weight: 600;
}

.nav-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
}

.content {
  flex: 1;
  padding: 20px;
  background-color: #f5f5f5;
  overflow-y: auto;
}

.tab-content {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 20px;
  min-height: calc(100vh - 140px);
}

.coming-soon {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.coming-soon h2 {
  color: #333;
  margin-bottom: 10px;
}

/* Responsive design */
@media (max-width: 768px) {
  .admin-layout {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    padding: 10px 0;
  }
  
  .nav-menu {
    flex-direction: row;
    overflow-x: auto;
    white-space: nowrap;
    gap: 0;
  }
  
  .nav-item {
    padding: 10px 15px;
    border-left: none;
    border-bottom: 3px solid transparent;
  }
  
  .nav-item.active {
    border-left-color: transparent;
    border-bottom-color: #4CAF50;
  }
  
  .nav-text {
    display: none;
  }
  
  .nav-icon {
    font-size: 24px;
  }
}

/* Estilos para la sección de configuración de reservas */
.reservas-config-section {
  margin-top: 30px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.section-description {
  color: #666;
  margin-bottom: 20px;
}

.reservas-settings {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.1);
}

.settings-form h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-group input[type="number"],
.form-group input[type="time"] {
  width: 100%;
  max-width: 200px;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 8px;
}

.time-slots-container {
  margin-top: 10px;
}

.time-slot {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.time-slot input {
  flex: 1;
  max-width: 150px;
  margin-right: 10px;
}

.remove-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 16px;
  padding: 0 5px;
}

.add-btn {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  margin-top: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.add-btn:hover {
  background-color: #0069d9;
}

.form-actions {
  margin-top: 25px;
  display: flex;
  gap: 10px;
}

.save-btn {
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.save-btn:hover {
  background-color: #218838;
}

.reset-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.reset-btn:hover {
  background-color: #5a6268;
}

.restaurant-menu-section h2 {
  margin-bottom: 20px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}
</style>