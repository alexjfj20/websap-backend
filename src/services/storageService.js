const DB_NAME = 'websapDatabase';
// Incrementar la versión de la base de datos para forzar la actualización
const DB_VERSION = 3; // Incrementado a 3 para forzar upgradeneeded
const MENU_STORE = 'menuItems';
const IMAGE_STORE = 'menuImages';
const SOLD_ITEMS_STORE = 'soldItems'; 
const BUSINESS_INFO_STORE = 'businessInfo';
const USERS_STORE = 'users';
const SHARED_MENU_STORE = 'sharedMenus';

// Abrir la conexión a la base de datos con manejo mejorado de errores
function openDatabase() {
  return new Promise((resolve, reject) => {
    try {
      console.log("Intentando abrir la base de datos con versión:", DB_VERSION);
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        console.error("Error al abrir la base de datos:", event.target.error);
        reject('Error al abrir la base de datos: ' + event.target.errorCode);
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        console.log("Base de datos abierta con éxito, versión:", db.version);
        
        // Verificar que todos los almacenes necesarios existen
        const existingStores = Array.from(db.objectStoreNames);
        console.log("Almacenes existentes:", existingStores);
        
        resolve(db);
      };
      
      request.onupgradeneeded = (event) => {
        console.log("Actualizando estructura de la base de datos a versión:", event.newVersion);
        const db = event.target.result;
        
        // Crear todos los almacenes necesarios si no existen
        const requiredStores = [
          { name: USERS_STORE, keyPath: 'id' },
          { name: MENU_STORE, keyPath: 'id' },
          { name: IMAGE_STORE, keyPath: 'id' },
          { name: SOLD_ITEMS_STORE, keyPath: 'id' },
          { name: BUSINESS_INFO_STORE, keyPath: 'id' },
          { name: SHARED_MENU_STORE, keyPath: 'id' }
        ];
        
        // Crear cada almacén
        requiredStores.forEach(store => {
          if (!db.objectStoreNames.contains(store.name)) {
            console.log(`Creando almacén: ${store.name}`);
            db.createObjectStore(store.name, { keyPath: store.keyPath });
          }
        });
      };
    } catch (error) {
      console.error("Error crítico en IndexedDB:", error);
      reject(error);
    }
  });
}

// Guardar elementos del menú
export async function saveMenuItems(items, areSpecial = false) {
  try {
    // Primero procesamos todas las imágenes y creamos copias de los objetos
    const processedItems = [];
    for (const item of items) {
      // Crear una copia del elemento
      const itemToStore = { ...item };
      
      // Asegurarse de que el elemento tiene un id
      if (!itemToStore.id) {
        itemToStore.id = Date.now() + Math.random().toString(36).substring(2, 10);
      }
      
      // Añadir la propiedad isSpecial (asumiendo que viene del formulario)
      itemToStore.isSpecial = item.isSpecial || false; // Valor por defecto: false
      
      // Si tiene imagen, guardarla por separado antes de la transacción principal
      if (itemToStore.image && typeof itemToStore.image === 'string' && itemToStore.image.length > 0) {
        try {
          await saveMenuImage(itemToStore.id, itemToStore.image);
          itemToStore.image = null;
          itemToStore.hasStoredImage = true;
        } catch (imageError) {
          console.warn('Error al guardar imagen, continuando sin imagen:', imageError);
          // Si hay error al guardar la imagen, continuamos sin ella
          itemToStore.image = null;
          itemToStore.hasStoredImage = false;
        }
      }
      
      processedItems.push(itemToStore);
    }
    
    // Ahora guardamos todos los items en una sola transacción
    const db = await openDatabase();
    const transaction = db.transaction([MENU_STORE], 'readwrite');
    const store = transaction.objectStore(MENU_STORE);
    
    // Usamos Promise.all para manejar todas las operaciones put juntas
    const putPromises = processedItems.map(item => {
      return new Promise((resolve, reject) => {
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
      });
    });
    
    // Esperamos a que se completen todas las operaciones put
    await Promise.all(putPromises);
    
    // Esperamos a que se complete la transacción
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error al guardar elementos del menú:', error);
    throw error;
  }
}

// Guardar imagen de un elemento del menú
export async function saveMenuImage(itemId, imageData) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([IMAGE_STORE], 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE);
    
    store.put({ id: itemId, data: imageData });
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error al guardar imagen:', error);
    throw error;
  }
}

// Obtener todos los elementos del menú
export async function getMenuItems() {
  try {
    const db = await openDatabase();
    
    // Verificar que el almacén existe
    if (!Array.from(db.objectStoreNames).includes(MENU_STORE)) {
      console.error(`El almacén ${MENU_STORE} no existe en la base de datos`);
      return []; // Devolver array vacío en lugar de fallar
    }
    
    const transaction = db.transaction([MENU_STORE], 'readonly');
    const store = transaction.objectStore(MENU_STORE);
    
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        let items = request.result;
        
        // Verificar que todos los elementos tengan IDs únicos
        const uniqueItems = [];
        const seenIds = new Set();
        
        for (const item of items) {
          // Si el elemento no tiene ID o es un ID duplicado, generamos uno nuevo
          if (!item.id || seenIds.has(item.id)) {
            item.id = Date.now() + '-' + Math.random().toString(36).substring(2, 10);
          }
          
          // Marcar este ID como visto
          seenIds.add(item.id);
          uniqueItems.push(item);
        }
        
        // Recuperar imágenes para cada elemento
        for (const item of uniqueItems) {
          if (item.hasStoredImage) {
            item.image = await getMenuImage(item.id);
          }
        }
        
        resolve(uniqueItems);
      };
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error al obtener elementos del menú:', error);
    return []; // Devolver array vacío en caso de error
  }
}

// Eliminar un elemento del menú - RENOMBRANDO LA FUNCIÓN
export async function deleteMenuItemFromDB(itemId) {
  try {
    console.log(`Intentando eliminar elemento con ID: ${itemId}`);
    
    const db = await openDatabase();
    const transaction = db.transaction([MENU_STORE, IMAGE_STORE], 'readwrite');
    const menuStore = transaction.objectStore(MENU_STORE);
    const imageStore = transaction.objectStore(IMAGE_STORE);
    
    // Verificar primero si el elemento existe
    const getRequest = menuStore.get(itemId);
    
    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        if (!getRequest.result) {
          console.warn(`No se encontró el elemento con ID: ${itemId}`);
          // Resolver con éxito incluso si el elemento no existe
          resolve(true);
          return;
        }
        
        // Eliminar el elemento
        const deleteRequest = menuStore.delete(itemId);
        deleteRequest.onsuccess = () => {
          console.log(`Elemento con ID ${itemId} eliminado correctamente`);
          
          // Intentar eliminar la imagen asociada (no falla si no existe)
          const imageRequest = imageStore.delete(itemId);
          imageRequest.onsuccess = () => {
            console.log(`Imagen para elemento ${itemId} eliminada (si existía)`);
            resolve(true);
          };
          imageRequest.onerror = (e) => {
            // No fallar si la imagen no existe
            console.warn(`Error al eliminar imagen para ${itemId}:`, e.target.error);
            resolve(true);
          };
        };
        
        deleteRequest.onerror = (e) => {
          console.error(`Error al eliminar elemento ${itemId}:`, e.target.error);
          reject(e.target.error);
        };
      };
      
      getRequest.onerror = (event) => {
        console.error(`Error al verificar existencia del elemento ${itemId}:`, event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Error al eliminar elemento del menú:', error);
    throw error;
  }
}

// Mantener la función original por compatibilidad, pero que use la nueva
export async function deleteMenuItem(itemId) {
  console.warn('La función deleteMenuItem está obsoleta, use deleteMenuItemFromDB en su lugar');
  return deleteMenuItemFromDB(itemId);
}

// Obtener imagen de un elemento del menú
export async function getMenuImage(itemId) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([IMAGE_STORE], 'readonly');
    const store = transaction.objectStore(IMAGE_STORE);
    
    const request = store.get(itemId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data);
        } else {
          resolve(null);
        }
      };
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error al obtener imagen:', error);
    throw error;
  }
}

// Guardar información del negocio - MEJORADA
export async function saveBusinessInfo(businessInfo) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['businessInfo'], 'readwrite');
    const store = transaction.objectStore('businessInfo');

    // Crear una copia limpia del objeto sin referencias circulares o propiedades no serializables
    const cleanBusinessInfo = {
      id: businessInfo.id || 'business_info_1', // Usar un ID consistente
      name: businessInfo.name || '',
      description: businessInfo.description || '',
      contact: businessInfo.contact || '',
      address: businessInfo.address || '',
      logo: businessInfo.logo || ''
    };

    // Manejar información de pago por separado si existe
    if (businessInfo.paymentInfo) {
      cleanBusinessInfo.paymentInfo = {
        qrTitle: businessInfo.paymentInfo.qrTitle || '',
        qrImage: businessInfo.paymentInfo.qrImage || '',
        nequiNumber: businessInfo.paymentInfo.nequiNumber || '',
        nequiImage: businessInfo.paymentInfo.nequiImage || '',
        bankInfo: businessInfo.paymentInfo.bankInfo || '',
        otherPaymentMethods: businessInfo.paymentInfo.otherPaymentMethods || ''
      };
    }

    // Para debugging, verificamos que es serializable
    try {
      JSON.stringify(cleanBusinessInfo);
    } catch (e) {
      console.error('El objeto businessInfo no es serializable:', e);
      throw new Error('El objeto businessInfo no es serializable');
    }

    // Guardar el objeto limpio
    const request = store.put(cleanBusinessInfo);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => {
        console.error('Error específico al guardar businessInfo:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Error al guardar información del negocio:', error);
    throw error;
  }
}

// Obtener información del negocio
export async function getBusinessInfo() {
  try {
    const db = await openDatabase();
    
    // Verificar que el almacén existe
    if (!Array.from(db.objectStoreNames).includes(BUSINESS_INFO_STORE)) {
      console.error(`El almacén ${BUSINESS_INFO_STORE} no existe en la base de datos`);
      return {}; // Devolver objeto vacío en lugar de fallar
    }
    
    const transaction = db.transaction([BUSINESS_INFO_STORE], 'readonly');
    const store = transaction.objectStore(BUSINESS_INFO_STORE);
    
    const request = store.get('business_info_1');
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result || {});
      };
      request.onerror = (event) => {
        console.error('Error en request:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Error al obtener información del negocio:', error);
    // Devolvemos un objeto vacío en lugar de fallar
    return {};
  }
}

// Guardar elementos vendidos
export async function saveSoldItems(items) {
  try {
    // Asegurarse de que items sea un array y que cada elemento sea serializable
    if (!Array.isArray(items)) {
      console.warn('saveSoldItems recibió un valor que no es array:', items);
      items = [];
    }
    
    // Limpiar los objetos para asegurar que sean serializables
    const cleanItems = items.map(item => {
      // Si el item no es un objeto, crear uno básico
      if (!item || typeof item !== 'object') {
        return {
          name: 'Producto desconocido',
          quantity: 1,
          price: 0,
          includesDrink: false
        };
      }
      
      // Crear una copia limpia con solo las propiedades necesarias
      return {
        name: String(item.name || 'Producto desconocido'),
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        includesDrink: Boolean(item.includesDrink)
      };
    });
    
    const db = await openDatabase();
    const transaction = db.transaction([SOLD_ITEMS_STORE], 'readwrite');
    const store = transaction.objectStore(SOLD_ITEMS_STORE);
    
    // Asegurarnos de que estamos guardando un objeto serializable
    const soldItemsObject = { 
      id: 'sold_items_1', 
      items: cleanItems
    };
    
    // Verificar que el objeto es serializable antes de guardarlo
    try {
      // Esto lanzará error si el objeto no es serializable
      JSON.stringify(soldItemsObject);
    } catch (e) {
      console.error('El objeto soldItems no es serializable:', e);
      throw new Error('El objeto soldItems no es serializable');
    }
    
    const request = store.put(soldItemsObject);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => {
        console.error('Error específico al guardar soldItems:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Error al guardar elementos vendidos:', error);
    throw error;
  }
}

// Obtener elementos vendidos
export async function getSoldItems() {
  try {
    const db = await openDatabase();
    
    // Verificar que el almacén existe
    if (!Array.from(db.objectStoreNames).includes(SOLD_ITEMS_STORE)) {
      console.error(`El almacén ${SOLD_ITEMS_STORE} no existe en la base de datos`);
      return []; // Devolver array vacío en lugar de fallar
    }
    
    const transaction = db.transaction([SOLD_ITEMS_STORE], 'readonly');
    const store = transaction.objectStore(SOLD_ITEMS_STORE);
    
    const request = store.get('sold_items_1');
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.items);
        } else {
          resolve([]);
        }
      };
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error al obtener elementos vendidos:', error);
    return [];
  }
}

// Eliminar completamente la función migrateFromLocalStorage ya que no queremos usar localStorage
export async function migrateFromLocalStorage() {
  console.log("Función migrateFromLocalStorage en desuso - no se utilizará localStorage");
  return true; // Solo para mantener la compatibilidad con el código existente
}

// Comprimir imagen
export function compressImage(base64Image, maxWidth = 800, maxHeight = 600, quality = 0.7) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Crear un canvas para comprimir la imagen
      const canvas = document.createElement('canvas');
      
      let width = img.width;
      let height = img.height;
      
      // Calcular nuevas dimensiones manteniendo proporción
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Obtener imagen comprimida como JPEG con calidad reducida
      const compressedImage = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedImage);
    };
    img.src = base64Image;
  });
}

// Mejorar la función resetDatabase para asegurarnos de que no use localStorage
export async function resetDatabase() {
  return new Promise((resolve, reject) => {
    try {
      console.log("Iniciando proceso de eliminación de la base de datos...");
      
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
      
      deleteRequest.onsuccess = () => {
        console.log("Base de datos eliminada con éxito");
        
        console.log("Limpieza completa. La aplicación está lista para comenzar de nuevo.");
        resolve(true);
      };
      
      deleteRequest.onerror = (event) => {
        console.error("Error al eliminar la base de datos:", event.target.error);
        reject(event.target.error);
      };
    } catch (error) {
      console.error("Error al intentar resetear la base de datos:", error);
      reject(error);
    }
  });
}

// Añadir nueva función para validar disponibilidad
export async function checkItemAvailability(itemId) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([MENU_STORE], 'readonly');
    const store = transaction.objectStore(MENU_STORE);
    
    const item = await store.get(itemId);
    
    return {
      isAvailable: item && item.availableQuantity > 0,
      quantity: item ? item.availableQuantity : 0
    };
  } catch (error) {
    console.error('Error al verificar disponibilidad:', error);
    throw error;
  }
}

/**
 * Actualiza la cantidad disponible de un plato en el inventario.
 * @param {string} itemId - ID del plato a actualizar
 * @param {number|string} newQuantity - Nueva cantidad disponible
 * @returns {Promise<boolean>} - Resultado de la operación
 */
export async function updateItemAvailability(itemId, newQuantity) {
  try {
    // Validar parámetros de entrada
    if (!itemId) {
      console.error('Error: ID del item no proporcionado');
      return false;
    }
    
    // Asegurarse de que newQuantity sea un número entero válido
    // Usar parseInt en lugar de Math.floor para asegurar una conversión correcta a entero
    const quantity = parseInt(Number(newQuantity), 10);
    if (isNaN(quantity)) {
      console.error(`Error: Cantidad inválida proporcionada: ${newQuantity} (${typeof newQuantity})`);
      return false;
    }
    
    console.log(`Actualizando disponibilidad para item ${itemId} a ${quantity} unidades (valor original: ${newQuantity}, tipo: ${typeof newQuantity})`);
    
    // Usar una transacción específica solo para este item
    const db = await openDatabase();
    const transaction = db.transaction([MENU_STORE], 'readwrite');
    const store = transaction.objectStore(MENU_STORE);
    
    return new Promise((resolve, reject) => {
      // Primero obtenemos el item actual
      const getRequest = store.get(itemId);
      
      getRequest.onsuccess = (event) => {
        const item = event.target.result;
        
        if (!item) {
          console.error(`No se encontró el elemento con ID: ${itemId}`);
          resolve(false);
          return;
        }
        
        // Guardar valores anteriores para mejor logging
        const oldQuantity = parseInt(Number(item.availableQuantity) || 0, 10);
        
        // Actualizar la cantidad disponible, asegurando que sea un número entero
        item.availableQuantity = quantity;
        
        // Guardar el item actualizado
        const putRequest = store.put(item);
        
        putRequest.onsuccess = () => {
          console.log(`Disponibilidad actualizada para ${item.name} (ID: ${itemId}): ${oldQuantity} → ${quantity} (diferencia: ${oldQuantity - quantity})`);
          
          // Intentar sincronizar con el backend (opcional, no bloquea)
          try {
            fetch('http://localhost:3000/actualizar-disponibilidad', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: itemId,
                availableQuantity: quantity
              })
            }).catch(syncError => {
              // Simplemente registrar el error, no bloqueamos la operación principal
              console.warn('Error al sincronizar con backend:', syncError);
            });
          } catch (syncError) {
            console.warn('Error al sincronizar con el backend:', syncError);
            // No bloqueamos la función principal por errores de sincronización
          }
          
          resolve(true);
        };
        
        putRequest.onerror = (error) => {
          console.error(`Error al actualizar disponibilidad para ${itemId}:`, error);
          reject(error);
        };
      };
      
      getRequest.onerror = (error) => {
        console.error(`Error al obtener elemento ${itemId}:`, error);
        reject(error);
      };
      
      // Manejar errores de transacción
      transaction.onerror = (error) => {
        console.error('Error en transacción de actualización:', error);
        reject(error);
      };
    });
  } catch (error) {
    console.error('Error al actualizar disponibilidad:', error);
    return false;
  }
}

// Guardar un elemento del menú individual
export async function saveMenuItem(item) {
  try {
    // Validar que el item sea un objeto y tenga id
    if (!item || typeof item !== 'object') {
      throw new Error('El item no es un objeto válido');
    }
    
    if (!item.id) {
      item.id = Date.now() + Math.random().toString(36).substring(2, 10);
    }
    
    // Si tiene imagen y es un string largo, procesarla
    if (item.image && typeof item.image === 'string' && item.image.length > 0 && !item.hasStoredImage) {
      try {
        await saveMenuImage(item.id, item.image);
        item.image = null;
        item.hasStoredImage = true;
      } catch (imageError) {
        console.warn('Error al guardar imagen, continuando sin imagen:', imageError);
        item.image = null;
        item.hasStoredImage = false;
      }
    }
    
    // Guardar el item en la base de datos
    const db = await openDatabase();
    const transaction = db.transaction([MENU_STORE], 'readwrite');
    const store = transaction.objectStore(MENU_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error('Error al guardar elemento del menú:', error);
    throw error;
  }
}