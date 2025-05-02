/**
 * Servicio para gestionar las operaciones administrativas
 */
import * as storageService from './storageService';
import apiService from './apiService';

// Lista local de usuarios para mantener estado entre llamadas
let localUsers = [];

/**
 * Obtiene estadísticas para el dashboard de administrador
 * @returns {Promise<Object>} Estadísticas del sistema
 */
export async function getDashboardStats() {
  try {
    // En desarrollo, devolver datos simulados pero con lógica para actualizarlos
    if (process.env.NODE_ENV === 'development') {
      // Obtener usuarios actuales para tener un conteo real
      const usersResponse = await getUsers();
      
      const userCount = (usersResponse && usersResponse.success && Array.isArray(usersResponse.data)) 
        ? usersResponse.data.length 
        : 45; // Valor por defecto si no podemos obtener el conteo real

      // Calcular usuarios activos/inactivos
      const activeUsers = usersResponse && usersResponse.success && Array.isArray(usersResponse.data)
        ? usersResponse.data.filter(user => user.estado === 'activo').length
        : Math.floor(userCount * 0.75); // Aproximadamente 75% activos por defecto
        
      const inactiveUsers = userCount - activeUsers;

      console.log(`Estadísticas actualizadas: ${userCount} usuarios totales (${activeUsers} activos, ${inactiveUsers} inactivos)`);

      return {
        success: true,
        data: {
          totalUsers: userCount,
          activeUsers: activeUsers,
          inactiveUsers: inactiveUsers,
          activePayments: 28,
          pendingPayments: 8,
          overduePayments: 3,
          totalIncome: 15750000,
          status: 'Normal',
          lastBackup: new Date().toISOString(),
          recentActivity: [
            // Añadir actividad reciente de creación de usuario si se ha creado uno recientemente
            {
              tipo: 'user_login',
              usuario_nombre: 'Admin',
              accion: 'inició sesión en el sistema',
              fecha: new Date().toISOString()
            },
            {
              tipo: 'system',
              usuario_nombre: 'Sistema',
              accion: 'realizó una sincronización de datos',
              fecha: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        }
      };
    }
    
    // En producción, hacer la llamada a la API real
    const response = await apiService.get('/admin/dashboard');
    return response;
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    
    // En caso de error, devolver datos simulados básicos
    return {
      success: true,
      data: {
        totalUsers: 45,
        activeUsers: 38,
        inactiveUsers: 7,
        activePayments: 28,
        pendingPayments: 8,
        overduePayments: 3,
        totalIncome: 15750000,
        status: 'Normal',
        lastBackup: new Date().toISOString(),
        recentActivity: [
          {
            tipo: 'system',
            usuario_nombre: 'Sistema',
            accion: 'inició en modo de respaldo',
            fecha: new Date().toISOString()
          }
        ]
      }
    };
  }
}

/**
 * Obtiene los elementos del menú
 * @returns {Promise<Object>} Lista de elementos del menú
 */
export async function getMenuItems() {
  try {
    // En desarrollo, simular llamada a la API
    if (process.env.NODE_ENV === 'development') {
      // Obtener datos del servicio de almacenamiento
      const menuItems = await storageService.getMenuItems();
      return {
        success: true,
        data: menuItems,
      };
    }
    
    // En producción, hacer la llamada a la API real
    const response = await apiService.get('/admin/menu-items');
    return response;
  } catch (error) {
    console.error('Error al obtener elementos del menú:', error);
    return {
      success: false,
      error: error.message || 'Error al obtener elementos del menú'
    };
  }
}

/**
 * Obtiene los elementos vendidos para el inventario
 * @returns {Promise<Object>} Lista de elementos vendidos
 */
export async function getSoldItems() {
  try {
    // En desarrollo, simular llamada a la API
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        data: [
          { id: 1, name: 'Hamburguesa Clásica', quantity: 45, price: 12000 },
          { id: 2, name: 'Pizza Margherita', quantity: 38, price: 18000 },
          { id: 3, name: 'Ensalada César', quantity: 22, price: 9000 },
          { id: 4, name: 'Pasta Carbonara', quantity: 30, price: 15000 },
          { id: 5, name: 'Sushi Variado', quantity: 15, price: 25000 }
        ]
      };
    }
    
    // En producción, hacer la llamada a la API real
    const response = await apiService.get('/admin/sold-items');
    return response;
  } catch (error) {
    console.error('Error al obtener elementos vendidos:', error);
    return {
      success: false,
      error: error.message || 'Error al obtener elementos vendidos'
    };
  }
}

/**
 * Obtiene los usuarios del sistema
 * @param {Object} options Opciones de filtrado y paginación
 * @returns {Promise<Array>} Lista de usuarios
 */
export async function getUsers(options = {}) {
  try {
    // Construir la URL con los parámetros de consulta
    let url = '/admin/users';
    const queryParams = [];
    
    if (options.searchTerm) {
      queryParams.push(`search=${encodeURIComponent(options.searchTerm)}`);
    }
    
    if (options.role) {
      queryParams.push(`role=${encodeURIComponent(options.role)}`);
    }
    
    if (options.status) {
      queryParams.push(`status=${encodeURIComponent(options.status)}`);
    }
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }
    
    console.log('Solicitando usuarios a la API:', url);
    
    // Realizar la petición a la API
    const response = await apiService.get(url);
    
    // Verificar si la respuesta es válida
    if (response && response.success) {
      console.log(`Recibidos ${response.data.length} usuarios de la API`);
      
      // Guardar los usuarios en la variable local para uso futuro
      localUsers = response.data;
      
      return {
        success: true,
        data: response.data
      };
    }
    
    throw new Error(response?.message || 'Error al obtener usuarios');
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    
    // Si hay un error, devolver los usuarios locales si existen
    if (localUsers.length > 0) {
      console.log('Usando usuarios en caché:', localUsers.length);
      return {
        success: true,
        data: localUsers
      };
    }
    
    // Si no hay datos en caché, mostrar error pero no usar datos simulados
    return {
      success: false,
      message: `Error al obtener usuarios: ${error.message}`,
      data: []
    };
  }
}

/**
 * Obtiene los roles disponibles en el sistema
 * @returns {Promise<Object>} Lista de roles
 */
export async function getRoles() {
  try {
    // Realizar la petición a la API
    const response = await apiService.get('/admin/roles');
    
    if (response && response.success) {
      return response;
    }
    
    throw new Error(response?.message || 'Error al obtener roles');
  } catch (error) {
    console.error('Error al obtener roles:', error);
    
    // En caso de error, devolver una lista básica de roles para mantener la funcionalidad
    return {
      success: false,
      message: error.message,
      data: [
        { id: 1, nombre: 'Superadministrador', descripcion: 'Control total del sistema' },
        { id: 2, nombre: 'Administrador', descripcion: 'Gestión de usuarios y configuración' },
        { id: 3, nombre: 'Empleado', descripcion: 'Operaciones básicas' }
      ]
    };
  }
}

/**
 * Crea un nuevo usuario
 * @param {Object} userData - Datos del nuevo usuario
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function createUser(userData) {
  try {
    // Validar datos mínimos
    if (!userData.nombre || !userData.email || !userData.password) {
      return {
        success: false,
        message: 'Faltan datos obligatorios'
      };
    }
    
    console.log('Enviando solicitud para crear usuario:', userData.email);
    
    // Realizar la petición a la API
    const response = await apiService.post('/admin/users', userData);
    
    if (response && response.success) {
      console.log('Usuario creado exitosamente:', response.data?.email);
      
      // Usar los datos devueltos por el backend
      const newUser = response.data || {
        id: Date.now(), // ID temporal si no hay uno real
        nombre: userData.nombre,
        email: userData.email,
        telefono: userData.telefono || '',
        roles: userData.roles,
        estado: 'activo',
        fecha_creacion: new Date().toISOString()
      };
      
      // Actualizar la lista local de usuarios
      localUsers = [newUser, ...localUsers];
      
      return {
        success: true,
        message: response.message || 'Usuario creado correctamente',
        data: newUser
      };
    }
    
    throw new Error(response?.message || 'Error al crear usuario');
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return {
      success: false,
      message: error.message || 'Error al crear usuario'
    };
  }
}

/**
 * Actualiza un usuario existente
 * @param {number} userId - ID del usuario a actualizar
 * @param {Object} userData - Nuevos datos del usuario
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function updateUser(userId, userData) {
  try {
    console.log(`Actualizando usuario ${userId}:`, userData);
    
    // Realizar la petición a la API
    const response = await apiService.put(`/admin/users/${userId}`, userData);
    
    if (response && response.success) {
      console.log('Usuario actualizado exitosamente');
      
      // Actualizar el usuario en la lista local
      const userIndex = localUsers.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        localUsers[userIndex] = {
          ...localUsers[userIndex],
          ...userData,
          // Mantener el email y el ID original
          id: userId,
          email: localUsers[userIndex].email
        };
      }
      
      return {
        success: true,
        message: response.message || 'Usuario actualizado correctamente',
        data: response.user
      };
    }
    
    throw new Error(response?.message || 'Error al actualizar usuario');
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return {
      success: false,
      message: error.message || 'Error al actualizar usuario'
    };
  }
}

/**
 * Cambia el estado de un usuario (activo/inactivo)
 * @param {number} userId - ID del usuario
 * @param {string} estado - Nuevo estado ('activo' o 'inactivo')
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function cambiarEstadoUsuario(userId, estado) {
  try {
    // Validar estado
    if (estado !== 'activo' && estado !== 'inactivo') {
      return {
        success: false,
        message: 'Estado inválido'
      };
    }
    
    console.log(`Cambiando estado de usuario ${userId} a ${estado}`);
    
    // Convertir estado a valor numérico para la API (1 = activo, 0 = inactivo)
    const activo = estado === 'activo' ? 1 : 0;
    
    // Realizar la petición a la API
    const response = await apiService.put(`/admin/users/${userId}`, { 
      activo 
    });
    
    if (response && response.success) {
      console.log(`Estado de usuario cambiado exitosamente a ${estado}`);
      
      // Actualizar el usuario en la lista local
      const userIndex = localUsers.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        localUsers[userIndex].estado = estado;
      }
      
      return {
        success: true,
        message: `Usuario ${estado === 'activo' ? 'activado' : 'desactivado'} correctamente`,
        data: {
          id: userId,
          estado
        }
      };
    }
    
    throw new Error(response?.message || `Error al ${estado === 'activo' ? 'activar' : 'desactivar'} usuario`);
  } catch (error) {
    console.error(`Error al cambiar estado de usuario a ${estado}:`, error);
    return {
      success: false,
      message: error.message || `Error al ${estado === 'activo' ? 'activar' : 'desactivar'} usuario`
    };
  }
}

/**
 * Elimina un usuario
 * @param {number} userId - ID del usuario a eliminar
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function deleteUser(userId) {
  try {
    console.log(`Eliminando usuario ${userId}`);
    
    // Realizar la petición a la API
    const response = await apiService.delete(`/admin/users/${userId}`);
    
    if (response && response.success) {
      console.log('Usuario eliminado exitosamente');
      
      // Eliminar el usuario de la lista local
      localUsers = localUsers.filter(u => u.id !== userId);
      
      return {
        success: true,
        message: response.message || 'Usuario eliminado correctamente'
      };
    }
    
    throw new Error(response?.message || 'Error al eliminar usuario');
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return {
      success: false,
      message: error.message || 'Error al eliminar usuario'
    };
  }
}

/**
 * Obtiene los registros del sistema
 * @returns {Promise<Object>} Lista de logs
 */
export async function getLogs() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: [
          {
            id: 1,
            timestamp: new Date().toISOString(),
            type: 'info',
            user: 'Admin',
            message: 'Inicio de sesión exitoso',
            details: { ip: '192.168.1.1', userAgent: 'Chrome/96.0' }
          },
          {
            id: 2,
            timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
            type: 'warning',
            user: 'Sistema',
            message: 'Intento de acceso fallido',
            details: { ip: '203.0.113.1', userAgent: 'Edge/96.0', attempts: 3 }
          },
          {
            id: 3,
            timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 horas atrás
            type: 'error',
            user: 'Sistema',
            message: 'Error en la creación de backup',
            details: { error: 'Espacio insuficiente', code: 'E0023' }
          },
          {
            id: 4,
            timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 día atrás
            type: 'success',
            user: 'Juan Pérez',
            message: 'Nuevo usuario creado',
            details: { newUser: 'carlos@ejemplo.com' }
          }
        ]
      });
    }, 500);
  });
}

/**
 * Descarga los registros del sistema en formato CSV
 * @returns {Promise<Object>} Resultado de la operación con datos CSV
 */
export async function downloadLogsCSV() {
  try {
    // Primero obtenemos los logs
    const logsResponse = await getLogs();
    
    if (!logsResponse.success || !Array.isArray(logsResponse.data)) {
      throw new Error('No se pudieron obtener los logs para descargar');
    }
    
    // Convertir los logs a formato CSV
    const logs = logsResponse.data;
    
    // Cabeceras del CSV
    const headers = ['ID', 'Fecha', 'Tipo', 'Usuario', 'Mensaje', 'Detalles'];
    
    // Filas de datos
    const rows = logs.map(log => [
      log.id || '',
      log.timestamp || '',
      log.type || '',
      log.user || 'Sistema',
      log.message || '',
      log.details ? JSON.stringify(log.details) : ''
    ]);
    
    // Combinar cabeceras y filas
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    return {
      success: true,
      data: csvContent,
      message: 'Logs descargados correctamente'
    };
  } catch (error) {
    console.error('Error al descargar logs en CSV:', error);
    return {
      success: false,
      message: error.message || 'Error al descargar logs'
    };
  }
}

/**
 * Obtiene un elemento del menú por su ID
 * @param {string} itemId - ID del elemento a obtener
 * @returns {Promise<Object>} Elemento del menú
 */
export async function getMenuItem(itemId) {
  try {
    // En desarrollo, usar el servicio de almacenamiento local
    if (process.env.NODE_ENV === 'development') {
      const menuItems = await storageService.getMenuItems();
      const item = menuItems.find(item => item.id === itemId);
      
      if (!item) {
        return {
          success: false,
          message: 'Elemento no encontrado'
        };
      }
      
      return {
        success: true,
        data: item
      };
    }
    
    // En producción, hacer la llamada a la API real
    const response = await apiService.get(`/admin/menu-items/${itemId}`);
    return response;
  } catch (error) {
    console.error(`Error al obtener elemento del menú con ID ${itemId}:`, error);
    throw error;
  }
}

/**
 * Actualiza el stock de un elemento del inventario
 * @param {string} itemId - ID del elemento a actualizar
 * @param {number} newStock - Nuevo valor de stock
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function updateItemStock(itemId, newStock) {
  try {
    // Realizar la petición a la API
    const response = await apiService.put(`/admin/menu-items/${itemId}/stock`, { stock: newStock });
    
    if (response && response.success) {
      return {
        success: true,
        message: 'Stock actualizado correctamente',
        data: response.data
      };
    }
    
    throw new Error(response?.message || 'Error al actualizar stock');
  } catch (error) {
    console.error('Error al actualizar stock:', error);
    return {
      success: false,
      message: error.message || 'Error al actualizar stock'
    };
  }
}

/**
 * Realiza un respaldo del sistema
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function createBackup() {
  try {
    // En desarrollo, simular respaldo
    if (process.env.NODE_ENV === 'development') {
      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const backupId = Date.now().toString();
      const backupDate = new Date().toISOString();
      
      console.log(`Respaldo creado: ${backupId} (${backupDate})`);
      
      return {
        success: true,
        message: 'Respaldo creado correctamente',
        data: {
          id: backupId,
          fecha: backupDate,
          tamaño: '2.3 MB',
          estado: 'Completado'
        }
      };
    }
    
    // En producción, hacer la llamada a la API real
    const response = await apiService.post('/admin/backups');
    return response;
  } catch (error) {
    console.error('Error al crear respaldo:', error);
    return {
      success: false,
      message: error.message || 'Error al crear respaldo'
    };
  }
}

/**
 * Obtiene la lista de respaldos
 * @returns {Promise<Object>} Lista de respaldos
 */
export async function getBackups() {
  try {
    // En desarrollo, devolver respaldos simulados
    if (process.env.NODE_ENV === 'development') {
      const now = Date.now();
      
      return {
        success: true,
        data: [
          {
            id: '1',
            fecha: new Date(now - 3600000).toISOString(), // 1 hora atrás
            tamaño: '2.3 MB',
            usuario: 'Admin',
            estado: 'Completado',
            tipo: 'Manual'
          },
          {
            id: '2',
            fecha: new Date(now - 86400000).toISOString(), // 1 día atrás
            tamaño: '2.1 MB',
            usuario: 'Sistema',
            estado: 'Completado',
            tipo: 'Automático'
          },
          {
            id: '3',
            fecha: new Date(now - 172800000).toISOString(), // 2 días atrás
            tamaño: '2.0 MB',
            usuario: 'Sistema',
            estado: 'Completado',
            tipo: 'Automático'
          }
        ]
      };
    }
    
    // En producción, hacer la llamada a la API real
    const response = await apiService.get('/admin/backups');
    return response;
  } catch (error) {
    console.error('Error al obtener respaldos:', error);
    return {
      success: false,
      message: error.message,
      data: []
    };
  }
}

/**
 * Restaura el sistema desde un respaldo
 * @param {string} backupId - ID del respaldo a restaurar
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function restoreBackup(backupId) {
  try {
    // En desarrollo, simular restauración
    if (process.env.NODE_ENV === 'development') {
      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(`Restauración desde respaldo ${backupId} completada`);
      
      return {
        success: true,
        message: 'Sistema restaurado correctamente'
      };
    }
    
    // En producción, hacer la llamada a la API real
    const response = await apiService.post(`/admin/backups/${backupId}/restore`);
    return response;
  } catch (error) {
    console.error('Error al restaurar desde respaldo:', error);
    return {
      success: false,
      message: error.message || 'Error al restaurar desde respaldo'
    };
  }
}

/**
 * Elimina un respaldo
 * @param {string} backupId - ID del respaldo a eliminar
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function deleteBackup(backupId) {
  try {
    // En desarrollo, simular eliminación
    if (process.env.NODE_ENV === 'development') {
      console.log(`Respaldo ${backupId} eliminado`);
      
      return {
        success: true,
        message: 'Respaldo eliminado correctamente'
      };
    }
    
    // En producción, hacer la llamada a la API real
    const response = await apiService.delete(`/admin/backups/${backupId}`);
    return response;
  } catch (error) {
    console.error('Error al eliminar respaldo:', error);
    return {
      success: false,
      message: error.message || 'Error al eliminar respaldo'
    };
  }
}
