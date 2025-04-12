// Script para probar la integración de reservas de WhatsApp

// Datos de la reserva de prueba
const reservationData = {
  nombre: "Cliente de Prueba WhatsApp",
  telefono: "612345678",
  email: "cliente@whatsapp.com",
  fecha: "2025-03-30",
  hora: "20:00",
  personas: 4,
  notas: "Reserva de prueba desde WhatsApp"
};

// Función para enviar la reserva al endpoint
async function sendWhatsAppReservation() {
  try {
    console.log('Enviando reserva de prueba al endpoint...');
    
    const response = await fetch('http://localhost:3000/api/whatsapp/reservas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reservationData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Reserva enviada correctamente:', data);
    } else {
      console.error('❌ Error al enviar la reserva:', data.message);
    }
  } catch (error) {
    console.error('❌ Error en la solicitud:', error);
  }
}

// Ejecutar la función
sendWhatsAppReservation();
