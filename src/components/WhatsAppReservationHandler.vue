<template>
  <!-- Este componente no tiene representación visual, solo maneja la lógica -->
  <div style="display: none;">
    <p>Manejador de reservas de WhatsApp activo</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { saveWhatsAppReservation } from '../services/reservaService';
import eventBus from '../utils/eventBus';

const isProcessing = ref(false);
const lastProcessedMessage = ref('');

// Función para procesar mensajes de WhatsApp
const processWhatsAppMessage = async (message) => {
  try {
    // Evitar procesar el mismo mensaje más de una vez
    if (message === lastProcessedMessage.value) {
      console.log('Mensaje ya procesado, ignorando duplicado:', message);
      return;
    }
    
    console.log('Procesando mensaje de WhatsApp:', message);
    isProcessing.value = true;
    lastProcessedMessage.value = message;
    
    // Extraer información del mensaje
    const data = extractReservationData(message);
    
    if (!data) {
      console.warn('No se pudo extraer información de reserva del mensaje:', message);
      return;
    }
    
    console.log('Datos extraídos del mensaje:', data);
    
    // Guardar la reserva
    const result = await saveWhatsAppReservation(data);
    
    if (result.success) {
      console.log('Reserva de WhatsApp guardada correctamente:', result.reservation);
      
      // Emitir evento para actualizar la lista de reservas
      eventBus.emit('nueva-reserva', result.reservation);
      eventBus.emit('refresh-reservations');
      
      console.log('Eventos emitidos: nueva-reserva y refresh-reservations');
    } else {
      console.error('Error al guardar reserva de WhatsApp:', result.error);
    }
  } catch (error) {
    console.error('Error al procesar mensaje de WhatsApp:', error);
  } finally {
    isProcessing.value = false;
  }
};

// Función para extraer datos de reserva del mensaje
const extractReservationData = (message) => {
  // Implementación básica para extraer datos
  // En un caso real, se usaría una expresión regular más robusta
  try {
    // Buscar patrones comunes en el mensaje
    const nombreMatch = message.match(/\*Nombre:\*\s*([^\n]+)/i);
    const telefonoMatch = message.match(/\*Teléfono móvil:\*\s*([^\n]+)/i);
    const fechaMatch = message.match(/\*Fecha:\*\s*([^\n]+)/i);
    const horaMatch = message.match(/\*Hora:\*\s*([^\n]+)/i);
    const personasMatch = message.match(/\*Personas:\*\s*([^\n]+)/i);
    const notasMatch = message.match(/\*Notas:\*\s*([^\n]+)/i);
    const emailMatch = message.match(/\*Email:\*\s*([^\n]+)/i);
    
    // Si no encontramos al menos nombre y teléfono, no es una reserva válida
    if (!nombreMatch && !telefonoMatch) {
      console.warn('El mensaje no contiene información suficiente para una reserva');
      return null;
    }
    
    // Construir objeto de datos
    return {
      nombre: nombreMatch ? nombreMatch[1].trim() : 'Cliente sin nombre',
      telefono: telefonoMatch ? telefonoMatch[1].trim() : '',
      email: emailMatch ? emailMatch[1].trim() : '',
      fecha: fechaMatch ? fechaMatch[1].trim() : new Date().toISOString().split('T')[0],
      hora: horaMatch ? horaMatch[1].trim() : '19:00',
      personas: personasMatch ? parseInt(personasMatch[1].trim(), 10) || 2 : 2,
      notas: notasMatch ? notasMatch[1].trim() : 'Reserva desde WhatsApp'
    };
  } catch (error) {
    console.error('Error al extraer datos del mensaje:', error);
    return null;
  }
};

// Función para simular la recepción de un mensaje de WhatsApp
const simulateWhatsAppMessage = (message) => {
  console.log('Mensaje de WhatsApp simulado recibido');
  processWhatsAppMessage(message);
};

// Escuchar eventos de mensajes de WhatsApp
onMounted(() => {
  console.log('WhatsAppReservationHandler montado');
  eventBus.on('whatsapp-message', simulateWhatsAppMessage);
  
  // Para pruebas, podemos simular un mensaje después de 5 segundos
  /*
  setTimeout(() => {
    simulateWhatsAppMessage(`
      *NUEVA RESERVA DE MESA*
      ---------------------------
      *Nombre:* Juan Pérez
      *Teléfono móvil:* 123456789
      *Email:* juan@example.com
      *Fecha:* 2023-05-15
      *Hora:* 20:30
      *Personas:* 4
      *Notas:* Mesa cerca de la ventana
      ---------------------------
    `);
  }, 5000);
  */
});

// Limpiar listeners al desmontar
onUnmounted(() => {
  console.log('WhatsAppReservationHandler desmontado');
  eventBus.off('whatsapp-message', simulateWhatsAppMessage);
});

// Exponer funciones para uso externo
defineExpose({
  processWhatsAppMessage,
  simulateWhatsAppMessage
});
</script>
