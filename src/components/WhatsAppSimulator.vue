<template>
  <div class="whatsapp-simulator" v-if="shouldShowSimulator">
    <button @click="toggleSimulator" class="toggle-button">
      <span v-if="showSimulator">❌ Cerrar Simulador</span>
      <span v-else>📱 Simular WhatsApp</span>
    </button>
    
    <div v-if="showSimulator" class="simulator-panel">
      <h3>Simulador de Reservas WhatsApp</h3>
      
      <div class="form-group">
        <label for="nombre">Nombre:</label>
        <input type="text" id="nombre" v-model="reservationData.nombre" placeholder="Nombre del cliente">
      </div>
      
      <div class="form-group">
        <label for="telefono">Teléfono:</label>
        <input type="text" id="telefono" v-model="reservationData.telefono" placeholder="612345678">
      </div>
      
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" v-model="reservationData.email" placeholder="cliente@example.com">
      </div>
      
      <div class="form-group">
        <label for="fecha">Fecha:</label>
        <input type="date" id="fecha" v-model="reservationData.fecha">
      </div>
      
      <div class="form-group">
        <label for="hora">Hora:</label>
        <select id="hora" v-model="reservationData.hora">
          <option value="13:00">13:00</option>
          <option value="13:30">13:30</option>
          <option value="14:00">14:00</option>
          <option value="14:30">14:30</option>
          <option value="20:00">20:00</option>
          <option value="20:30">20:30</option>
          <option value="21:00">21:00</option>
          <option value="21:30">21:30</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="personas">Personas:</label>
        <select id="personas" v-model="reservationData.personas">
          <option :value="1">1 persona</option>
          <option :value="2">2 personas</option>
          <option :value="3">3 personas</option>
          <option :value="4">4 personas</option>
          <option :value="5">5 personas</option>
          <option :value="6">6 personas</option>
          <option :value="8">8 personas</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="notas">Notas:</label>
        <textarea id="notas" v-model="reservationData.notas" placeholder="Notas adicionales"></textarea>
      </div>
      
      <div class="buttons">
        <button @click="sendReservation" class="send-button" :disabled="isProcessing">Enviar Reserva</button>
      </div>
      
      <div v-if="status" :class="['status', status.type]">
        {{ status.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import eventBus from '@/utils/eventBus';

const route = useRoute();
const showSimulator = ref(false);
const isProcessing = ref(false);
const status = ref(null);
const buttonEnabled = ref(false); // Inicializado en false para que esté desactivado por defecto

// Determinar si estamos en la vista de login
const isLoginPage = computed(() => {
  const isLoginRoute = route.name === 'login';
  const isLoginPath = route.path === '/login' || route.path === '/login/';
  console.log(`WhatsAppSimulator - Route check: name=${route.name}, path=${route.path}, isLoginRoute=${isLoginRoute}, isLoginPath=${isLoginPath}`);
  return isLoginRoute || isLoginPath;
});

// Determinar si estamos en la vista de menú compartido
const isSharedMenuView = computed(() => {
  return route.name === 'shared-menu' || route.path.startsWith('/menu/');
});

// Determinar si debemos mostrar el simulador basado en la página actual y la configuración
const shouldShowSimulator = computed(() => {
  // No mostrar en login o menu compartido (lógica existente)
  const showBasedOnRoute = !isLoginPage.value && !isSharedMenuView.value;
  // No mostrar si está desactivado en la configuración
  const result = showBasedOnRoute && buttonEnabled.value;
  console.log(`WhatsAppSimulator - Visibility check: isLoginPage=${isLoginPage.value}, isSharedMenuView=${isSharedMenuView.value}, shouldShow=${result}`);
  return result;
});

// Función que maneja los cambios en la configuración del botón
const handleConfigChange = (isEnabled) => {
  console.log(`WhatsAppSimulator - Config changed: button enabled = ${isEnabled}`);
  buttonEnabled.value = isEnabled;
};

// Cargar la configuración al montar el componente
onMounted(() => {
  console.log(`WhatsAppSimulator - Component mounted on route: ${route.name} (${route.path})`);
  
  // Cargar configuración del botón desde localStorage
  const storedValue = localStorage.getItem('whatsappButtonEnabled');
  if (storedValue !== null) {
    buttonEnabled.value = storedValue === 'true';
    console.log(`WhatsAppSimulator - Loaded config: button enabled = ${buttonEnabled.value}`);
  }
  
  // Escuchar eventos de cambio de configuración
  eventBus.on('whatsapp-button-config-changed', handleConfigChange);
});

// Limpiar suscripciones al desmontar el componente
onUnmounted(() => {
  eventBus.off('whatsapp-button-config-changed', handleConfigChange);
});

// Datos de la reserva
const reservationData = reactive({
  nombre: '',
  telefono: '',
  email: '',
  fecha: new Date().toISOString().split('T')[0],
  hora: '20:00',
  personas: 2,
  notas: ''
});

// Función para mostrar/ocultar el simulador
const toggleSimulator = () => {
  showSimulator.value = !showSimulator.value;
};

// Función para enviar la reserva
const sendReservation = async () => {
  try {
    isProcessing.value = true;
    status.value = { type: 'info', message: 'Enviando reserva...' };
    
    // Validar datos mínimos
    if (!reservationData.nombre || !reservationData.telefono) {
      alert('Por favor, completa al menos el nombre y teléfono');
      status.value = { type: 'error', message: 'Faltan datos obligatorios' };
      return;
    }
    
    console.log('Enviando reserva desde WhatsApp Simulator:', reservationData);
    
    // Construir el mensaje de WhatsApp
    const message = `
*NUEVA RESERVA DE MESA*
---------------------------
*Nombre:* ${reservationData.nombre}
*Teléfono móvil:* ${reservationData.telefono}
${reservationData.email ? `*Email:* ${reservationData.email}` : ''}
*Fecha:* ${reservationData.fecha}
*Hora:* ${reservationData.hora}
*Personas:* ${reservationData.personas}
${reservationData.notas ? `*Notas:* ${reservationData.notas}` : ''}
---------------------------
Reserva enviada desde WhatsApp Simulator
`;
    
    // Emitir el evento con el mensaje
    console.log('Emitiendo evento whatsapp-message con el mensaje:', message);
    eventBus.emit('whatsapp-message', message);
    
    // Emitir evento para refrescar la lista de reservas
    console.log('Emitiendo evento refresh-reservations');
    eventBus.emit('refresh-reservations');
    
    // Mostrar confirmación
    status.value = { type: 'success', message: 'Reserva enviada correctamente' };
    
    // Limpiar formulario
    clearForm();
  } catch (error) {
    console.error('Error al enviar reserva:', error);
    status.value = { type: 'error', message: 'Error al enviar la reserva: ' + error.message };
  } finally {
    isProcessing.value = false;
    
    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => {
      status.value = null;
    }, 5000);
  }
};

// Función para limpiar el formulario
const clearForm = () => {
  reservationData.nombre = '';
  reservationData.telefono = '';
  reservationData.email = '';
  reservationData.fecha = new Date().toISOString().split('T')[0];
  reservationData.hora = '20:00';
  reservationData.personas = 2;
  reservationData.notas = '';
};

// Exponer funciones para uso externo
defineExpose({
  toggleSimulator,
  sendReservation
});
</script>

<style scoped>
.whatsapp-simulator {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.toggle-button {
  background-color: #25D366;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 10px 15px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 5px;
}

.toggle-button:hover {
  background-color: #128C7E;
}

.simulator-panel {
  position: absolute;
  bottom: 50px;
  right: 0;
  width: 300px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  padding: 15px;
  max-height: 80vh;
  overflow-y: auto;
}

h3 {
  color: #128C7E;
  margin-top: 0;
  text-align: center;
  font-size: 16px;
}

.form-group {
  margin-bottom: 10px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: #333;
}

input, select, textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

textarea {
  height: 60px;
  resize: vertical;
}

.buttons {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.send-button {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  background-color: #25D366;
  color: white;
}

.send-button:hover {
  background-color: #128C7E;
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.status.success {
  background-color: #d4edda;
  color: #155724;
}

.status.error {
  background-color: #f8d7da;
  color: #721c24;
}

.status.info {
  background-color: #d1ecf1;
  color: #0c5460;
}
</style>
