<template>
  <div class="admin-reservas">
    <div class="reservas-header">
      <h2 class="admin-section-title">Gestión de Reservas</h2>
      <div class="action-buttons">
        <button 
          class="refresh-btn" 
          @click="refreshReservations" 
          :disabled="isLoading"
          title="Actualizar reservas"
        >
          <span v-if="isLoading">Actualizando...</span>
          <span v-else>🔄 Actualizar</span>
        </button>
        
        <button 
          class="delete-old-btn" 
          @click="showDeleteModal = true" 
          :disabled="isLoading || !hasOldReservations"
          title="Eliminar reservas antiguas (más de 30 días)"
        >
          <span>🗑️ Eliminar Antiguas</span>
        </button>
      </div>
    </div>
    
    <div class="reservas-container">
      <div v-if="isLoading" class="loading-spinner">
        <div class="spinner"></div>
        <p>Cargando reservas...</p>
      </div>
      
      <div v-else-if="reservations.length === 0" class="no-reservations">
        <p>Aún no hay reservas registradas</p>
      </div>
      
      <div v-else class="reservations-list">
        <div class="table-responsive">
          <table class="reservation-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Personas</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(reservation, index) in reservations" :key="index" :class="{ 'confirmed': reservation.status === 'confirmed', 'pending': reservation.status === 'pending', 'cancelled': reservation.status === 'cancelled' }">
                <td>{{ formatDate(reservation.date) }}</td>
                <td>{{ reservation.time }}</td>
                <td>{{ reservation.fullName }}</td>
                <td>
                  <a :href="`tel:${reservation.mobilePhone}`">{{ reservation.mobilePhone }}</a>
                </td>
                <td>{{ reservation.peopleCount }}</td>
                <td>
                  <span class="status-badge" :class="reservation.status">
                    {{ getStatusLabel(reservation.status) }}
                  </span>
                </td>
                <td class="actions-cell">
                  <button @click="viewReservation(reservation)" class="action-btn view-btn" title="Ver detalles">
                    👁️
                  </button>
                  <button 
                    v-if="!readOnly" 
                    @click="confirmReservation(reservation)" 
                    class="action-btn confirm-btn" 
                    title="Confirmar reserva" 
                    :disabled="reservation.status === 'confirmed'"
                  >
                    ✅
                  </button>
                  <button 
                    v-if="!readOnly" 
                    @click="cancelReservation(reservation)" 
                    class="action-btn cancel-btn" 
                    title="Cancelar reserva" 
                    :disabled="reservation.status === 'cancelled'"
                  >
                    ❌
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Modal para ver detalles de la reserva -->
    <div v-if="selectedReservation" class="reservation-modal">
      <div class="modal-content">
        <span class="close-modal" @click="selectedReservation = null">&times;</span>
        <h3>Detalles de la Reserva</h3>
        
        <div class="reservation-details">
          <p><strong>Cliente:</strong> {{ selectedReservation.fullName }}</p>
          <p><strong>Teléfono Móvil:</strong> {{ selectedReservation.mobilePhone }}</p>
          <p v-if="selectedReservation.landlinePhone"><strong>Teléfono Fijo:</strong> {{ selectedReservation.landlinePhone }}</p>
          <p v-if="selectedReservation.email"><strong>Email:</strong> {{ selectedReservation.email }}</p>
          <p v-if="selectedReservation.address"><strong>Dirección:</strong> {{ selectedReservation.address }}</p>
          <p><strong>Fecha:</strong> {{ formatDate(selectedReservation.date) }}</p>
          <p><strong>Hora:</strong> {{ selectedReservation.time }}</p>
          <p><strong>Número de Personas:</strong> {{ selectedReservation.peopleCount }}</p>
          <p v-if="selectedReservation.notes"><strong>Notas Adicionales:</strong> {{ selectedReservation.notes }}</p>
          <p><strong>Estado:</strong> <span class="status-badge" :class="selectedReservation.status">{{ getStatusLabel(selectedReservation.status) }}</span></p>
        </div>
        
        <div class="modal-actions">
          <button @click="confirmReservation(selectedReservation)" class="action-btn confirm-btn" :disabled="selectedReservation.status === 'confirmed'">
            Confirmar Reserva
          </button>
          <button @click="cancelReservation(selectedReservation)" class="action-btn cancel-btn" :disabled="selectedReservation.status === 'cancelled'">
            Cancelar Reserva
          </button>
          <button @click="contactCustomer(selectedReservation)" class="action-btn contact-btn">
            Contactar Cliente
          </button>
        </div>
      </div>
    </div>
    
    <!-- Modal de confirmación para eliminar reservas antiguas -->
    <div v-if="showDeleteModal" class="delete-modal-overlay">
      <div class="delete-modal">
        <div class="delete-modal-header">
          <h3>Confirmar eliminación</h3>
          <button class="close-modal" @click="showDeleteModal = false">&times;</button>
        </div>
        <div class="delete-modal-body">
          <div class="delete-icon">
            <span>🗑️</span>
          </div>
          <p>¿Estás seguro de eliminar las reservas antiguas?</p>
          <p class="delete-modal-info">Esta acción eliminará todas las reservas con más de 30 días de antigüedad y no se puede deshacer.</p>
        </div>
        <div class="delete-modal-footer">
          <button class="cancel-btn" @click="showDeleteModal = false">Cancelar</button>
          <button class="confirm-btn" @click="confirmDeleteOldReservations" :disabled="isLoading">
            <span v-if="isLoading">Eliminando...</span>
            <span v-else>Eliminar</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Añadir notificación toast -->
    <div v-if="toast.visible" class="toast-notification" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, onUnmounted, computed } from 'vue';
import { 
  getReservations, 
  updateReservationStatus, 
  deleteReservation, 
  isReservationOlderThan 
} from '../../services/reservaService';
import eventBus from '../../utils/eventBus';
import apiService from '../../services/apiService';

// Props
const props = defineProps({
  readOnly: {
    type: Boolean,
    default: false
  }
});

const reservations = ref([]);
const isLoading = ref(true);
const selectedReservation = ref(null);
const showDeleteModal = ref(false);

// Variables para el sistema de reintentos de notificaciones
const notificationRetries = ref(0);
const maxRetries = 5;
const notificationConnectStatus = ref('idle'); // 'idle', 'connecting', 'connected', 'error'
const retryTimeout = ref(null);

const toast = reactive({
  visible: false,
  message: '',
  type: 'info'
});

const showToast = (message, type = 'info') => {
  toast.message = message;
  toast.type = type;
  toast.visible = true;
  
  setTimeout(() => {
    toast.visible = false;
  }, 5000);
};

// Función para actualizar la lista de reservas (llamada cuando hay una nueva)
// IMPORTANTE: Definir refreshReservations antes de usarla en otras funciones
const refreshReservations = async () => {
  console.log('🔄 Actualizando lista de reservas...');
  
  try {
    // Guardamos el estado de carga
    const wasLoading = isLoading.value;
    isLoading.value = true;
    
    // Cargamos nuevamente las reservas desde el servicio
    const result = await getReservations();
    
    if (result.success) {
      reservations.value = result.reservations;
      console.log('✅ Lista de reservas actualizada correctamente:', reservations.value.length);
    } else {
      throw new Error(result.error || 'Error al actualizar las reservas');
    }
  } catch (error) {
    console.error('❌ Error al actualizar reservas:', error);
    showToast('Error al actualizar las reservas', 'error');
  } finally {
    isLoading.value = false;
  }
};

// Función para reproducir sonido de notificación
const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(e => console.log('No se pudo reproducir sonido:', e));
  } catch (error) {
    console.error('Error al reproducir sonido:', error);
  }
};

// Función para cargar las reservas
const loadReservations = async () => {
  isLoading.value = true;
  try {
    console.log('🔄 Cargando reservas...');
    // Utilizamos el servicio de reservas para obtener los datos
    const result = await getReservations();
    
    if (result.success) {
      reservations.value = result.reservations;
      console.log('✅ Reservas cargadas correctamente:', reservations.value.length);
      
      // Verificar notificaciones no leídas después de cargar reservas
      checkNotifications();
    } else {
      throw new Error(result.error || 'Error al cargar las reservas');
    }
  } catch (error) {
    console.error('❌ Error al cargar reservas:', error);
    showToast('Error al cargar las reservas', 'error');
  } finally {
    isLoading.value = false;
  }
};

// Función para verificar notificaciones de reservas de WhatsApp con sistema de reintentos
const checkNotifications = async (forceCheck = false) => {
  // Si ya estamos en un estado de error y hemos alcanzado el máximo de reintentos, no intentar nuevamente
  // a menos que se fuerce una verificación
  if (notificationConnectStatus.value === 'error' && 
      notificationRetries.value >= maxRetries && 
      !forceCheck) {
    return;
  }
  
  // Actualizar estado a 'connecting'
  notificationConnectStatus.value = 'connecting';
  
  try {
    // Intentar obtener notificaciones del servidor
    const response = await apiService.get('/whatsapp/notificaciones')
      .catch(err => {
        // Si hay un error de conexión, incrementar conteo de reintentos
        notificationRetries.value++;
        
        // Calcular tiempo de espera exponencial (2^intentos * 1000 ms, max 30 segundos)
        const retryMs = Math.min(Math.pow(2, notificationRetries.value) * 1000, 30000);
        
        console.log(`No se pudieron verificar notificaciones (intento ${notificationRetries.value}/${maxRetries}), reintentando en ${retryMs/1000}s`);
        
        // Si no hemos alcanzado el máximo de reintentos, programar un nuevo intento
        if (notificationRetries.value < maxRetries) {
          // Limpiar timeout anterior si existe
          if (retryTimeout.value) clearTimeout(retryTimeout.value);
          
          // Programar nuevo intento
          retryTimeout.value = setTimeout(() => {
            checkNotifications(true);
          }, retryMs);
        } else {
          // Establecer estado de error después de agotar los reintentos
          notificationConnectStatus.value = 'error';
          console.log('Máximo de reintentos alcanzado, desistiendo de verificar notificaciones');
        }
        
        return null;
      });
    
    // Solo procesar la respuesta si se obtuvo correctamente
    if (response && response.success) {
      // Resetear conteo de reintentos si la conexión fue exitosa
      notificationRetries.value = 0;
      notificationConnectStatus.value = 'connected';
      
      // Si hay nuevas notificaciones, mostrar toast y actualizar lista
      if (response.hayNotificaciones) {
        showToast(`${response.cantidad} nueva(s) reserva(s) de WhatsApp`, 'success');
        // Reproducir sonido de notificación si está disponible
        playNotificationSound();
        // Refrescar lista de reservas
        refreshReservations();
      }
    }
  } catch (error) {
    // Capturar cualquier otro error pero no mostrar errores en consola en producción
    if (process.env.NODE_ENV === 'development') {
      console.error('Error al verificar notificaciones:', error);
    }
    // No propagar el error para evitar que la aplicación se interrumpa
  }
};

// Función para manejar nuevas reservas recibidas a través del eventBus
const handleNuevaReserva = (reservation) => {
  console.log('🔔 Nueva reserva recibida:', reservation);
  
  // Verificamos si la reserva ya existe en la lista (para evitar duplicados)
  const existingIndex = reservations.value.findIndex(r => r.id === reservation.id);
  
  if (existingIndex >= 0) {
    // Si la reserva ya existe, actualizamos sus datos
    reservations.value[existingIndex] = { ...reservation };
    console.log('🔄 Reserva actualizada:', reservation.id);
  } else {
    // Si es una nueva reserva, la añadimos al principio de la lista
    reservations.value.unshift(reservation);
    console.log('➕ Nueva reserva añadida:', reservation.id);
    
    // Mostrar notificación de nueva reserva
    showToast(`Nueva reserva recibida de ${reservation.fullName}`, 'success');
    
    // Reproducir sonido de notificación
    playNotificationSound();
  }
};

// Función para manejar actualizaciones de reservas
const handleReservaActualizada = (data) => {
  console.log('🔄 Actualización de reserva recibida:', data);
  
  // Buscamos la reserva en la lista y actualizamos su estado
  const index = reservations.value.findIndex(res => res.id === data.id);
  if (index !== -1) {
    reservations.value[index].status = data.status;
    console.log('✅ Estado de reserva actualizado a:', data.status);
  }
};

// Verificar notificaciones periódicamente (cada 30 segundos)
let notificationInterval = null;

onMounted(() => {
  // Cargar las reservas iniciales
  loadReservations();
  
  // Escuchar eventos de nuevas reservas
  eventBus.on('nueva-reserva', handleNuevaReserva);
  
  // Escuchar eventos de actualización de reservas
  eventBus.on('reserva-actualizada', handleReservaActualizada);
  
  // Escuchar eventos para refrescar reservas
  eventBus.on('refresh-reservations', refreshReservations);
  
  // Iniciar verificación periódica de notificaciones
  notificationInterval = setInterval(checkNotifications, 30000); // cada 30 segundos
  
  console.log('✅ AdminReservas montado y escuchando eventos');
});

// Limpiar los listeners y el intervalo al desmontar el componente
onUnmounted(() => {
  eventBus.off('nueva-reserva', handleNuevaReserva);
  eventBus.off('reserva-actualizada', handleReservaActualizada);
  eventBus.off('refresh-reservations', refreshReservations);
  
  // Limpiar intervalo de verificación de notificaciones
  if (notificationInterval) {
    clearInterval(notificationInterval);
  }
  
  // Limpiar timeout de reintento de notificaciones
  if (retryTimeout.value) {
    clearTimeout(retryTimeout.value);
  }
  
  console.log('🛑 AdminReservas desmontado');
});

// Exponer funciones para uso externo
defineExpose({ refreshReservations });

// Función para formatear fecha (maneja múltiples formatos y los convierte a DD/MM/YYYY)
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    // Verificar si es el formato problemático con T y Z
    if (dateString.includes('T') && dateString.includes('/')) {
      // Formato como "29T05:00:00.000Z/05/2025"
      const parts = dateString.split('/');
      if (parts.length === 3) {
        // Extraer el día del primer segmento (antes de la T)
        const day = parts[0].split('T')[0];
        // Construir la fecha en formato DD/MM/YYYY
        return `${day}/${parts[1]}/${parts[2]}`;
      }
    }
    
    // Formato ISO (YYYY-MM-DD)
    if (dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    
    // Si ya está en formato DD/MM/YYYY, devolverlo tal cual
    if (dateString.includes('/') && !dateString.includes('T')) {
      return dateString;
    }
    
    // Intentar parsear como fecha y formatear
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    // Si no se pudo formatear, devolver el string original
    return dateString;
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return dateString;
  }
};

// Obtener etiqueta del estado
const getStatusLabel = (status) => {
  switch (status) {
    case 'confirmed':
      return 'Confirmada';
    case 'pending':
      return 'Pendiente';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status;
  }
};

// Ver detalles de la reserva
const viewReservation = (reservation) => {
  selectedReservation.value = reservation;
};

// Confirmar reserva
const confirmReservation = async (reservation) => {
  try {
    // Utilizamos el servicio para actualizar el estado
    const result = await updateReservationStatus(reservation.id, 'confirmed');
    
    if (result.success) {
      // Actualizamos el estado localmente
      reservation.status = 'confirmed';
      showToast('Reserva confirmada correctamente', 'success');
    } else {
      throw new Error(result.error || 'Error al confirmar la reserva');
    }
  } catch (error) {
    console.error('Error al confirmar reserva:', error);
    showToast('Error al confirmar la reserva', 'error');
  }
};

// Cancelar reserva
const cancelReservation = async (reservation) => {
  try {
    // Utilizamos el servicio para actualizar el estado
    const result = await updateReservationStatus(reservation.id, 'cancelled');
    
    if (result.success) {
      // Actualizamos el estado localmente
      reservation.status = 'cancelled';
      showToast('Reserva cancelada correctamente', 'success');
    } else {
      throw new Error(result.error || 'Error al cancelar la reserva');
    }
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    showToast('Error al cancelar la reserva', 'error');
  }
};

// Contactar al cliente
const contactCustomer = (reservation) => {
  if (reservation.mobilePhone) {
    window.location.href = `tel:${reservation.mobilePhone}`;
  } else {
    showToast('No hay número de teléfono disponible', 'warning');
  }
};

// Confirmar eliminación de reservas antiguas
const confirmDeleteOldReservations = async () => {
  isLoading.value = true;
  try {
    const oldReservations = reservations.value.filter(reservation => isReservationOlderThan(reservation, 30));
    
    if (oldReservations.length === 0) {
      showToast('No hay reservas antiguas para eliminar', 'info');
      isLoading.value = false;
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    // Eliminar cada reserva antigua una por una
    for (const reservation of oldReservations) {
      try {
        const result = await deleteReservation(reservation.id);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          console.error('Error al eliminar reserva:', reservation.id, result.error);
        }
      } catch (error) {
        errorCount++;
        console.error('Error al eliminar reserva:', reservation.id, error);
      }
    }
    
    // Actualizar la lista de reservas
    await refreshReservations();
    
    if (successCount > 0) {
      showToast(`${successCount} reservas antiguas eliminadas correctamente`, 'success');
    }
    
    if (errorCount > 0) {
      showToast(`No se pudieron eliminar ${errorCount} reservas`, 'warning');
    }
  } catch (error) {
    console.error('Error al eliminar reservas antiguas:', error);
    showToast('Error al eliminar las reservas antiguas', 'error');
  } finally {
    isLoading.value = false;
    showDeleteModal.value = false;
  }
};

// Verificar si hay reservas antiguas
const hasOldReservations = computed(() => {
  return reservations.value.some(reservation => isReservationOlderThan(reservation, 30));
});
</script>

<style scoped>
.admin-reservas {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.admin-section-title {
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #4CAF50;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-reservations {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}

.table-responsive {
  overflow-x: auto;
}

.reservation-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.reservation-table th, 
.reservation-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.reservation-table th {
  background-color: #f5f5f5;
  font-weight: bold;
  color: #333;
}

.reservation-table tr:hover {
  background-color: #f9f9f9;
}

.reservation-table tr.confirmed {
  background-color: rgba(76, 175, 80, 0.1);
}

.reservation-table tr.pending {
  background-color: rgba(255, 193, 7, 0.1);
}

.reservation-table tr.cancelled {
  background-color: rgba(244, 67, 54, 0.1);
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.status-badge.confirmed {
  background-color: #4CAF50;
  color: white;
}

.status-badge.pending {
  background-color: #FFC107;
  color: #333;
}

.status-badge.cancelled {
  background-color: #F44336;
  color: white;
}

.actions-cell {
  white-space: nowrap;
}

.action-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  margin: 0 3px;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.action-btn:hover {
  background-color: #f0f0f0;
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.view-btn:hover {
  background-color: #e3f2fd;
}

.confirm-btn:hover {
  background-color: #e8f5e9;
}

.cancel-btn:hover {
  background-color: #ffebee;
}

/* Estilos para el modal */
.reservation-modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.close-modal {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.close-modal:hover {
  color: #000;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  color: #333;
}

.reservation-details p {
  margin: 8px 0;
  line-height: 1.5;
}

.modal-actions {
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.modal-actions .action-btn {
  flex: 1;
  padding: 10px;
  font-size: 0.9rem;
  border-radius: 4px;
  text-align: center;
  min-width: 120px;
}

.modal-actions .confirm-btn {
  background-color: #4CAF50;
  color: white;
}

.modal-actions .cancel-btn {
  background-color: #F44336;
  color: white;
}

.modal-actions .contact-btn {
  background-color: #2196F3;
  color: white;
}

.modal-actions .action-btn:hover {
  opacity: 0.9;
}

.modal-actions .action-btn:disabled {
  background-color: #ccc;
  color: #666;
}

@media (max-width: 768px) {
  .reservation-table th, 
  .reservation-table td {
    padding: 8px 10px;
    font-size: 0.9rem;
  }
  
  .actions-cell {
    display: flex;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .modal-content {
    width: 95%;
    padding: 15px;
  }
}

.reservas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.refresh-btn {
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.refresh-btn:hover {
  background-color: #e0e0e0;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-old-btn {
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  transition: all 0.3s;
  margin-left: 10px;
}

.delete-old-btn:hover {
  background-color: #e0e0e0;
}

.delete-old-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-modal-overlay {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-modal {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.delete-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.delete-modal-header h3 {
  margin-top: 0;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  color: #333;
}

.close-modal {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.close-modal:hover {
  color: #000;
}

.delete-modal-body {
  text-align: center;
  margin-bottom: 20px;
}

.delete-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.delete-modal-info {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 20px;
}

.delete-modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.delete-modal-footer .cancel-btn {
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.delete-modal-footer .cancel-btn:hover {
  background-color: #e0e0e0;
}

.delete-modal-footer .confirm-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.delete-modal-footer .confirm-btn:hover {
  opacity: 0.9;
}

.delete-modal-footer .confirm-btn:disabled {
  background-color: #ccc;
  color: #666;
}
</style>