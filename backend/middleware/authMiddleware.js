const jwt = require('jsonwebtoken');
const { models } = require('../models');

/**
 * Middleware para verificar la validez del token JWT
 */
exports.verifyToken = (req, res, next) => {
  const bearerHeader = req.headers.authorization;
  
  if (!bearerHeader) {
    console.log('Solicitud sin token de autorización:', req.method, req.originalUrl);
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. No se proporcionó token de autenticación.'
    });
  }
  
  try {
    // Extraer el token del header (formato: "Bearer TOKEN")
    const bearer = bearerHeader.split(' ');
    const token = bearer[1];
    
    if (!token) {
      console.log('Token no encontrado en el header de autorización');
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido. Utilice el formato "Bearer TOKEN".'
      });
    }
    
    // Verificar si es un token local (para desarrollo)
    if (token.startsWith('local_')) {
      console.log('Token local detectado, permitiendo acceso para desarrollo');
      // Para desarrollo, permitir acceso con tokens locales
      const userDataEncoded = token.substring(6); // Quitar 'local_'
      try {
        const userData = JSON.parse(atob(userDataEncoded));
        req.user = userData;
        
        // Verificar si el usuario está activo
        if (userData.activo === false) {
          console.log('Usuario desactivado intentando acceder:', userData.email);
          return res.status(403).json({
            success: false,
            message: 'Usuario desactivado. Contacte al administrador.'
          });
        }
        
        return next();
      } catch (e) {
        console.error('Error al decodificar token local:', e);
      }
    }
    
    // Verificar el token JWT
    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'websap_secret_key_muy_segura_2023'
      );
      
      // Añadir los datos del usuario al objeto de solicitud
      req.user = decoded;
      
      // Verificar si el usuario está activo
      if (decoded.activo === false) {
        console.log('Usuario desactivado intentando acceder:', decoded.email);
        return res.status(403).json({
          success: false,
          message: 'Usuario desactivado. Contacte al administrador.'
        });
      }
      
      next();
    } catch (error) {
      console.error('Error al verificar token:', error);
      
      // En modo desarrollo, permitir acceso con datos simulados
      if (process.env.NODE_ENV === 'development' || process.env.ALLOW_DEV_ACCESS === 'true') {
        console.log('Modo desarrollo: Permitiendo acceso a pesar del error de token');
        req.user = {
          id: 'dev_admin',
          nombre: 'Administrador',
          email: 'admin@example.com',
          rol: 'admin',
          activo: true
        };
        return next();
      }
      
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Error al verificar token:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado. Por favor, inicie sesión nuevamente.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Token inválido. Por favor, inicie sesión nuevamente.'
    });
  }
};

/**
 * Middleware para verificar roles de usuario
 * @param {string|Array} roles - Rol o roles permitidos
 */
exports.hasRole = (roles) => {
  return (req, res, next) => {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Usuario no autenticado.'
      });
    }
    
    // Convertir roles a array si es un string
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // Obtener roles del usuario (puede ser string o array)
    const userRoles = Array.isArray(req.user.roles) 
      ? req.user.roles 
      : [req.user.roles];
    
    // Verificar si el usuario tiene alguno de los roles permitidos
    const hasPermission = allowedRoles.some(role => 
      userRoles.includes(role)
    );
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. No tiene los permisos necesarios.'
      });
    }
    
    next();
  };
};
