<template>
  <div class="superadmin-container">
    <header class="superadmin-header">
      <h1>Panel de Super Administrador</h1>
      <div class="user-info">
        <span>{{ currentUser?.nombre || 'Administrador' }}</span>
        <button @click="logout" class="logout-btn">Cerrar Sesión</button>
      </div>
    </header>

    <div class="superadmin-layout">
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

        <!-- Backups -->
        <div v-if="activeTab === 'backups'" class="tab-content">
          <AdminBackups />
        </div>

        <!-- Logs -->
        <div v-if="activeTab === 'logs'" class="tab-content">
          <AdminLogs />
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getCurrentUser, logout, hasRole } from '../services/authService';
import { alert } from '../services/dialogService';
import AdminDashboard from '../components/admin/AdminDashboard.vue';
import AdminUsers from '../components/admin/AdminUsers.vue';
import AdminInventory from '../components/admin/AdminInventory.vue';
import AdminBackups from '../components/admin/AdminBackups.vue';
import AdminLogs from '../components/admin/AdminLogs.vue';

export default {
  name: 'SuperAdminView',
  components: {
    AdminDashboard,
    AdminUsers,
    AdminInventory,
    AdminBackups,
    AdminLogs,
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
      { id: 'backups', name: 'Respaldos', icon: '💾' },
      { id: 'logs', name: 'Logs', icon: '📝' },
    ];

    onMounted(async () => {
      try {
        // Verificar permisos de SuperAdmin
        const user = getCurrentUser();
        
        if (!user) {
          await alert('Debe iniciar sesión para acceder a esta sección', {
            title: 'Acceso Restringido'
          });
          router.push('/login');
          return;
        }
        
        // Verificar rol de Superadministrador
        if (!hasRole('Superadministrador')) {
          await alert('No tiene permisos para acceder a esta sección', {
            title: 'Acceso Denegado'
          });
          router.push('/menu');
          return;
        }
        
        currentUser.value = user;
      } catch (error) {
        console.error('Error al cargar la vista de SuperAdmin:', error);
      }
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
      refreshDashboard
    };
  }
};
</script>

<style scoped>
.superadmin-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.superadmin-header {
  background-color: #1c2b36;
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.superadmin-header h1 {
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

.superadmin-layout {
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

/* Responsive design */
@media (max-width: 768px) {
  .superadmin-layout {
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
</style>
