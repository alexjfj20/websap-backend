// Servidor principal de la aplicación
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Crear la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas básicas
app.get('/', (req, res) => {
  res.json({ message: 'API de WebSAP Backend funcionando' });
});

// Importar y usar rutas de la API
try {
  const apiRoutes = require('./src/server/routes/api');
  app.use('/api', apiRoutes);
} catch (error) {
  console.error('Error al cargar las rutas de la API:', error);
  // Ruta de contingencia
  app.use('/api', (req, res) => {
    res.status(500).json({ error: 'Error al cargar las rutas de la API' });
  });
}

// Manejador de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});