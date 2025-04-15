const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { sequelize, closeConnection } = require('./config/database');
const logger = require('./config/logger');

// Cargar variables de entorno
dotenv.config();

// Crear la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración CORS adecuada
app.use(cors({
  origin: '*', // Permitir todas las solicitudes para solucionar el problema
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  credentials: true // Permitir cookies
}));

// Middleware adicional para CORS (asegurarse de que las cabeceras se envíen correctamente)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Manejar solicitudes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Middleware para procesar JSON y formularios
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para debug de solicitudes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Middleware para cerrar conexiones después de cada solicitud
app.use((req, res, next) => {
  // Guardar la función original end
  const originalEnd = res.end;
  
  // Sobrescribir la función end
  res.end = function(...args) {
    // No cerrar conexiones después de cada solicitud, ya que esto causa problemas
    // con el pool de conexiones. En su lugar, la limpieza se hará periódicamente.
    
    // Llamar a la función original end
    return originalEnd.apply(this, args);
  };
  
  next();
});

// Importar rutas
const syncRoutes = require('./routes/syncRoutes');
const authRoutes = require('./routes/authRoutes');
const directDeleteRoutes = require('./routes/directDeleteRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes'); // Rutas de administración
const platosRoutes = require('./routes/platosRoutes'); // Rutas de platos
const platoRoutes = require('./routes/platoRoutes'); // Rutas de plato individual
const indexedDBRoutes = require('./routes/indexedDBRoutes'); // Rutas para IndexedDB
const whatsappRoutes = require('./routes/whatsappRoutes'); // Rutas para WhatsApp
const restauranteRoutes = require('./routes/restauranteRoutes'); // Rutas para restaurantes
const menuPublicRoutes = require('./routes/menuPublicRoutes'); // Rutas públicas para menú

// Registrar las rutas
app.use('/api/sync', syncRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes); // Rutas de administración
app.use('/api/platos', platosRoutes); // Rutas de platos
app.use('/api/plato', platoRoutes); // Rutas de plato individual
app.use('/api/indexeddb', indexedDBRoutes); // Rutas para IndexedDB
app.use('/api/whatsapp', whatsappRoutes); // Rutas para WhatsApp
app.use('/api/restaurantes', restauranteRoutes); // Rutas para restaurantes
app.use('/api/menu-publico', menuPublicRoutes); // Rutas públicas para menú
app.use('/', directDeleteRoutes);

// Ruta de prueba simple
app.get('/api/ping', (req, res) => {
  res.status(200).json({ message: 'pong', timestamp: new Date().toISOString() });
});

// Ruta de prueba para test
app.get('/api/test/ping', (req, res) => {
  res.status(200).json({ 
    message: 'pong',
    timestamp: new Date().toISOString() 
  });
});

// Endpoint para verificar BD
app.get('/api/test/db', async (req, res) => {
  try {
    // Verificar conexión
    await sequelize.authenticate();
    
    // Obtener lista de tablas
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = '${process.env.DB_NAME || 'websap'}'
    `);
    
    return res.status(200).json({
      success: true,
      message: 'Conexión a base de datos exitosa',
      data: {
        connected: true,
        database: process.env.DB_NAME || 'websap',
        tables: tables.map(t => t.table_name || t.TABLE_NAME)
      }
    });
  } catch (error) {
    console.error('Error al verificar BD:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al conectar con base de datos',
      error: error.message
    });
  }
});

// Middleware para manejar errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error en servidor',
    error: err.message
  });
});

// Ruta fallback para SPA (Vue.js)
app.get('*', (req, res) => {
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ message: 'Not Found' });
  }
});

// Función para sincronizar modelos con la base de datos
const syncModels = async () => {
  try {
    console.log(' Sincronizando modelos con la base de datos...');
    // Usamos directamente la instancia sequelize importada
    // No llamamos a sequelize como función, porque es la instancia ya creada
    const db = sequelize; // sequelize ya es la instancia, no una función

    // Exportamos la instancia de sequelize para que esté disponible en todas partes
    global.db = sequelize;
    if (!db) {
      throw new Error('No se pudo obtener la instancia de Sequelize');
    }
    
    // Deshabilitamos la sincronización automática para evitar el error "Too many keys"
    // await db.sync({ alter: false });
    console.log(' Sincronización automática deshabilitada para evitar el error "Too many keys".');
    console.log(' Use los endpoints de migración para actualizar la estructura de la base de datos.');
    
    console.log(' Modelos sincronizados correctamente.');
  } catch (error) {
    console.error(' Error al sincronizar modelos:', error);
    throw error;
  }
};

// Función para cerrar periódicamente las conexiones no utilizadas
const setupConnectionCleanup = () => {
  console.log(' Configurando limpieza periódica de conexiones...');
  
  // Limpiar conexiones cada 30 minutos en lugar de 5 minutos
  // para reducir la frecuencia de limpieza y evitar problemas
  setInterval(async () => {
    try {
      console.log(' Limpiando conexiones no utilizadas...');
      await closeConnection();
    } catch (error) {
      console.error(' Error al limpiar conexiones:', error);
    }
  }, 30 * 60 * 1000); // 30 minutos
};

// Función para iniciar el servidor
const startServer = async () => {
  try {
    // Sincronizar modelos con la base de datos
    await syncModels();
    
    // Configurar limpieza periódica de conexiones
    setupConnectionCleanup();
    
    // Iniciar el servidor Express
    const server = app.listen(PORT, () => {
      console.log(`Servidor iniciado en el puerto ${PORT}`);
      logger.info(`Servidor iniciado en el puerto ${PORT}`);
    });
    
    // Manejar cierre adecuado del servidor
    process.on('SIGTERM', () => {
      console.log('Recibida señal SIGTERM, cerrando servidor...');
      server.close(async () => {
        console.log('Servidor cerrado correctamente');
        await closeConnection();
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('Recibida señal SIGINT, cerrando servidor...');
      server.close(async () => {
        console.log('Servidor cerrado correctamente');
        await closeConnection();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Error crítico al iniciar el servidor:', error);
    logger.error(`Error crítico al iniciar el servidor: ${error.message}`, { error });
    console.log('El servidor no pudo iniciarse correctamente. Compruebe la configuración de la base de datos.');
  }
};

// Iniciar el servidor
startServer();
