const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { sequelize, closeConnection } = require('./config/database');
const mysql = require('mysql2/promise');

// Cargar variables de entorno
dotenv.config();

// Crear la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración CORS adecuada
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://allseo.xyz']
  : ['http://localhost:5173', 'http://localhost:3000', '*'];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origen (como desde Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS policy: This origin is not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Middleware para procesar JSON y formularios
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para debug de solicitudes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
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
const healthRoutes = require('./routes/healthRoutes'); // Rutas para verificar salud del sistema

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
app.use('/api/health', healthRoutes); // Rutas para verificar salud del sistema
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

// Función para crear la tabla notificaciones si no existe
const createNotificacionesTable = async () => {
  try {
    console.log(' 🔄 Verificando tabla notificaciones...');
    
    // Configuración de la conexión a la base de datos
    const dbConfig = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS || process.env.DB_PASSWORD, // Usar DB_PASS o DB_PASSWORD
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };
    
    // Crear conexión
    const connection = await mysql.createConnection(dbConfig);
    
    // Verificar si la tabla ya existe
    const [checkTableResult] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'notificaciones'
    `);
    
    if (checkTableResult && checkTableResult.length > 0) {
      console.log(' ✅ La tabla notificaciones ya existe');
    } else {
      // Crear la tabla notificaciones
      console.log(' 🔄 Creando tabla notificaciones...');
      await connection.query(`
        CREATE TABLE notificaciones (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tipo VARCHAR(50) NOT NULL,
          mensaje TEXT NOT NULL,
          datos TEXT,
          leido TINYINT(1) DEFAULT 0,
          usuario_id INT,
          creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX (tipo),
          INDEX (usuario_id),
          INDEX (leido),
          CONSTRAINT fk_notificaciones_usuario
            FOREIGN KEY (usuario_id) 
            REFERENCES usuarios(id)
            ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      
      console.log(' ✅ Tabla notificaciones creada correctamente');
    }
    
    // Cerrar la conexión
    await connection.end();
    
  } catch (error) {
    console.error(' ❌ Error durante la creación de la tabla notificaciones:', error);
    // No lanzamos el error para permitir que el servidor continúe funcionando
  }
};

// Función para sincronizar modelos con la base de datos
const syncModels = async () => {
  try {
    console.log(' Sincronizando modelos con la base de datos...');
    // Cambiamos a sync() sin alter para evitar el error "Too many keys"
    const db = sequelize();
    if (!db) {
      throw new Error('No se pudo obtener la instancia de Sequelize');
    }

    // Deshabilitamos la sincronización automática para evitar el error "Too many keys"
    // await db.sync({ alter: false });
    console.log(' Sincronización automática deshabilitada para evitar el error "Too many keys".');
    console.log(' Use los endpoints de migración para actualizar la estructura de la base de datos.');

    // Crear tabla notificaciones si no existe
    await createNotificacionesTable();

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
    app.listen(PORT, () => {
      console.log(` Servidor ejecutándose en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error crítico al iniciar el servidor:', error);
    console.log('El servidor no pudo iniciarse correctamente. Compruebe la configuración de la base de datos.');
  }
};

// Iniciar el servidor
startServer();
