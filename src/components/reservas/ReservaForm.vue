<template>
  <div class="reservas-section">
    <button @click="toggleReservaForm" class="toggle-reserva-button">
      {{ showReservaForm ? 'Ocultar Formulario de Reserva' : 'Hacer una Reserva' }}
    </button>
    
    <div v-if="showReservaForm" class="reserva-form-container">
      <h3>Reserva tu Mesa</h3>
      <form @submit.prevent="processReservation" class="reserva-form">
        <div class="form-group">
          <label for="fullName">Nombre Completo *</label>
          <input 
            type="text" 
            id="fullName" 
            v-model="reservationData.fullName" 
            placeholder="Ingresa tu nombre completo"
            required
          >
        </div>
        
        <div class="form-group">
          <label for="mobilePhone">Teléfono Móvil *</label>
          <input 
            type="tel" 
            id="mobilePhone" 
            v-model="reservationData.mobilePhone" 
            placeholder="Ej. 612345678"
            required
          >
        </div>
        
        <div class="form-group">
          <label for="landlinePhone">Teléfono Fijo</label>
          <input 
            type="tel" 
            id="landlinePhone" 
            v-model="reservationData.landlinePhone" 
            placeholder="Opcional"
          >
        </div>
        
        <div class="form-group">
          <label for="address">Dirección</label>
          <input 
            type="text" 
            id="address" 
            v-model="reservationData.address" 
            placeholder="Tu dirección (opcional)"
          >
        </div>
        
        <div class="form-group">
          <label for="email">Correo Electrónico</label>
          <input 
            type="email" 
            id="email" 
            v-model="reservationData.email" 
            placeholder="ejemplo@correo.com (opcional)"
          >
        </div>
        
        <div class="form-group">
          <label for="reservationDate">Fecha de Reserva *</label>
          <input 
            type="date" 
            id="reservationDate" 
            v-model="reservationData.date" 
            required
          >
        </div>
        
        <div class="form-group">
          <label for="reservationTime">Hora de Reserva *</label>
          <input 
            type="time" 
            id="reservationTime" 
            v-model="reservationData.time" 
            required
          >
        </div>
        
        <div class="form-group">
          <label for="peopleCount">Número de Personas *</label>
          <input 
            type="number" 
            id="peopleCount" 
            v-model="reservationData.peopleCount" 
            min="1" 
            max="20" 
            required
          >
        </div>
        
        <div class="form-group">
          <label for="specialNotes">Notas Adicionales</label>
          <textarea 
            id="specialNotes" 
            v-model="reservationData.notes" 
            placeholder="Instrucciones especiales, preferencias, etc."
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-actions">
          <button 
            type="submit" 
            class="submit-button" 
            :disabled="isProcessing"
          >
            {{ isProcessing ? 'Procesando...' : 'Reservar Mesa' }}
          </button>
          <button 
            type="button" 
            class="clear-button" 
            @click="clearForm"
            :disabled="isProcessing"
          >
            Limpiar
          </button>
        </div>
      </form>
    </div>
    
    <!-- Toast de notificación -->
    <div v-if="toast.show" class="toast-notification" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script>
import { ref, reactive, watch } from 'vue';
import eventBus from '@/utils/eventBus';
import { saveReservation, saveWhatsAppReservation } from '../../services/reservaService';

export default {
  name: 'ReservaForm',
  setup() {
    console.log('ReservaForm montado');
    // Estado para mostrar/ocultar el formulario
    const showReservaForm = ref(false);
    
    // Estado para los datos de la reserva
    const reservationData = reactive({
      fullName: '',
      mobilePhone: '',
      landlinePhone: '',
      address: '',
      email: '',
      date: '',
      time: '',
      peopleCount: 1,
      notes: ''
    });
    
    // Estado para el procesamiento de la reserva
    const isProcessing = ref(false);
    
    // Estado para las notificaciones toast
    const toast = reactive({
      show: false,
      message: '',
      type: 'info'
    });
    
    // Función para alternar la visibilidad del formulario
    const toggleReservaForm = () => {
      showReservaForm.value = !showReservaForm.value;
    };
    
    // Función para mostrar mensajes toast
    const showToast = (message, type = 'info') => {
      toast.message = message;
      toast.type = type;
      toast.show = true;
      
      // Ocultar el toast después de 5 segundos
      setTimeout(() => {
        toast.show = false;
      }, 5000);
    };
    
    // Función para validar el formulario
    const validateForm = () => {
      if (!reservationData.fullName.trim()) {
        showToast('Por favor, ingresa tu nombre completo', 'error');
        return false;
      }
      
      if (!reservationData.mobilePhone.trim()) {
        showToast('Por favor, ingresa un número de teléfono móvil', 'error');
        return false;
      }
      
      if (!reservationData.date) {
        showToast('Por favor, selecciona una fecha para la reserva', 'error');
        return false;
      }
      
      if (!reservationData.time) {
        showToast('Por favor, selecciona una hora para la reserva', 'error');
        return false;
      }
      
      if (!reservationData.peopleCount || reservationData.peopleCount < 1) {
        showToast('Por favor, indica el número de personas', 'error');
        return false;
      }
      
      return true;
    };
    
    // Función para procesar la reserva
    const processReservation = async () => {
      if (!validateForm()) return;
      
      try {
        isProcessing.value = true;
        
        // Construir el objeto de reserva para el sistema
        const reservationObject = {
          fullName: reservationData.fullName,
          mobilePhone: reservationData.mobilePhone,
          landlinePhone: reservationData.landlinePhone || '',
          email: reservationData.email || '',
          address: reservationData.address || '',
          date: reservationData.date,
          time: reservationData.time,
          peopleCount: reservationData.peopleCount,
          notes: reservationData.notes || '',
          status: 'pending',
          source: 'menu'
        };
        
        console.log('Enviando reserva al sistema:', reservationObject);
        
        // Preparar datos para WhatsApp (formato que espera el handler)
        const whatsappData = {
          nombre: reservationData.fullName,
          telefono: reservationData.mobilePhone,
          email: reservationData.email || '',
          fecha: reservationData.date,
          hora: reservationData.time,
          personas: reservationData.peopleCount,
          notas: `Reserva desde menú compartido: ${reservationData.notes || 'Sin notas adicionales'}`
        };
        
        console.log('Enviando reserva como mensaje de WhatsApp:', whatsappData);
        
        // Enviar la reserva al sistema como si viniera de WhatsApp
        // Esto garantiza que aparezca en la sección de Gestión de Reservas
        const whatsappResult = await saveWhatsAppReservation(whatsappData);
        
        console.log('Resultado de envío como WhatsApp:', whatsappResult);
        
        if (!whatsappResult.success) {
          throw new Error(whatsappResult.error || 'Error al guardar la reserva');
        }
        
        // Construir mensaje para WhatsApp (opcional, para que el cliente pueda confirmar)
const message = `
📅 *NUEVA RESERVA DE MESA*
---------------------------
👤 *Nombre:* ${reservationData.fullName}
📱 *Teléfono móvil:* ${reservationData.mobilePhone}
${reservationData.landlinePhone ? `☎️ *Teléfono fijo:* ${reservationData.landlinePhone}` : ''}
${reservationData.email ? `✉️ *Email:* ${reservationData.email}` : ''}
📆 *Fecha:* ${reservationData.date}
⏰ *Hora:* ${reservationData.time}
👥 *Personas:* ${reservationData.peopleCount}
${reservationData.notes ? `📝 *Notas:* ${reservationData.notes}` : ''}
---------------------------
🌐 Esta reserva fue realizada a través del sistema de reservas online.
`;

        
        // Abrir WhatsApp con el mensaje (opcional)
          const encodedMessage = encodeURIComponent(message);
          const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
          window.open(whatsappUrl, '_blank');

        
        // Mostrar mensaje de éxito
        showToast('¡Reserva enviada correctamente! También puedes confirmarla por WhatsApp.', 'success');
        
        // Limpiar el formulario
        clearForm();
        
      } catch (error) {
        console.error('Error al procesar la reserva:', error);
        showToast('Hubo un error al procesar tu reserva. Por favor, intenta nuevamente.', 'error');
      } finally {
        isProcessing.value = false;
      }
    };
    
    // Función para limpiar el formulario
    const clearForm = () => {
      reservationData.fullName = '';
      reservationData.mobilePhone = '';
      reservationData.landlinePhone = '';
      reservationData.address = '';
      reservationData.email = '';
      reservationData.date = '';
      reservationData.time = '';
      reservationData.peopleCount = 1;
      reservationData.notes = '';
    };
    
    return {
      showReservaForm,
      reservationData,
      isProcessing,
      toast,
      toggleReservaForm,
      processReservation,
      clearForm
    };
  }
};
</script>

<style scoped>
.reservas-section {
  margin: 40px 0;
  position: relative;
  border: 5px solid red;  /* Borde rojo brillante para depuración */
  padding: 20px;
  background-color: rgb(165, 229, 245);  /* Fondo amarillo para depuración */
}

.toggle-reserva-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  display: block;
  margin: 0 auto 20px;
}

.toggle-reserva-button:hover {
  background-color: #388E3C;
}

.reserva-form-container {
  background-color: #f8f8f8;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.reserva-form-container h3 {
  color: #333;
  margin-top: 0;
  margin-bottom: 20px;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 10px;
}

.reserva-form {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #4CAF50;
  outline: none;
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.submit-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-button:hover {
  background-color: #388E3C;
}

.clear-button {
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.clear-button:hover {
  background-color: #d32f2f;
}

.toast-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 4px;
  color: white;
  font-weight: bold;
  z-index: 1000;
  animation: slideIn 0.3s ease, fadeOut 0.5s 4.5s ease forwards;
  max-width: 300px;
}

.toast-notification.info {
  background-color: #2196F3;
}

.toast-notification.success {
  background-color: #4CAF50;
}

.toast-notification.error {
  background-color: #f44336;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* Responsive */
@media (max-width: 768px) {
  .reserva-form {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .submit-button, .clear-button {
    width: 100%;
  }
}
</style>