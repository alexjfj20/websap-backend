const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();

// Configuración de CORS para producción
const corsOptions = {
  origin: ['https://websap.vercel.app', 'https://websap.vercel.app/*'],
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
    password: process.env.DB_PASSWORD || '!qfLD@C9{*$c',
    database: process.env.DB_NAME || 'xpprgktm_websap',
    port: process.env.DB_PORT || 3306,
    ssl: false,
    connectTimeout: 10000,
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  console.log('⚙️ Configuración de conexión DB:');
  console.log('- Host:', dbConfig.host);
  console.log('- Database:', dbConfig.database);
  console.log('- Usuario:', dbConfig.user);
  console.log('- Puerto:', dbConfig.port);

  connection = mysql.createPool(dbConfig);

  connection.getConnection((err, conn) => {
    if (err) {
      console.error('Error conectando a la base de datos:', err);
      setTimeout(connectToDatabase, 5000);
      return;
    }
    console.log('✅ Conexión a la base de datos establecida');
    conn.release();
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
      'SELECT * FROM menus WHERE share_id = ?',
      [id],
      (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        if (results.length > 0) {
          resolve(results[0]);
        } else {
          // Si no se encuentra por share_id, intentamos por id
          connection.query(
            'SELECT * FROM menus WHERE id = ?',
            [id],
            (error, results) => {
              if (error) {
                reject(error);
                return;
              }
              resolve(results[0] || null);
            }
          );
        }
      }
    );
  });
};

// Rutas de API
app.get('/api/menus/:id', async (req, res) => {
  try {
    const menu = await buscarMenu(req.params.id);
    if (!menu) {
      return res.status(404).json({ error: 'Menú no encontrado' });
    }
    res.json(menu);
  } catch (error) {
    console.error('Error al buscar menú:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
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

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT} (${process.env.NODE_ENV || 'production'})`);
});
