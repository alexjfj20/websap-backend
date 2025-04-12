/**
 * Servicio para manejar la recuperación de menús desde diferentes fuentes
 */
import { getAllPlatos } from './indexedDBService';

/**
 * Obtiene un menú desde IndexedDB usando su ID
 * @param {string} menuId - ID del menú a recuperar
 * @returns {Promise<Object>} - Datos del menú
 */
export const getMenuFromIndexedDB = async (menuId) => {
  try {
    // Primero intentamos obtener todos los platos
    const allPlatos = await getAllPlatos();
    
    if (!allPlatos || allPlatos.length === 0) {
      console.log('No hay platos en IndexedDB para construir el menú');
      return null;
    }
    
    console.log(`Construyendo menú con ID ${menuId} a partir de ${allPlatos.length} platos en IndexedDB`);
    
    // Información del negocio (podría obtenerse de otra fuente)
    const businessInfo = {
      name: 'Restaurante WebSAP',
      description: 'Deliciosa comida para todos los gustos',
      contact: 'info@websap.com',
      address: 'Calle Principal #123'
    };
    
    // Construir el objeto de menú con todos los platos disponibles
    const menu = {
      id: menuId,
      items: allPlatos.map(plato => ({
        id: plato.id,
        name: plato.name,
        description: plato.description,
        price: plato.price,
        image: plato.image,
        isSpecial: plato.isSpecial || false,
        includesDrink: plato.includesDrink || false,
        availableQuantity: plato.availableQuantity || 10
      })),
      businessInfo: businessInfo,
      createdAt: new Date().toISOString()
    };
    
    console.log(`Menú construido con ${menu.items.length} platos desde IndexedDB`);
    return menu;
  } catch (error) {
    console.error('Error al obtener menú desde IndexedDB:', error);
    return null;
  }
};

export default {
  getMenuFromIndexedDB
};
