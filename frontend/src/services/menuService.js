/**
 * Servicio para gestionar operaciones relacionadas con el menú
 */

// Determina la URL base según el entorno
const getBaseUrl = () => {
  // Si estamos en producción (dominio allseo.xyz)
  if (window.location.hostname.includes('allseo.xyz')) {
    return 'https://websap-backend.onrender.com/api';
  }
  // De lo contrario, estamos en desarrollo
  return 'http://localhost:10000/api';
};

/**
 * Guarda los elementos del menú en el servidor
 * @param {Array} items - Lista de elementos del menú
 * @returns {Promise} Promesa con la respuesta del servidor
 */
export const saveMenuItems = async (items) => {
  try {
    console.log('Guardando menú en el servidor:', items);
    
    // Intentar guardar en el servidor
    if (window.axios) {
      const response = await window.axios.post(`${getBaseUrl()}/menu/save`, { items });
      console.log('Respuesta del servidor:', response.data);
      return response.data;
    }
    
    // Si no hay axios disponible, usar fetch
    const response = await fetch(`${getBaseUrl()}/menu/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    });
    
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al guardar el menú:', error);
    
    // Si estamos en desarrollo o hay un error de conexión, guardar localmente
    try {
      localStorage.setItem('menuItems', JSON.stringify(items));
      console.log('Menú guardado localmente como fallback');
      return { success: true, message: 'Menú guardado localmente (modo fallback)' };
    } catch (localError) {
      console.error('Error al guardar localmente:', localError);
      throw error; // Re-lanzar el error original
    }
  }
};

/**
 * Obtiene los elementos del menú desde el servidor
 * @returns {Promise} Promesa con la lista de elementos del menú
 */
export const getMenuItems = async () => {
  try {
    if (window.axios) {
      const response = await window.axios.get(`${getBaseUrl()}/public/menu`);
      return response.data;
    }
    
    const response = await fetch(`${getBaseUrl()}/public/menu`);
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al obtener el menú:', error);
    
    // Intentar recuperar datos locales como fallback
    const localData = localStorage.getItem('menuItems');
    if (localData) {
      return JSON.parse(localData);
    }
    
    // Si no hay datos locales, devolver array vacío
    return [];
  }
};

export default {
  saveMenuItems,
  getMenuItems
};