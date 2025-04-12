<template>
  <div class="employee-view">
    <div class="container mt-4">
      <div class="text-center mb-4">
        <h1 class="text-center">Bienvenido, Empleado</h1>
        <h2 class="lead text-center">Desde aquí puedes ver productos y realizar pedidos.</h2>
      </div>
      
      <!-- Gestión de Reservas con estructura de card -->
      <div class="card" style="max-width: 1750px; margin: auto;" >
        <div class="card-body">
          <h3>Gestión de Reservas</h3>
          <hr>
          <button class="btn btn-success" @click="toggleReservas">
            Ver Reservas
          </button>
          
          <div v-if="showReservas" class="mt-3">
            <AdminReservas :readOnly="true" ref="adminReservasRef" />
          </div>
        </div>
      </div>
      
      <!-- MenuComponent sin cambios -->
      <MenuComponent :restrictedAccess="true" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { getCurrentUser, logout, hasRole } from '../services/authService';
import { alert } from '../services/dialogService';
import MenuComponent from '../components/MenuComponent.vue';
import AdminReservas from '@/components/admin/AdminReservas.vue';
import eventBus from '@/utils/eventBus';

export default {
  name: 'EmployeeView',
  components: {
    MenuComponent,
    AdminReservas
  },
  setup() {
    const router = useRouter();
    const user = ref(null);
    const showReservas = ref(false);
    
    // Referencia al componente AdminReservas
    const adminReservasRef = ref(null);
    
    // Definir handleNuevaReserva FUERA de onMounted para poder 
    // acceder a ella en onUnmounted
    const handleNuevaReserva = () => {
      if (showReservas.value && adminReservasRef.value) {
        adminReservasRef.value.refreshReservations();
      }
    };
    
    onMounted(() => {
      // Verificar si el usuario está autenticado
      const currentUser = getCurrentUser();
      if (!currentUser) {
        alert('Debe iniciar sesión para acceder a esta página');
        router.push('/login');
        return;
      }
      user.value = currentUser;
      
      // Registrar el evento
      eventBus.on('nueva-reserva', handleNuevaReserva);
    });

    onUnmounted(() => {
      // Ahora podemos acceder a handleNuevaReserva correctamente
      eventBus.off('nueva-reserva', handleNuevaReserva);
    });

    const handleLogout = () => {
      logout();
      router.push('/login');
    };

    const toggleReservas = () => {
      showReservas.value = !showReservas.value;
    };

    return {
      user,
      handleLogout,
      showReservas,
      toggleReservas,
      adminReservasRef
    };
  }
};
</script>

<style scoped>
.employee-view {
  min-height: 100vh;
  background-color: #f8f9fa;
}

/* Estilos para títulos centrados */
h1, h2.lead {
  text-align: center;
  width: 100%;
}

h1 {
  color: #333;
  margin-bottom: 15px;
}

h2.lead {
  font-weight: 300;
  color: #555;
}

/* Estilos para las secciones */
h3 {
  font-size: 1.25rem;
  margin-bottom: 0;
  color: #333;
}

hr {
  margin-top: 10px;
  margin-bottom: 15px;
  border-color: #dee2e6;
}

/* Estilo para botón verde con esquinas más redondeadas y tamaño consistente */
.btn-success {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
  border-radius: 0.3rem;  /* Hacer las esquinas un poco más redondeadas */
  padding: 0.375rem 0.75rem;  /* Padding estándar de Bootstrap */
  font-size: 1rem;  /* Tamaño de fuente estándar */
  min-width: 140px;  /* Ancho mínimo para consistencia con otros botones */
  text-align: center;
}

.btn-success:hover {
  background-color: #218838;
  border-color: #1e7e34;
}

/* Estilo para botones grises */
.btn-secondary {
  background-color: #e2e6ea;
  border-color: #dae0e5;
  color: #333;
}

/* Estilos para las cards */
.card {
  margin-top: 1rem;
  margin-bottom: 1rem;
  border: none;
  border-radius: 0.25rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card-body {
  padding: 1.25rem;
}

/* garantizar una buena experiencia en dispositivos móviles */
@media (max-width: 480px) {
  .payment-options {
    flex-direction: column;
    gap: 8px;
  }
  
  .payment-option {
    width: 100%;
  }
}
</style>

