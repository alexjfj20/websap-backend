import { getBusinessInfo, compressImage, checkItemAvailability } from './storageService';

const DB_NAME = 'websapDatabase';
const DB_VERSION = 3; // Debe coincidir con el resto de servicios
const SHARED_MENU_STORE = 'sharedMenus';
const IMAGE_STORE = 'menuImages';

// Abrir la conexión a la base de datos
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
        
        if (!existingStores.includes(SHARED_MENU_STORE)) {
          console.error(`El almacén ${SHARED_MENU_STORE} no existe en la base de datos`);
          reject(new Error(`El almacén ${SHARED_MENU_STORE} no existe en la base de datos`));
          return;
        }
        
        resolve(db);
      };
      
      request.onupgradeneeded = (event) => {
        console.log("Actualizando estructura de la base de datos a versión:", event.newVersion);
        const db = event.target.result;
        
        // Crear almacén para menús compartidos si no existe
        if (!db.objectStoreNames.contains(SHARED_MENU_STORE)) {
          console.log('Creando almacén:', SHARED_MENU_STORE);
          db.createObjectStore(SHARED_MENU_STORE, { keyPath: 'id' });
        }
        
        // Crear almacén para imágenes si no existe
        if (!db.objectStoreNames.contains(IMAGE_STORE)) {
          console.log('Creando almacén:', IMAGE_STORE);
          db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
        }
      };
    } catch (error) {
      console.error("Error crítico en IndexedDB:", error);
      reject(error);
    }
  });
}

/**
 * Genera un ID único para un menú
 * @returns {string} Un ID único
 */
function generateMenuId() {
  return Math.random().toString(36).substring(2, 10) + 
         Math.random().toString(36).substring(2, 10);
}

/**
 * Guarda un menú compartido y devuelve su ID
 * @param {Array} menuItems - Elementos del menú a guardar
 * @returns {Promise<String>} - ID del menú compartido
 */
export async function saveMenu(menuItems) {
  try {
    // Generar un ID único para el menú compartido
    const menuId = generateMenuId();
    
    // Obtener información del negocio para incluirla en el menú compartido
    const businessInfo = await getBusinessInfo();
    
    // Preprocesar los elementos del menú - comprimir imágenes y normalizar isSpecial
    const processedItems = await Promise.all(menuItems.map(async (item) => {
      const processedItem = { ...item };
      processedItem.isSpecial = Boolean(item.isSpecial);
      console.log(`[saveMenu] Guardando ${item.name} con isSpecial=${processedItem.isSpecial}`);
      
      // Comprimir la imagen si existe
      if (processedItem.image && typeof processedItem.image === 'string' && processedItem.image.length > 0) {
        try {
          // Usar una calidad más baja para compartir
          processedItem.image = await compressImage(processedItem.image, 400, 300, 0.5);
        } catch (err) {
          console.warn('Error al comprimir imagen:', err);
          processedItem.image = null;
        }
      }
      
      return processedItem;
    }));
    
    // Crear objeto del menú con información del negocio incluida
    const menuData = {
      id: menuId,
      items: processedItems,
      businessInfo: businessInfo, // Incluir la información del negocio (con datos de pago)
      createdAt: new Date().toISOString()
    };
    
    // Verificar tamaño del objeto
    try {
      const jsonSize = JSON.stringify(menuData).length / (1024 * 1024); // Tamaño en MB
      console.log(`Tamaño del menú a guardar: ${jsonSize.toFixed(2)} MB`);
      
      if (jsonSize > 50) {
        throw new Error(`El menú es demasiado grande (${jsonSize.toFixed(2)} MB). Reduce el tamaño de las imágenes.`);
      }
    } catch (error) {
      console.error('Error al verificar tamaño del menú:', error);
      throw new Error('Error al verificar tamaño del menú');
    }
    
    // Guardar en IndexedDB
    const db = await openDatabase();
    const transaction = db.transaction([SHARED_MENU_STORE], 'readwrite');
    const store = transaction.objectStore(SHARED_MENU_STORE);
    
    await new Promise((resolve, reject) => {
      const request = store.put(menuData);
      
      request.onsuccess = () => {
        console.log(`Menú guardado exitosamente con ID: ${menuId}`);
        resolve();
      };
      
      request.onerror = (e) => {
        console.error('Error al guardar el menú:', e.target.error);
        reject(e.target.error);
      };
    });
    
    // Añadir logs de depuración
    console.log('[saveMenu] Items a guardar:', menuItems.length);
    console.log('[saveMenu] Items especiales:', menuItems.filter(item => item.isSpecial).length);
    console.log('[saveMenu] Items regulares:', menuItems.filter(item => !item.isSpecial).length);
    
    // Sincronizar información del negocio con el backend
    await syncBusinessInfoWithBackend();
    
    return menuId;
  } catch (error) {
    console.error('Error al guardar el menú compartido:', error);
    throw error;
  }
}

/**
 * Obtiene un menú compartido por su ID
 * @param {String} menuId - ID del menú compartido
 * @returns {Promise<Object>} - Datos del menú compartido
 */
export async function getSharedMenu(menuId) {
  try {
    console.log(`Intentando recuperar menú con ID: ${menuId}`);
    
    // Verificar que tenemos un ID válido
    if (!menuId) {
      console.error('ID de menú no proporcionado');
      return null;
    }

    // Intentar primero recuperar el menú desde IndexedDB como respaldo
    let menuData = null;
    try {
      const menuUtils = await import('./menuUtils');
      const localMenu = await menuUtils.getMenuFromIndexedDB(menuId);
      if (localMenu && localMenu.items && localMenu.items.length > 0) {
        console.log('Menú recuperado desde IndexedDB:', localMenu);
        menuData = localMenu;
      }
    } catch (localError) {
      console.warn('No se pudo obtener el menú desde IndexedDB:', localError);
    }

    // Si no hay datos locales o queremos asegurarnos de tener la versión más reciente,
    // intentamos obtener el menú desde el servidor
    if (!menuData || !menuData.items || menuData.items.length === 0) {
      console.log(`Obteniendo menú desde el servidor con ID: ${menuId}`);
      
      try {
        // Importamos apiService usando import dinámico para evitar problemas de dependencia circular
        const apiService = await import('./apiService');
        
        // Hacemos la petición al servidor para obtener el menú
        const response = await apiService.default.get(`/platos/menu/${menuId}`);
        
        if (response && response.success && response.data) {
          console.log('Menú recuperado desde el servidor:', response.data);
          menuData = response.data;
        } else {
          console.warn('No se pudo obtener el menú desde el servidor:', response);
          
          // Si no pudimos obtener el menú desde el servidor y tenemos datos locales, usamos los datos locales
          if (!menuData) {
            throw new Error('No se pudo obtener el menú');
          }
        }
      } catch (serverError) {
        console.error('Error al obtener el menú desde el servidor:', serverError);
        
        // Si no pudimos obtener el menú desde el servidor y no tenemos datos locales, intentamos obtenerlo desde la caché
        if (!menuData) {
          // Intentar recuperar de localStorage como último recurso
          try {
            const cachedMenu = localStorage.getItem(`menu_${menuId}`);
            if (cachedMenu) {
              menuData = JSON.parse(cachedMenu);
              console.log('Menú recuperado desde localStorage:', menuData);
            } else {
              throw new Error('No se encontró el menú en la caché');
            }
          } catch (cacheError) {
            console.error('Error al recuperar menú desde la caché:', cacheError);
            throw new Error('No se pudo obtener el menú');
          }
        }
      }
    }
    
    // Si el menú no tiene información de negocio, intentar obtenerla
    if (menuData && !menuData.businessInfo) {
      try {
        const businessInfo = await getBusinessInfo();
        menuData.businessInfo = businessInfo;
      } catch (businessError) {
        console.warn('No se pudo obtener información del negocio:', businessError);
        // Usar información por defecto si no se puede obtener
        menuData.businessInfo = {
          name: 'Restaurante WebSAP',
          description: 'Deliciosa comida para todos los gustos',
          contact: 'info@websap.com',
          address: 'Calle Principal #123',
          logo: null,
          paymentInfo: {
            qrImage: null,
            qrTitle: 'Escanea para pagar',
            nequiNumber: null,
            nequiImage: null,
            bankInfo: 'Banco XYZ - Cuenta 123456789',
            otherPaymentMethods: 'Aceptamos efectivo y tarjetas'
          }
        };
      }
    }
    
    // Asegurarse de que businessInfo siempre tenga un objeto paymentInfo
    if (menuData && menuData.businessInfo && !menuData.businessInfo.paymentInfo) {
      menuData.businessInfo.paymentInfo = {
        qrImage: null,
        qrTitle: 'Escanea para pagar',
        nequiNumber: null,
        nequiImage: null,
        bankInfo: 'Banco XYZ - Cuenta 123456789',
        otherPaymentMethods: 'Aceptamos efectivo y tarjetas'
      };
    }
    
    // Guardar en localStorage para tener un respaldo
    try {
      localStorage.setItem(`menu_${menuId}`, JSON.stringify(menuData));
    } catch (saveError) {
      console.warn('No se pudo guardar el menú en localStorage:', saveError);
    }
    
    // Añadir logs de depuración con verificaciones de seguridad
    console.log('[getSharedMenu] Menú recuperado:', menuData);
    
    // Usar el operador de encadenamiento opcional para evitar errores
    const specialItems = menuData?.items?.filter(i => i.isSpecial) || [];
    const regularItems = menuData?.items?.filter(i => !i.isSpecial) || [];
    
    console.log('[getSharedMenu] Items especiales:', specialItems.length);
    console.log('[getSharedMenu] Items regulares:', regularItems.length);
    
    return menuData;
  } catch (error) {
    console.error('Error al obtener el menú compartido:', error);
    throw error;
  }
}

/**
 * Alias para getSharedMenu para mantener compatibilidad con código existente
 * @param {String} menuId - ID del menú compartido
 * @returns {Promise<Object>} - Datos del menú compartido
 */
export async function getMenu(menuId) {
  console.log('Intentando recuperar menú con ID:', menuId);
  try {
    const db = await openDatabase();
    const tx = db.transaction('sharedMenus', 'readonly');
    const store = tx.objectStore('sharedMenus');
    
    // Obtener el menú de la base de datos
    const request = store.get(menuId);
    const result = await new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log('Resultado de búsqueda del menú:', request.result);
        resolve(request.result);
      };
      
      request.onerror = (e) => {
        console.error('Error al recuperar el menú:', e.target.error);
        reject(e.target.error);
      };
    });
    
    // Verificar si se encontró el menú
    if (!result) {
      console.warn(`No se encontró menú con ID: ${menuId}`);
      return null;
    }
    
    // Verificar si el menú tiene items y es un array
    if (result && result.items && Array.isArray(result.items)) {
      console.log('[menuService] Procesando items en getMenu()');
      
      // Procesar cada item para normalizar isSpecial
      const processedItems = result.items.map(item => {
        // Si isSpecial no existe, asignar false por defecto
        if (item.isSpecial === undefined) {
          console.log(`[menuService] Item ${item.name || 'sin nombre'} sin propiedad isSpecial, asignando false`);
          return { ...item, isSpecial: false };
        }
        
        // Normalizar isSpecial a un valor booleano
        const normalizedIsSpecial = 
          item.isSpecial === true || 
          item.isSpecial === 'true' || 
          item.isSpecial === 1 || 
          item.isSpecial === '1';
        
        if (typeof item.isSpecial !== 'boolean') {
          console.log(`[menuService] Normalizando isSpecial para ${item.name}: ${item.isSpecial} (${typeof item.isSpecial}) → ${normalizedIsSpecial}`);
        }
        
        return { ...item, isSpecial: normalizedIsSpecial };
      });
      
      console.log(`[menuService] Procesados ${processedItems.length} items:`, 
        processedItems.map(i => ({ name: i.name, isSpecial: i.isSpecial })));
      
      // Devolver el objeto completo con los items procesados
      return {
        ...result,
        items: processedItems
      }; // Devuelve el objeto completo con los items procesados
    } else {
      console.warn('El menú no tiene items o no es un array:', result);
      
      // Si no tiene items, devolver el resultado tal cual
      return result;
    }
  } catch (error) {
    console.error('Error al obtener menú compartido:', error);
    throw error;
  }
}

/**
 * Guarda un menú compartido en IndexedDB
 * @param {Object} menuData - Datos del menú a guardar
 * @returns {Promise<void>}
 */
export async function saveSharedMenu(menuData) {
  try {
    if (!menuData || !menuData.id) {
      throw new Error('Datos de menú inválidos');
    }
    
    console.log(`Guardando menú compartido con ID: ${menuData.id}`);
    
    // Guardar en IndexedDB
    const db = await openDatabase();
    const transaction = db.transaction([SHARED_MENU_STORE], 'readwrite');
    const store = transaction.objectStore(SHARED_MENU_STORE);
    
    await new Promise((resolve, reject) => {
      const request = store.put(menuData);
      
      request.onsuccess = () => {
        console.log(`Menú compartido guardado exitosamente con ID: ${menuData.id}`);
        resolve();
      };
      
      request.onerror = (e) => {
        console.error('Error al guardar el menú compartido:', e.target.error);
        reject(e.target.error);
      };
    });
    
    console.log('[saveSharedMenu] Menú guardado en IndexedDB');
    
  } catch (error) {
    console.error('Error al guardar el menú compartido en IndexedDB:', error);
    throw error;
  }
}

/**
 * Limpia menús antiguos que ya no son necesarios
 * @returns {Promise<void>}
 */
export async function cleanOldMenus() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([SHARED_MENU_STORE], 'readwrite');
    const store = transaction.objectStore(SHARED_MENU_STORE);
    
    const now = new Date();
    const allMenus = await new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = (e) => {
        console.error('Error al obtener menús:', e.target.error);
        reject(e.target.error);
      };
    });
    
    // Eliminar menús más antiguos de 7 días
    const menusToDelete = allMenus.filter(menu => {
      const createdDate = new Date(menu.createdAt);
      const diff = now.getTime() - createdDate.getTime();
      const days = Math.ceil(diff / (1000 * 3600 * 24));
      return days > 7;
    });
    
    for (const menu of menusToDelete) {
      store.delete(menu.id);
    }
    
    console.log(`Se eliminaron ${menusToDelete.length} menús antiguos`);
  } catch (error) {
    console.error('Error al limpiar menús antiguos:', error);
  }
}

// Añadir después de getSharedMenu
export async function syncMenuAvailability(menuId) {
  try {
    const sharedMenu = await getSharedMenu(menuId);
    if (!sharedMenu || !sharedMenu.items) return null;

    // Actualizar la disponibilidad de cada item
    const updatedItems = await Promise.all(sharedMenu.items.map(async (item) => {
      const availability = await checkItemAvailability(item.id);
      return {
        ...item,
        availableQuantity: availability.quantity
      };
    }));

    // Actualizar el menú con las nuevas disponibilidades
    const db = await openDatabase();
    const transaction = db.transaction([SHARED_MENU_STORE], 'readwrite');
    const store = transaction.objectStore(SHARED_MENU_STORE);

    const updatedMenu = {
      ...sharedMenu,
      items: updatedItems,
      lastSync: new Date().toISOString()
    };

    await store.put(updatedMenu);
    return updatedMenu;
  } catch (error) {
    console.error('Error al sincronizar disponibilidad:', error);
    return null;
  }
}

/**
 * Sincroniza la información del negocio con el backend
 * @param {Object} businessInfo - Información del negocio a sincronizar
 * @returns {Promise<Object>} - Resultado de la sincronización
 */
export async function syncBusinessInfoWithBackend(businessInfo) {
  try {
    console.log('Sincronizando información del negocio con el backend:', businessInfo);
    
    // Verificar que tenemos información válida
    if (!businessInfo || Object.keys(businessInfo).length === 0) {
      console.error('No hay información del negocio para sincronizar');
      return { success: false, message: 'No hay información del negocio para sincronizar' };
    }
    
    // Importar apiService dinámicamente para evitar dependencias circulares
    const apiServiceModule = await import('./apiService');
    const apiService = apiServiceModule.default;
    
    // Asegurarse de que el token esté configurado
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token);
    }
    
    // Obtener el ID del restaurante del usuario actual
    const userResponse = await apiService.get('/auth/me');
    if (!userResponse || !userResponse.success || !userResponse.user || !userResponse.user.restaurante_id) {
      console.warn('No se pudo obtener el restaurante del usuario actual');
      return { success: false, message: 'No se pudo obtener el restaurante del usuario actual' };
    }
    
    const restauranteId = userResponse.user.restaurante_id;
    
    // Asegurarse de que paymentInfo sea un objeto válido
    const paymentInfo = businessInfo.paymentInfo || {
      qrImage: null,
      qrTitle: 'Escanea para pagar',
      nequiNumber: null,
      nequiImage: null,
      bankInfo: 'Banco XYZ - Cuenta 123456789',
      otherPaymentMethods: 'Aceptamos efectivo y tarjetas'
    };
    
    // Preparar los datos para actualizar el restaurante
    const restauranteData = {
      nombre: businessInfo.name || '',
      descripcion: businessInfo.description || '',
      direccion: businessInfo.address || '',
      telefono: businessInfo.contact || '',
      logo: businessInfo.logo || null,
      informacion_pago: JSON.stringify(paymentInfo)
    };
    
    console.log('Datos a enviar al backend:', restauranteData);
    
    // Actualizar el restaurante en el backend
    const response = await apiService.put(`/restaurantes/${restauranteId}`, restauranteData);
    
    if (response && response.success) {
      console.log('Información del negocio sincronizada con éxito');
      return { success: true, message: 'Información del negocio sincronizada con éxito' };
    } else {
      console.warn('Error al sincronizar información del negocio:', response);
      return { success: false, message: response.message || 'Error al sincronizar información del negocio' };
    }
  } catch (error) {
    console.error('Error al sincronizar información del negocio:', error);
    return { success: false, message: error.message || 'Error al sincronizar información del negocio' };
  }
}
