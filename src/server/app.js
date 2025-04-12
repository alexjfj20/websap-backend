const express = require('express');
const cors = require('cors');

const syncRouter = require('./routes/sync');

const app = express();

// Middlewares
app.use(express.json());  // 🔥 Necesario para leer JSON en POST
app.use(express.urlencoded({ extended: true })); // Manejo de datos en formularios
app.use(cors()); // Permitir solicitudes de otros dominios

// Rutas
app.use('/api/sync', syncRouter);

// Servir archivos estáticos (opcional)
app.use(express.static('public'));

// Puerto del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
});
