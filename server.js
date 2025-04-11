const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();

// Configuración de CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://allseo.xyz',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware básico
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Variable para almacenar la conexión
let connection = null;

// Función para conectar a la base de datos
const connectToDatabase = () => {
  const dbConfig = {
    host: process.env.DB_HOST || 'allseo.xyz',
    user: process.env.DB_USER || 'xpprgktm_websap_user',
    password: process.env.DB_PASS || process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'xpprgktm_websap',
    port: process.env.DB_PORT || 3306,
    ssl: {
      rejectUnauthorized: false
    }
  };

  console.log('⚙️ Configuración de conexión DB:');
  console.log('- Host:', dbConfig.host);
  console.log('- Database:', dbConfig.database);
  console.log('- Usuario:', dbConfig.user);
  console.log('- Puerto:', dbConfig.port);
  console.log('- SSL:', dbConfig.ssl ? 'Habilitado' : 'Deshabilitado');

  connection = mysql.createConnection(dbConfig);

  connection.connect((err) => {
    if (err) {
      console.error('Error conectando a la base de datos:', err);
      // Intentar reconectar en 5 segundos
      setTimeout(connectToDatabase, 5000);
      return;
    }
    console.log('✅ Conexión a la base de datos establecida');
  });

  connection.on('error', (err) => {
    console.error('Error en la conexión de la base de datos:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      connectToDatabase();
    }
  });
};

// Iniciar conexión a la base de datos
connectToDatabase();

// Middleware para log de solicitudes
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// Rutas básicas
app.get('/', (req, res) => {
  res.json({ message: 'Servidor funcionando' });
});

app.get('/api/ping', (req, res) => {
  res.send('pong');
});

app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(),
    db: connection ? connection.state : 'no connection',
    env: process.env.NODE_ENV
  });
});

// Función auxiliar para buscar menú
const buscarMenu = async (id) => {
  return new Promise((resolve, reject) => {
    if (!connection) {
      reject(new Error('No hay conexión a la base de datos'));
      return;
    }
    connection.query(
      'SELECT * FROM menus WHERE id = ? OR share_id = ?',
      [id, id],
      (error, results) => {
        if (error) {
          console.error('❌ Error en la consulta SQL:', error);
          reject(error);
        } else {
          console.log('📊 Resultados de la consulta:', results);
          resolve(results);
        }
      }
    );
  });
};

// Rutas para menús y platos
app.get('/api/platos/menu/:id', async (req, res) => {
  const menuId = req.params.id;
  console.log('🔍 Buscando menú con ID:', menuId);
  
  try {
    if (!connection) {
      throw new Error('No hay conexión a la base de datos');
    }
    const results = await buscarMenu(menuId);
    if (results.length === 0) {
      return res.status(404).json({ 
        error: 'Menú no encontrado',
        id: menuId,
        timestamp: new Date().toISOString()
      });
    }
    res.json(results[0]);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener menú',
      message: error.message
    });
  }
});

app.get('/api/platos/menu-enlace/:id', async (req, res) => {
  const menuId = req.params.id;
  console.log('🔍 Buscando menú compartido con ID:', menuId);
  
  try {
    const results = await buscarMenu(menuId);
    console.log('📊 Resultados de búsqueda compartida:', results);
    
    if (results.length === 0) {
      console.log('❌ Menú compartido no encontrado');
      return res.status(404).json({ 
        error: 'Menú compartido no encontrado',
        id: menuId,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('✅ Menú compartido encontrado:', results[0]);
    res.json(results[0]);
  } catch (error) {
    console.error('❌ Error al obtener menú compartido:', error);
    res.status(500).json({ 
      error: 'Error al obtener menú compartido',
      message: error.message
    });
  }
});

// Ruta para obtener información del negocio
app.get('/api/business/info', (req, res) => {
  if (!connection) {
    return res.status(503).json({ 
      error: 'Servicio no disponible',
      message: 'No hay conexión a la base de datos'
    });
  }

  connection.query(
    'SELECT * FROM business_info LIMIT 1',
    (error, results) => {
      if (error) {
        return res.status(500).json({ 
          error: 'Error al obtener información del negocio',
          message: error.message
        });
      }
      
      if (results.length === 0) {
        return res.json({});
      }
      
      res.json(results[0]);
    }
  );
});

// Middleware para manejar errores
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor iniciado en puerto ${PORT} (${process.env.NODE_ENV})`);
});