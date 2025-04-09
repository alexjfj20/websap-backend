/**
 * Controlador para endpoints de salud y estado del sistema
 */
const os = require('os');
const { sequelize } = require('../config/database');

/**
 * Obtiene información básica de estado del sistema
 */
const getHealthStatus = async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    let dbStatus = 'error';
    let dbMessage = 'No se pudo conectar a la base de datos';
    
    try {
      await sequelize.authenticate();
      dbStatus = 'ok';
      dbMessage = 'Conexión a base de datos establecida';
    } catch (dbError) {
      console.error('Error al verificar conexión a BD:', dbError);
    }
    
    // Información del sistema
    const systemInfo = {
      uptime: Math.floor(process.uptime()),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        usage: Math.round((1 - os.freemem() / os.totalmem()) * 100)
      },
      cpu: os.cpus().length,
      platform: os.platform(),
      hostname: os.hostname()
    };
    
    // Información del proceso Node.js
    const processInfo = {
      pid: process.pid,
      version: process.version,
      memoryUsage: process.memoryUsage()
    };
    
    // Responder con toda la información
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      database: {
        status: dbStatus,
        message: dbMessage
      },
      system: systemInfo,
      process: processInfo
    });
  } catch (error) {
    console.error('Error al obtener estado de salud:', error);
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Error al obtener estado de salud',
      error: error.message
    });
  }
};

/**
 * Endpoint simple para verificar que el servidor está en funcionamiento
 */
const ping = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getHealthStatus,
  ping
};
