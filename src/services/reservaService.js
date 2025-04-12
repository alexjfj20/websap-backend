// Servicio para la gestión de reservas
import apiService from './apiService';
import eventBus from '../utils/eventBus';

// Almacenamiento local para las reservas (simulando una base de datos)
let reservationsStore = [];

// Intentar cargar reservas guardadas en localStorage al iniciar
try {
  const savedReservations = localStorage.getItem('websap_reservations');
  if (savedReservations) {
    reservationsStore = JSON.parse(savedReservations);
    console.log('Reservas cargadas desde localStorage:', reservationsStore.length);
  }
} catch (error) {
  console.error('Error al cargar reservas desde localStorage:', error);
}

// Función para guardar las reservas en localStorage
function saveReservationsToStorage() {
  try {
    localStorage.setItem('websap_reservations', JSON.stringify(reservationsStore));
  } catch (error) {
    console.error('Error al guardar reservas en localStorage:', error);
  }
}

// Función para guardar una nueva reserva
export async function saveReservation(reservationData) {
  try {
    // Asegurarse de que el token esté configurado en apiService
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token);
    }
    
    // Generar un ID único para la reserva
    const reservationId = 'res_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Crear el objeto de reserva con los datos recibidos
    const reservation = {
      id: reservationId,
      fullName: reservationData.fullName,
      mobilePhone: reservationData.mobilePhone,
      landlinePhone: reservationData.landlinePhone || '',
      email: reservationData.email || '',
      address: reservationData.address || '',
      date: reservationData.reservationDate,
      time: reservationData.reservationTime,
      peopleCount: reservationData.peopleCount,
      notes: reservationData.additionalNotes || '',
      status: 'pending', // Estado inicial: pendiente
      createdAt: new Date().toISOString(),
      source: reservationData.source || 'web' // Fuente de la reserva: web o whatsapp
    };
    
    try {
      // Intentar guardar en el backend
      const response = await apiService.post('/whatsapp/reservas', {
        nombre: reservation.fullName,
        telefono: reservation.mobilePhone,
        email: reservation.email,
        fecha: reservation.date,
        hora: reservation.time,
        personas: reservation.peopleCount,
        notas: reservation.notes,
        created_by: reservationData.created_by || localStorage.getItem('userId') || null,
        usuario_id: reservationData.usuario_id || (localStorage.getItem('userType') === 'user' ? localStorage.getItem('userId') : null)
      });
      
      if (response.data && response.data.success) {
        console.log('Reserva guardada en el backend:', response.data);
        reservation.id = response.data.reservationId || reservation.id;
      }
    } catch (apiError) {
      console.warn('No se pudo guardar la reserva en el backend, usando almacenamiento local:', apiError);
    }
    
    // Guardar la reserva en nuestro almacenamiento local
    reservationsStore.unshift(reservation);
    saveReservationsToStorage();
    
    // Emitimos un evento para notificar a otros componentes sobre la nueva reserva
    eventBus.emit('nueva-reserva', reservation);
    
    console.log('Reserva guardada correctamente:', reservation);
    
    return {
      success: true,
      reservation
    };
  } catch (error) {
    console.error('Error al guardar la reserva:', error);
    return {
      success: false,
      error: error.message || 'Error al guardar la reserva'
    };
  }
}

// Función para obtener todas las reservas
export async function getReservations() {
  try {
    // Asegurarse de que el token esté configurado en apiService
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token);
    }
    
    // Intentar obtener reservas desde el backend
    try {
      const response = await apiService.get('/whatsapp/reservas');
      
      if (response && response.success && Array.isArray(response.reservas)) {
        console.log('✅ Reservas obtenidas desde el backend:', response.reservas.length);
        
        // Convertir las reservas del backend al formato que espera el frontend
        const backendReservations = response.reservas.map(res => ({
          id: res.id,
          fullName: res.nombre,
          mobilePhone: res.telefono,
          email: res.email || '',
          date: formatDateToDDMMYYYY(res.fecha),
          time: res.hora,
          peopleCount: res.personas,
          notes: res.notas || '',
          status: res.estado === 'confirmada' ? 'confirmed' : 
                 res.estado === 'cancelada' ? 'cancelled' : 'pending',
          createdAt: res.creado_en,
          source: res.origen || 'web',
          created_by: res.created_by,
          usuario_id: res.usuario_id
        }));
        
        // Actualizar el almacenamiento local con las reservas del backend
        reservationsStore = backendReservations;
        saveReservationsToStorage();
        
        return {
          success: true,
          reservations: backendReservations
        };
      }
    } catch (error) {
      console.warn('Error al obtener reservas desde el backend, usando datos locales:', error);
    }
    
    // Si no se pudieron obtener del backend o hubo un error, usar los datos locales
    console.log('📋 Usando datos de reservas locales:', reservationsStore.length);
    
    // Formatear las fechas de las reservas locales
    const formattedReservations = reservationsStore.map(res => ({
      ...res,
      date: formatDateToDDMMYYYY(res.date)
    }));
    
    // Si no hay reservas en el almacenamiento, devolvemos un array vacío
    if (formattedReservations.length === 0) {
      return {
        success: true,
        reservations: []
      };
    }
    
    return {
      success: true,
      reservations: formattedReservations
    };
  } catch (error) {
    console.error('❌ Error al obtener las reservas:', error);
    return {
      success: false,
      error: error.message || 'Error al obtener las reservas'
    };
  }
}

// Función para actualizar el estado de una reserva
export async function updateReservationStatus(reservationId, status) {
  try {
    // Intentar actualizar en el backend
    try {
      const response = await apiService.put(`/whatsapp/reservas/${reservationId}`, {
        estado: status === 'confirmed' ? 'confirmada' : 
                status === 'cancelled' ? 'cancelada' : 'pendiente'
      });
      
      if (response.data && response.data.success) {
        console.log('Estado de reserva actualizado en el backend:', response.data);
      }
    } catch (apiError) {
      console.warn('No se pudo actualizar el estado de la reserva en el backend:', apiError);
    }
    
    // Buscar la reserva en nuestro almacenamiento local
    const reservationIndex = reservationsStore.findIndex(res => res.id === reservationId);
    
    if (reservationIndex === -1) {
      throw new Error('Reserva no encontrada');
    }
    
    // Actualizar el estado
    reservationsStore[reservationIndex].status = status;
    
    // Guardar los cambios en localStorage
    saveReservationsToStorage();
    
    // Emitir evento de actualización
    eventBus.emit('reserva-actualizada', {
      id: reservationId,
      status
    });
    
    return {
      success: true,
      message: 'Estado de reserva actualizado correctamente'
    };
  } catch (error) {
    console.error('Error al actualizar el estado de la reserva:', error);
    return {
      success: false,
      error: error.message || 'Error al actualizar el estado de la reserva'
    };
  }
}

// Función para guardar una reserva desde WhatsApp
export async function saveWhatsAppReservation(reserva) {
  console.log("Procesando reserva desde WhatsApp:", reserva);
  
  // Asegurarse de que el token esté configurado en apiService
  const token = localStorage.getItem('token');
  if (token) {
    apiService.setToken(token);
  }
  
  // Asegurar que los nuevos campos estén presentes en la reserva
  const reservaCompleta = {
    ...reserva,
    created_by: reserva.created_by || localStorage.getItem('userId') || null,
    usuario_id: reserva.usuario_id || (localStorage.getItem('userType') === 'user' ? localStorage.getItem('userId') : null)
  };
  
  try {
    const response = await apiService.post('/whatsapp/reservas', reservaCompleta);
    
    // Crear un objeto de reserva completo para devolver al frontend
    const reservationObject = {
      id: response.reservationId || Date.now().toString(),
      fullName: reservaCompleta.nombre,
      mobilePhone: reservaCompleta.telefono,
      email: reservaCompleta.email || '',
      date: formatDateToDDMMYYYY(reservaCompleta.fecha),
      time: reservaCompleta.hora,
      peopleCount: reservaCompleta.personas || 2,
      notes: reservaCompleta.notas || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      source: 'whatsapp',
      created_by: reservaCompleta.created_by,
      usuario_id: reservaCompleta.usuario_id
    };
    
    return {
      success: true,
      reservation: reservationObject,
      message: 'Reserva guardada correctamente'
    };
  } catch (error) {
    console.warn('⚠️ No se pudo guardar la reserva en el backend, pero se guardó localmente:', error);
    
    // Guardar en IndexedDB como respaldo
    await saveReservaLocally(reservaCompleta);
    
    return {
      status: 'local',
      success: true,
      reservation: {
        id: Date.now().toString(),
        fullName: reservaCompleta.nombre,
        mobilePhone: reservaCompleta.telefono,
        email: reservaCompleta.email || '',
        date: formatDateToDDMMYYYY(reservaCompleta.fecha),
        time: reservaCompleta.hora,
        peopleCount: reservaCompleta.personas || 2,
        notes: reservaCompleta.notas || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        source: 'whatsapp',
        created_by: reservaCompleta.created_by,
        usuario_id: reservaCompleta.usuario_id
      },
      message: 'Reserva guardada localmente debido a un error de conexión'
    };
  }
}

// Función para guardar una reserva localmente cuando falla el backend
async function saveReservaLocally(reserva) {
  try {
    // Añadir la reserva al almacenamiento local
    const localReserva = {
      id: 'local_' + Date.now(),
      fullName: reserva.nombre || reserva.fullName,
      mobilePhone: reserva.telefono || reserva.mobilePhone,
      email: reserva.email || '',
      date: formatDateToDDMMYYYY(reserva.fecha || reserva.date),
      time: reserva.hora || reserva.time,
      peopleCount: reserva.personas || reserva.peopleCount,
      notes: reserva.notas || reserva.notes || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      source: 'whatsapp',
      created_by: reserva.created_by || localStorage.getItem('userId') || null,
      usuario_id: reserva.usuario_id || (localStorage.getItem('userType') === 'user' ? localStorage.getItem('userId') : null),
      pendingSave: true // Marcar para sincronizar cuando haya conexión
    };
    
    // Añadir al store y guardar
    reservationsStore.unshift(localReserva);
    saveReservationsToStorage();
    
    // Emitir evento de nueva reserva
    eventBus.emit('nueva-reserva', localReserva);
    
    return localReserva;
  } catch (error) {
    console.error('Error al guardar reserva localmente:', error);
    throw error;
  }
}

/**
 * Elimina una reserva específica
 * @param {string} reservationId - ID de la reserva a eliminar
 * @returns {Promise<Object>} - Resultado de la operación
 */
export async function deleteReservation(reservationId) {
  try {
    // Intentar eliminar en el backend primero
    try {
      const response = await apiService.delete(`/reservas/${reservationId}`);
      console.log('Reserva eliminada en el backend:', response);
    } catch (apiError) {
      console.warn('No se pudo eliminar la reserva en el backend:', apiError);
      // Continuamos con la eliminación local aunque falle el backend
    }
    
    // Eliminar de nuestro almacenamiento local
    const index = reservationsStore.findIndex(r => r.id === reservationId);
    if (index !== -1) {
      reservationsStore.splice(index, 1);
      saveReservationsToStorage();
      
      // Emitir evento de actualización
      eventBus.emit('reserva-eliminada', { id: reservationId });
      
      return {
        success: true,
        message: 'Reserva eliminada correctamente'
      };
    } else {
      return {
        success: false,
        error: 'No se encontró la reserva especificada'
      };
    }
  } catch (error) {
    console.error('Error al eliminar reserva:', error);
    return {
      success: false,
      error: error.message || 'Error al eliminar la reserva'
    };
  }
}

/**
 * Verifica si una reserva tiene más de X días de antigüedad
 * @param {Object} reservation - Reserva a verificar
 * @param {number} days - Número de días para considerar antigua
 * @returns {boolean} - true si la reserva es más antigua que los días especificados
 */
export function isReservationOlderThan(reservation, days = 30) {
  if (!reservation || !reservation.date) return false;
  
  const reservationDate = new Date(reservation.date);
  const today = new Date();
  
  // Calcular la diferencia en milisegundos
  const diffTime = today - reservationDate;
  // Convertir a días
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > days;
}

// Función para formatear una fecha al formato DD/MM/YYYY
function formatDateToDDMMYYYY(dateString) {
  if (!dateString) return '';
  
  try {
    // Caso específico para el formato problemático: "29T05:00:00.000Z/05/2025"
    if (dateString.includes('T') && dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parts[0].split('T')[0];
        return `${day}/${parts[1]}/${parts[2]}`;
      }
    }
    
    // Formato ISO: "2025-05-29"
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
    
    // Intentar parsear como objeto Date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    return dateString;
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return dateString;
  }
}

// Exportación por defecto para compatibilidad con importaciones existentes
export default {
  saveReservation,
  getReservations,
  updateReservationStatus,
  saveWhatsAppReservation,
  deleteReservation,
  isReservationOlderThan
};
