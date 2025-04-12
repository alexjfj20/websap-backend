// Simulador de mensajes de WhatsApp para pruebas
import eventBus from './eventBus';

/**
 * Utilidad para simular el envío de reservas desde WhatsApp
 * Esta es una herramienta de desarrollo que permite probar la funcionalidad
 * de recepción de reservas desde WhatsApp sin necesidad de integrar realmente
 * con la API de WhatsApp.
 */

/**
 * Función para simular el envío de una reserva desde WhatsApp
 * @param {Object} customData - Datos personalizados para la reserva
 * @returns {Promise<boolean>} - Resultado de la operación
 */
export function simulateWhatsAppReservation(customData = {}) {
  try {
    // Datos por defecto para la reserva
    const defaultData = {
      nombre: 'Cliente de Prueba WhatsApp',
      telefono: '612345678',
      email: 'whatsapp@example.com',
      fecha: new Date().toISOString().split('T')[0], // Hoy
      hora: '20:00',
      personas: 2,
      notas: 'Reserva realizada desde WhatsApp'
    };

    // Combinar datos por defecto con datos personalizados
    const whatsappData = { ...defaultData, ...customData };
    
    console.log(' Simulando mensaje de WhatsApp con datos:', whatsappData);
    
    // Crear un evento con la estructura esperada por el handler
    const whatsappEvent = {
      type: 'whatsapp_reservation',
      reservation: whatsappData,
      timestamp: Date.now(),
      id: 'whatsapp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    };
    
    // Enviar el evento a través de eventBus (método principal)
    eventBus.emit('whatsapp_message', whatsappEvent);
    
    // También notificar que se debe actualizar la lista de reservas
    setTimeout(() => {
      eventBus.emit('refresh-reservations');
    }, 1000);
    
    console.log(' Simulación de mensaje de WhatsApp completada');
    return true;
  } catch (error) {
    console.error(' Error al simular mensaje de WhatsApp:', error);
    return false;
  }
}

/**
 * Función para configurar el simulador de WhatsApp en la consola
 * Esta función es necesaria para mantener compatibilidad con el código existente
 */
export function setupWhatsAppSimulatorForConsole() {
  // Esta función ahora solo expone la función de simulación en el objeto window
  // pero no hace nada más para evitar duplicación de mensajes
  console.log('Simulador de WhatsApp configurado. Usa window.testWhatsAppReservation() para probar.');
  return true;
}

// Exponer la función en window para poder llamarla desde la consola
window.testWhatsAppReservation = simulateWhatsAppReservation;

export default {
  simulateWhatsAppReservation,
  setupWhatsAppSimulatorForConsole
};
