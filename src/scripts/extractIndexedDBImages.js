// src/scripts/extractIndexedDBImages.js

import { getAllPlatos } from '../services/indexedDBService';
import apiService from '../services/apiService';
import { optimizeImageForSync } from '../services/imageService';

/**
 * Función para extraer las imágenes de los platos desde IndexedDB y enviarlas al servidor
 */
export async function extractIndexedDBImages() {
  try {
    console.log('Extrayendo imágenes de IndexedDB...');
    
    // Obtener todos los platos de IndexedDB
    const platos = await getAllPlatos();
    
    if (!platos || platos.length === 0) {
      console.warn('No hay platos en IndexedDB para extraer imágenes');
      return {
        success: false,
        message: 'No hay platos en IndexedDB para extraer imágenes'
      };
    }
    
    console.log(`Se encontraron ${platos.length} platos en IndexedDB`);
    
    // Filtrar solo los platos que tienen imagen
    const platosConImagen = platos.filter(plato => plato.image && plato.image.length > 0);
    
    console.log(`${platosConImagen.length} platos tienen imágenes en IndexedDB`);
    
    if (platosConImagen.length === 0) {
      console.warn('Ninguno de los platos tiene imágenes en IndexedDB');
      return {
        success: false,
        message: 'Ninguno de los platos tiene imágenes en IndexedDB'
      };
    }
    
    // Optimizar las imágenes antes de enviarlas
    console.log('Optimizando imágenes antes de enviarlas...');
    const platosOptimizados = [];
    
    for (const plato of platosConImagen) {
      try {
        // Crear una copia del plato para no modificar el original
        const platoOptimizado = { ...plato };
        
        // Optimizar la imagen
        platoOptimizado.image = await optimizeImageForSync(plato.image);
        
        platosOptimizados.push(platoOptimizado);
      } catch (error) {
        console.warn(`Error al optimizar imagen del plato ${plato.name}:`, error);
        // Incluir el plato con la imagen original en caso de error
        platosOptimizados.push(plato);
      }
    }
    
    console.log(`${platosOptimizados.length} platos con imágenes optimizadas listos para enviar`);
    
    // Enviar los platos con imágenes optimizadas al servidor
    const response = await apiService.post('/indexeddb/backup', { platos: platosOptimizados });
    
    if (response && response.success) {
      console.log('Imágenes extraídas y enviadas al servidor con éxito');
      
      // Sincronizar las imágenes con MySQL
      try {
        const syncResponse = await apiService.post('/indexeddb/sync-images');
        
        if (syncResponse && syncResponse.success) {
          console.log('Imágenes sincronizadas con MySQL con éxito');
          return {
            success: true,
            message: `Imágenes extraídas y sincronizadas con éxito. ${syncResponse.data.actualizados} platos actualizados.`
          };
        } else {
          console.error('Error al sincronizar imágenes con MySQL:', syncResponse?.message || 'Error desconocido');
          return {
            success: false,
            message: 'Error al sincronizar imágenes con MySQL: ' + (syncResponse?.message || 'Error desconocido')
          };
        }
      } catch (syncError) {
        console.error('Error al sincronizar imágenes con MySQL:', syncError);
        return {
          success: false,
          message: 'Error al sincronizar imágenes con MySQL: ' + syncError.message
        };
      }
    } else {
      console.error('Error al enviar imágenes al servidor:', response?.message || 'Error desconocido');
      return {
        success: false,
        message: 'Error al enviar imágenes al servidor: ' + (response?.message || 'Error desconocido')
      };
    }
  } catch (error) {
    console.error('Error al extraer imágenes de IndexedDB:', error);
    return {
      success: false,
      message: 'Error al extraer imágenes de IndexedDB: ' + error.message
    };
  }
}
