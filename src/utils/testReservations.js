// Utilidad para probar reservas desde la consola del navegador
import { simulateWhatsAppReservation } from './whatsappSimulator';

/**
 * Genera una reserva de prueba con datos aleatorios
 * @returns {Object} Datos de reserva aleatorios
 */
function generateRandomReservation() {
  const nombres = [
    'Juan Pérez', 'María García', 'Carlos Rodríguez', 'Ana Martínez', 
    'Luis López', 'Laura Sánchez', 'Pedro González', 'Sofía Fernández'
  ];
  
  const telefonos = [
    '612345678', '623456789', '634567890', '645678901', 
    '656789012', '667890123', '678901234', '689012345'
  ];
  
  const fechas = [];
  const hoy = new Date();
  for (let i = 1; i <= 7; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + i);
    fechas.push(fecha.toISOString().split('T')[0]);
  }
  
  const horas = ['13:00', '13:30', '14:00', '14:30', '20:00', '20:30', '21:00', '21:30'];
  const personas = [1, 2, 2, 2, 3, 4, 5, 6, 8];
  
  return {
    nombre: nombres[Math.floor(Math.random() * nombres.length)],
    telefono: telefonos[Math.floor(Math.random() * telefonos.length)],
    email: Math.random() > 0.5 ? `cliente${Math.floor(Math.random() * 100)}@example.com` : '',
    fecha: fechas[Math.floor(Math.random() * fechas.length)],
    hora: horas[Math.floor(Math.random() * horas.length)],
    personas: personas[Math.floor(Math.random() * personas.length)],
    notas: Math.random() > 0.7 ? 'Mesa cerca de la ventana si es posible' : 
           Math.random() > 0.5 ? 'Celebración de cumpleaños' : 
           Math.random() > 0.3 ? 'Alergias: gluten' : ''
  };
}

/**
 * Envía una reserva de prueba con datos aleatorios
 */
function sendRandomReservation() {
  const randomData = generateRandomReservation();
  console.log('Enviando reserva aleatoria:', randomData);
  return simulateWhatsAppReservation(randomData);
}

/**
 * Envía múltiples reservas de prueba
 * @param {number} count - Número de reservas a enviar
 * @param {number} interval - Intervalo entre reservas en ms
 */
function sendMultipleReservations(count = 3, interval = 2000) {
  console.log(`Enviando ${count} reservas aleatorias con intervalo de ${interval}ms`);
  
  let sent = 0;
  
  const sendNext = () => {
    if (sent < count) {
      sendRandomReservation();
      sent++;
      setTimeout(sendNext, interval);
    } else {
      console.log(`✅ ${count} reservas enviadas correctamente`);
    }
  };
  
  sendNext();
}

// Exponer funciones en window para uso desde la consola
window.testReservations = {
  random: sendRandomReservation,
  multiple: sendMultipleReservations,
  generate: generateRandomReservation
};

export default {
  sendRandomReservation,
  sendMultipleReservations,
  generateRandomReservation
};
