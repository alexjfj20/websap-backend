/**
 * Formatea una fecha en formato legible
 * @param {string|Date} date Fecha a formatear
 * @param {Object} options Opciones de formato
 * @returns {string} Fecha formateada
 */
export function formatDate(date, options = {}) {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    
    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    const formatOptions = { ...defaultOptions, ...options };
    
    return new Intl.DateTimeFormat('es-ES', formatOptions).format(dateObj);
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return 'Error de formato';
  }
}

/**
 * Formatea una fecha en formato relativo (hace X minutos, etc.)
 * @param {string|Date} date Fecha a formatear
 * @returns {string} Texto del tiempo relativo
 */
export function formatRelativeTime(date) {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    
    // Menos de un minuto
    if (diffInSeconds < 60) {
      return 'Hace un momento';
    }
    
    // Menos de una hora
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    }
    
    // Menos de un día
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    
    // Menos de una semana
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
    }
    
    // Más de una semana, usar formato normal
    return formatDate(dateObj, { hour: undefined, minute: undefined });
  } catch (error) {
    console.error('Error al formatear tiempo relativo:', error);
    return 'Error de formato';
  }
}

export default {
  formatDate,
  formatRelativeTime
};
