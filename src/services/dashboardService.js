// dashboardService.js - Servicio para obtener datos del dashboard
import apiConfig from '../config/apiConfig';
import { isOfflineMode } from '../utils/connectionHandler';

// Variable para almacenar el error específico
let lastDiagnosticError = null;

/**
 * Devuelve el último error diagnóstico registrado
 */
export const getDiagnosticError = () => {
  return lastDiagnosticError;
};

/**
 * Verifica la conectividad con el servidor API
 */
const checkApiConnectivity = async () => {
  try {
    const apiUrl = getApiUrl();
    console.log(`🔍 Verificando conectividad con API: ${apiUrl}`);
    
    // Usar AbortController para establecer un timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${apiUrl}/test/ping`, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
      mode: 'cors',
      credentials: 'omit'
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ Conexión API verificada correctamente');
      return true;
    } else {
      console.warn(`❌ API respondió con error: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error al verificar conectividad API:', 
      error.name === 'AbortError' ? 'Timeout' : error.message);
    return false;
  }
};

/**
 * Obtiene los datos del dashboard desde la API
 */
export const getDashboardData = async () => {
  try {
    lastDiagnosticError = null; // Resetear error diagnóstico
    
    // Verificar primero si estamos en modo offline
    if (isOfflineMode()) {
      console.log('📱 Modo offline: usando datos locales del dashboard');
      return getOfflineData();
    }
    
    // Verificar conectividad con el servidor API
    const isApiConnected = await checkApiConnectivity();
    if (!isApiConnected) {
      console.warn('🔌 API no disponible, usando datos locales');
      return getOfflineData() || getExampleData();
    }
    
    // Obtener la URL de API actualizada
    const apiUrl = getApiUrl();
    
    // Probar endpoints en orden de preferencia
    const endpoints = [
      '/admin/dashboard',
      '/dashboard/stats',
      '/admin/stats',
      '/stats/dashboard'
    ];
    
    let response = null;
    let endpointUsed = null;
    
    // Intentar cada endpoint hasta encontrar uno que funcione
    for (const endpoint of endpoints) {
      const url = `${apiUrl}${endpoint}`;
      console.log(`🔄 Intentando obtener datos desde: ${url}`);
      
      try {
        // Realizar la petición con timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'omit' // No enviar cookies
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`✅ Endpoint encontrado: ${endpoint}`);
          endpointUsed = endpoint;
          
          // Guardar el endpoint exitoso para futuras peticiones
          localStorage.setItem('dashboard_endpoint', endpoint);
          break;
        }
      } catch (endpointError) {
        console.warn(`❌ Endpoint ${endpoint} falló:`, endpointError.message);
      }
    }
    
    // Si no se encontró un endpoint que funcione
    if (!response || !response.ok) {
      lastDiagnosticError = {
        type: 'endpoint_not_found',
        message: 'No se pudo encontrar un endpoint válido para el dashboard',
        endpoints_tried: endpoints
      };
      throw new Error('No se pudo conectar a ningún endpoint de dashboard');
    }
    
    // Procesar la respuesta
    let data;
    try {
      data = await response.json();
      console.log('📊 Datos recibidos del servidor:', data);
    } catch (jsonError) {
      lastDiagnosticError = {
        type: 'json_parse_error',
        message: 'Error al parsear la respuesta JSON',
        error: jsonError.message
      };
      throw new Error(`Error al procesar la respuesta del servidor: ${jsonError.message}`);
    }
    
    // Validar la estructura de los datos recibidos
    if (!data || typeof data !== 'object') {
      lastDiagnosticError = {
        type: 'invalid_data_format',
        message: 'Los datos recibidos no tienen el formato esperado',
        data: data
      };
      throw new Error('Los datos recibidos no tienen el formato esperado');
    }
    
    // Adaptar datos según la estructura recibida
    const adaptedData = adaptDashboardData(data);
    
    // Guardar datos en IndexedDB para uso offline
    saveToIndexedDB(adaptedData);
    
    return adaptedData;
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    
    // Guardar diagnóstico del error
    if (!lastDiagnosticError) {
      lastDiagnosticError = {
        type: 'fetch_error',
        message: error.message,
        stack: error.stack
      };
    }
    
    // Intentar obtener datos desde IndexedDB
    const offlineData = await getOfflineData();
    if (offlineData) {
      console.log('🔄 Usando datos guardados en IndexedDB');
      return offlineData;
    }
    
    // Si no hay datos en IndexedDB, usar datos de ejemplo
    console.log('🔄 No hay datos en IndexedDB, usando datos de ejemplo');
    return getExampleData();
  }
};

/**
 * Obtiene la URL de la API para el dashboard
 */
const getApiUrl = () => {
  const storedApiUrl = localStorage.getItem('apiUrl');
  if (storedApiUrl) {
    return `${storedApiUrl}/api`;
  }
  return apiConfig.API_URL;
};

/**
 * Guarda los datos del dashboard en localStorage
 */
const saveToLocalStorage = (data) => {
  try {
    localStorage.setItem('dashboard_data', JSON.stringify(data));
    localStorage.setItem('dashboard_timestamp', Date.now().toString());
  } catch (error) {
    console.warn('No se pudieron guardar los datos en localStorage:', error);
  }
};

/**
 * Guarda los datos del dashboard en IndexedDB para acceso offline
 */
const saveToIndexedDB = async (data) => {
  try {
    // Obtener la instancia de IndexedDB
    const db = await openDB();
    
    // Crear una transacción para guardar los datos
    const tx = db.transaction('dashboard_data', 'readwrite');
    const store = tx.objectStore('dashboard_data');
    
    // Preparar el objeto a guardar
    const dashboardData = {
      id: 'dashboard_stats', // Usar un ID fijo para facilitar la recuperación
      data: data,
      timestamp: Date.now()
    };
    
    // Guardar los datos
    await store.put(dashboardData);
    
    // Completar la transacción
    await tx.done;
    
    console.log('✅ Datos guardados en IndexedDB correctamente');
    
    // También guardar en localStorage como respaldo
    saveToLocalStorage(data);
    
    return true;
  } catch (error) {
    console.error('❌ Error al guardar datos en IndexedDB:', error);
    
    // Si falla IndexedDB, intentar LocalStorage como fallback
    saveToLocalStorage(data);
    
    return false;
  }
};

/**
 * Recupera los datos del dashboard desde IndexedDB
 */
const getDataFromIndexedDB = async () => {
  try {
    // Obtener la instancia de IndexedDB
    const db = await openDB();
    
    // Crear una transacción para leer los datos
    const tx = db.transaction('dashboard_data', 'readonly');
    const store = tx.objectStore('dashboard_data');
    
    // Obtener los datos usando el ID fijo
    const dashboardData = await store.get('dashboard_stats');
    
    // Completar la transacción
    await tx.done;
    
    if (dashboardData) {
      console.log('✅ Datos recuperados de IndexedDB correctamente');
      
      // Verificar si los datos son recientes (menos de 24 horas)
      const isRecent = (Date.now() - dashboardData.timestamp) < 24 * 60 * 60 * 1000; // 24 horas
      
      if (!isRecent) {
        console.log('📊 Datos en IndexedDB son antiguos (>24h)');
      }
      
      return dashboardData.data;
    } else {
      console.log('⚠️ No se encontraron datos en IndexedDB');
      return null;
    }
  } catch (error) {
    console.error('❌ Error al recuperar datos de IndexedDB:', error);
    return null;
  }
};

/**
 * Abre la conexión con IndexedDB
 */
const openDB = () => {
  return new Promise((resolve, reject) => {
    // Comprobar si IndexedDB está disponible
    if (!window.indexedDB) {
      console.error('❌ IndexedDB no está soportado en este navegador');
      reject(new Error('IndexedDB no soportado'));
      return;
    }
    
    // Abrir la conexión con la base de datos
    const request = window.indexedDB.open('websap_dashboard', 1);
    
    // Manejar errores
    request.onerror = (event) => {
      console.error('❌ Error al abrir IndexedDB:', event.target.error);
      reject(event.target.error);
    };
    
    // Crear o actualizar esquema de la base de datos
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Crear el almacén para los datos del dashboard si no existe
      if (!db.objectStoreNames.contains('dashboard_data')) {
        const store = db.createObjectStore('dashboard_data', { keyPath: 'id' });
        console.log('✅ Almacén dashboard_data creado en IndexedDB');
      }
    };
    
    // Conexión exitosa
    request.onsuccess = (event) => {
      const db = event.target.result;
      console.log('✅ Conexión a IndexedDB establecida');
      resolve(db);
    };
  });
};

/**
 * Obtiene datos offline combinando IndexedDB y LocalStorage
 */
const getOfflineData = async () => {
  // Primero intentar obtener de IndexedDB por ser más robusto
  const indexedDBData = await getDataFromIndexedDB();
  if (indexedDBData) {
    return indexedDBData;
  }
  
  // Si no hay datos en IndexedDB, intentar LocalStorage
  try {
    const data = localStorage.getItem('dashboard_data');
    if (data) {
      console.log('📊 Usando datos de dashboard desde LocalStorage');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('❌ Error al leer datos de LocalStorage:', error);
  }
  
  // Si no hay datos en ningún almacén, devolver null
  return null;
};

/**
 * Genera datos de ejemplo para el dashboard
 */
const getExampleData = () => {
  console.log('📊 Generando datos de ejemplo para el dashboard');
  
  // Obtener fecha actual
  const today = new Date();
  
  // Generar fechas para los últimos 7 días
  const dates = Array(7).fill().map((_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i)); // Del día más antiguo al más reciente
    return date.toISOString().split('T')[0];
  });
  
  // Datos de ejemplo
  return {
    totalPlatos: 42,
    totalVentas: 2850,
    platosMasVendidos: [
      { nombre: 'Paella Valenciana', cantidad: 35 },
      { nombre: 'Tortilla Española', cantidad: 28 },
      { nombre: 'Croquetas de Jamón', cantidad: 22 },
      { nombre: 'Pulpo a la Gallega', cantidad: 18 },
      { nombre: 'Gazpacho', cantidad: 15 }
    ],
    ventasPorDia: dates.map(fecha => ({
      fecha,
      total: Math.floor(Math.random() * 600) + 200
    })),
    clientesFrecuentes: [
      { nombre: 'María García', telefono: '612345678', visitas: 8, totalGastado: 432 },
      { nombre: 'Juan Pérez', telefono: '623456789', visitas: 6, totalGastado: 318 },
      { nombre: 'Ana Rodríguez', telefono: '634567890', visitas: 5, totalGastado: 275 },
      { nombre: 'Luis Martínez', telefono: '645678901', visitas: 4, totalGastado: 216 }
    ]
  };
};

/**
 * Adapta diferentes formatos de datos al formato esperado por el dashboard
 */
const adaptDashboardData = (data) => {
  // Objeto para almacenar datos adaptados según el formato esperado
  const adapted = {
    totalPlatos: 0,
    totalVentas: 0,
    platosMasVendidos: [],
    ventasPorDia: [],
    clientesFrecuentes: []
  };
  
  // Verificar datos de total de platos
  if (typeof data.totalPlatos === 'number') {
    adapted.totalPlatos = data.totalPlatos;
  } else if (typeof data.total_platos === 'number') {
    adapted.totalPlatos = data.total_platos;
  } else if (typeof data.platos === 'number') {
    adapted.totalPlatos = data.platos;
  } else if (data.platos && Array.isArray(data.platos)) {
    adapted.totalPlatos = data.platos.length;
  }
  
  // Verificar datos de total de ventas
  if (typeof data.totalVentas === 'number') {
    adapted.totalVentas = data.totalVentas;
  } else if (typeof data.total_ventas === 'number') {
    adapted.totalVentas = data.total_ventas;
  } else if (typeof data.ventas === 'number') {
    adapted.totalVentas = data.ventas;
  }
  
  // Adaptar platos más vendidos
  if (Array.isArray(data.platosMasVendidos)) {
    adapted.platosMasVendidos = data.platosMasVendidos;
  } else if (Array.isArray(data.platos_mas_vendidos)) {
    adapted.platosMasVendidos = data.platos_mas_vendidos.map(plato => ({
      nombre: plato.nombre || plato.name,
      cantidad: plato.cantidad || plato.count || plato.total || 0
    }));
  } else if (Array.isArray(data.top_platos)) {
    adapted.platosMasVendidos = data.top_platos.map(plato => ({
      nombre: plato.nombre || plato.name,
      cantidad: plato.cantidad || plato.count || plato.total || 0
    }));
  }
  
  // Adaptar ventas por día
  if (Array.isArray(data.ventasPorDia)) {
    adapted.ventasPorDia = data.ventasPorDia;
  } else if (Array.isArray(data.ventas_por_dia)) {
    adapted.ventasPorDia = data.ventas_por_dia.map(venta => ({
      fecha: venta.fecha || venta.date,
      total: Number(venta.total || venta.amount || 0)
    }));
  } else if (data.ventas_diarias && typeof data.ventas_diarias === 'object') {
    // Si es un objeto con fechas como claves
    adapted.ventasPorDia = Object.entries(data.ventas_diarias).map(([fecha, total]) => ({
      fecha,
      total: Number(total)
    }));
  }
  
  // Adaptar clientes frecuentes
  if (Array.isArray(data.clientesFrecuentes)) {
    adapted.clientesFrecuentes = data.clientesFrecuentes;
  } else if (Array.isArray(data.clientes_frecuentes)) {
    adapted.clientesFrecuentes = data.clientes_frecuentes.map(cliente => ({
      nombre: cliente.nombre || cliente.name,
      telefono: cliente.telefono || cliente.phone,
      visitas: cliente.visitas || cliente.visits || 0,
      totalGastado: cliente.totalGastado || cliente.total || 0
    }));
  } else if (Array.isArray(data.top_clients)) {
    adapted.clientesFrecuentes = data.top_clients.map(cliente => ({
      nombre: cliente.nombre || cliente.name,
      telefono: cliente.telefono || cliente.phone,
      visitas: cliente.visitas || cliente.visits || 0,
      totalGastado: cliente.totalGastado || cliente.total || 0
    }));
  }
  
  console.log('🔄 Datos adaptados para el dashboard:', adapted);
  return adapted;
};