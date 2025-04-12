const DB_NAME = 'websapDatabase';
const DB_VERSION = 3;

// Definir todos los almacenes necesarios
const REQUIRED_STORES = [
  { name: 'menuItems', keyPath: 'id' },
  { name: 'menuImages', keyPath: 'id' },
  { name: 'soldItems', keyPath: 'id' },
  { name: 'businessInfo', keyPath: 'id' },
  { name: 'users', keyPath: 'id' },
  { name: 'sharedMenus', keyPath: 'id' }
];

export async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        console.error('Error al abrir la base de datos:', event.target.error);
        reject(event.target.error);
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        console.log('Base de datos abierta correctamente, versión:', db.version);
        
        // Verificar que todos los almacenes existen
        const existingStores = Array.from(db.objectStoreNames);
        let allStoresExist = true;
        
        const missingStores = REQUIRED_STORES.filter(store => !existingStores.includes(store.name));
        
        if (missingStores.length > 0) {
          console.error('Faltan los siguientes almacenes:', missingStores.map(s => s.name).join(', '));
          allStoresExist = false;
          
          // Cerrar la conexión antes de intentar aumentar la versión
          db.close();
          
          // Incrementar la versión para forzar la creación de los almacenes faltantes
          const newVersion = DB_VERSION + 1;
          console.log(`Intentando actualizar a versión ${newVersion} para crear almacenes faltantes`);
          
          const updateRequest = indexedDB.open(DB_NAME, newVersion);
          
          updateRequest.onupgradeneeded = (event) => {
            const db = event.target.result;
            for (const store of missingStores) {
              if (!db.objectStoreNames.contains(store.name)) {
                db.createObjectStore(store.name, { keyPath: store.keyPath });
                console.log(`Almacén creado: ${store.name}`);
              }
            }
          };
          
          updateRequest.onerror = (err) => {
            console.error('Error al actualizar la base de datos:', err.target.error);
            reject(err.target.error);
          };
          
          updateRequest.onsuccess = () => {
            console.log('Base de datos actualizada correctamente con los nuevos almacenes');
            resolve();
          };
        } else {
          console.log('Todos los almacenes existen en la base de datos');
          resolve();
        }
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        for (const store of REQUIRED_STORES) {
          if (!db.objectStoreNames.contains(store.name)) {
            db.createObjectStore(store.name, { keyPath: store.keyPath });
            console.log(`Almacén creado: ${store.name}`);
          }
        }
      };
    } catch (error) {
      console.error('Error crítico al inicializar la base de datos:', error);
      reject(error);
    }
  });
}
