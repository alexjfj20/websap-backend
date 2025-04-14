// Configuración CORS mejorada para el backend
const allowedOrigins = [
  'https://allseo.xyz',
  'http://allseo.xyz',
  'https://www.allseo.xyz',
  'https://allseo.xyz/websap',
  'http://allseo.xyz/websap',
  'http://localhost:8080',
  'http://localhost:3000',
  'https://websap-backend.onrender.com',
  'http://websap-backend.onrender.com',
  'https://webapp_backend.onrender.com',
  'http://webapp_backend.onrender.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como aplicaciones móviles o curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`Origen bloqueado por CORS: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 horas
};

module.exports = corsOptions;
