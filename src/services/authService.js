import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Función para guardar token en localStorage
const saveToken = (token) => {
  localStorage.setItem('token', token);
};

// Función para obtener token de localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Función para eliminar token de localStorage
const removeToken = () => {
  localStorage.removeItem('token');
};

// Configurar Axios
const setupAxiosInterceptors = () => {
  // Interceptor de solicitudes
  axios.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  // Interceptor de respuestas
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // Si el error es 401, puede ser que el token expiró
      if (error.response && error.response.status === 401) {
        removeToken();
        // Redirigir a la página de login (esto debe ser manejado por el router)
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
};

// Inicializar interceptores
setupAxiosInterceptors();

// Función para iniciar sesión
async function login(email, password) {
  console.log('Intentando iniciar sesión con:', email);
  
  try {
    // Limpiar cualquier información de usuario anterior
    removeToken();
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    
    // Intentar iniciar sesión con el backend
    console.log('Enviando solicitud al backend:', `${API_URL}/auth/login`);
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      // No enviar cookies
      withCredentials: false,
      // Aumentar el timeout para evitar errores de conexión
      timeout: 10000
    });
    
    console.log('Respuesta del backend:', response.status, response.data);
    
    if (response.status === 200 && response.data.success) {
      console.log('Login exitoso con el backend');
      // Guardar token
      const token = response.data.data.token;
      saveToken(token);
      
      // Actualizar el token en el servicio API
      import('./apiService').then(apiService => {
        console.log('Actualizando token en apiService');
        apiService.default.setToken(token);
      });
      
      // Guardar información del usuario en localStorage
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      
      // Establecer explícitamente el estado de autenticación
      localStorage.setItem('isLoggedIn', 'true');
      
      return {
        success: true,
        user: response.data.data.user
      };
    } else {
      console.error('Respuesta inesperada del servidor:', response.data);
      throw new Error('Respuesta inesperada del servidor');
    }
  } catch (error) {
    // Verificar si el error es de red o del servidor
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('Error de respuesta del servidor:', error.response.status, error.response.data);
      
      // Verificar si es un error específico de usuario desactivado
      if (error.response.data && error.response.data.message) {
        // Si el mensaje contiene la palabra "desactivado", mostrar ese mensaje específico
        if (error.response.data.message.includes('desactivado')) {
          throw new Error(error.response.data.message);
        }
      }
    } else if (error.request) {
      // La solicitud se realizó pero no se recibió respuesta
      console.error('No se recibió respuesta del servidor:', error.request);
    } else {
      // Algo sucedió al configurar la solicitud
      console.error('Error al configurar la solicitud:', error.message);
    }
    
    console.log('Fallback a autenticación local...');
    
    // Datos de usuarios locales para desarrollo/pruebas
    const localUsers = [
      {
        id: 1,
        email: 'superadmin@example.com',
        password: '123456',
        nombre: 'Super Administrador',
        roles: ['Superadministrador']
      },
      {
        id: 2,
        email: 'admin@example.com',
        password: '123456',
        nombre: 'Administrador',
        roles: ['Administrador']
      },
      {
        id: 3,
        email: 'empleado@example.com',
        password: '123456',
        nombre: 'Empleado',
        roles: ['Empleado']
      },
      // Añadir el usuario alex para pruebas locales
      {
        id: 5,
        email: 'alex@gmail.com',
        password: 'password',
        nombre: 'alex',
        roles: ['Empleado']
      }
    ];
    
    // Buscar usuario local
    const user = localUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
      console.log('Login exitoso con usuario local:', user.email);
      // Si el usuario local es válido, establecer el estado de autenticación
      localStorage.setItem('isLoggedIn', 'true');
      
      // Crear un token local
      const localToken = `local_${btoa(JSON.stringify(user))}`;
      saveToken(localToken);
      
      // Actualizar el token en el servicio API
      import('./apiService').then(apiService => {
        console.log('Actualizando token en apiService (local)');
        apiService.default.setToken(localToken);
      });
      
      // Guardar usuario en localStorage
      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        roles: user.roles
      }));
      
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          roles: user.roles
        }
      };
    }
    
    // Si no se encontró usuario local
    throw new Error('Credenciales incorrectas');
  }
};

// Función para cerrar sesión
const logout = () => {
  removeToken();
  localStorage.removeItem('user');
  localStorage.removeItem('isLoggedIn');
};

// Función para verificar si el usuario está autenticado
const isAuthenticated = () => {
  const token = getToken();
  const isLoggedInFlag = localStorage.getItem('isLoggedIn') === 'true';
  return !!token && isLoggedInFlag;
};

// Función para obtener el usuario actual
const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.log('No hay usuario en localStorage');
      return null;
    }
    
    const user = JSON.parse(userStr);
    console.log('Usuario actual obtenido de localStorage:', user.email);
    return user;
  } catch (error) {
    console.error('Error al obtener el usuario actual:', error);
    return null;
  }
};

// Función para verificar si el usuario tiene un rol específico
const hasRole = (role) => {
  const user = getCurrentUser();
  return user && user.roles && user.roles.includes(role);
};

// Función para verificar si el usuario es administrador
const isAdmin = () => {
  return hasRole('Administrador') || hasRole('Superadministrador');
};

// Función para verificar si el usuario es superadministrador
const isSuperAdmin = () => {
  return hasRole('Superadministrador');
};

export {
  login,
  logout,
  isAuthenticated,
  getCurrentUser,
  hasRole,
  isAdmin,
  isSuperAdmin,
  getToken,
  removeToken
};
