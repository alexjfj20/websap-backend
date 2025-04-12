<template>
  <div class="admin-config">
    <h2>Configuración de la Aplicación</h2>
    
    <div class="config-section">
      <h3>Configuración General</h3>
      <div class="config-item">
        <div class="config-header">
          <h4>Botón "Simular WhatsApp"</h4>
          <div class="toggle-switch">
            <input 
              type="checkbox" 
              id="whatsapp-button-toggle" 
              v-model="whatsappButtonEnabled" 
              @change="toggleWhatsAppButton"
            />
            <label for="whatsapp-button-toggle"></label>
          </div>
        </div>
        <p class="config-description">
          Activa o desactiva el botón "Simular WhatsApp" en todas las páginas de la aplicación. 
          Esta función permite a los usuarios simular reservas como si vinieran de WhatsApp.
        </p>
        <div class="status-message" :class="{ 'success': statusSuccess }">
          {{ statusMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import eventBus from '@/utils/eventBus';

export default {
  name: 'AdminConfig',
  setup() {
    const whatsappButtonEnabled = ref(true);
    const statusMessage = ref('');
    const statusSuccess = ref(true);
    
    // Cargar el estado actual al montar el componente
    onMounted(() => {
      const storedValue = localStorage.getItem('whatsappButtonEnabled');
      // Si tiene un valor específico en localStorage, usar ese valor
      if (storedValue !== null) {
        whatsappButtonEnabled.value = storedValue === 'true';
      }
    });
    
    // Función para activar/desactivar el botón de WhatsApp
    const toggleWhatsAppButton = () => {
      try {
        // Guardar en localStorage
        localStorage.setItem('whatsappButtonEnabled', whatsappButtonEnabled.value);
        
        // Emitir evento para notificar al componente WhatsAppSimulator
        eventBus.emit('whatsapp-button-config-changed', whatsappButtonEnabled.value);
        
        // Mostrar mensaje de confirmación
        statusMessage.value = whatsappButtonEnabled.value 
          ? 'Botón "Simular WhatsApp" activado correctamente' 
          : 'Botón "Simular WhatsApp" desactivado correctamente';
        statusSuccess.value = true;
        
        // Limpiar el mensaje después de 5 segundos
        setTimeout(() => {
          statusMessage.value = '';
        }, 5000);
      } catch (error) {
        console.error('Error al cambiar la configuración del botón WhatsApp:', error);
        statusMessage.value = 'Error al cambiar la configuración';
        statusSuccess.value = false;
      }
    };
    
    return {
      whatsappButtonEnabled,
      toggleWhatsAppButton,
      statusMessage,
      statusSuccess
    };
  }
};
</script>

<style scoped>
.admin-config {
  max-width: 800px;
  margin: 0 auto;
}

.admin-config h2 {
  margin-bottom: 30px;
  color: #333;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 10px;
}

.config-section {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.config-section h3 {
  color: #333;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10px;
}

.config-item {
  background-color: white;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.config-header h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.config-description {
  color: #666;
  font-size: 14px;
  margin: 10px 0;
}

/* Toggle Switch Styles */
.toggle-switch {
  position: relative;
  width: 60px;
  height: 34px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch label {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.toggle-switch label:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

.toggle-switch input:checked + label {
  background-color: #4CAF50;
}

.toggle-switch input:checked + label:before {
  transform: translateX(26px);
}

.status-message {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.status-message:not(:empty) {
  opacity: 1;
}

.status-message.success {
  background-color: #d4edda;
  color: #155724;
}

.status-message:not(.success) {
  background-color: #f8d7da;
  color: #721c24;
}
</style>