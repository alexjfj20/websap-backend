const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta a la base de datos SQLite
const dbPath = path.join(__dirname, '../database.sqlite');

// ID del menú a verificar
const menuId = 'mp5ikae2iwfm1sk9';

// Conectar a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    return console.error('Error al conectar con la base de datos:', err.message);
  }
  console.log('Conexión exitosa a la base de datos SQLite.');
});

// Consulta para verificar el menuId
const query = `SELECT * FROM Restaurante WHERE enlace_compartido = ?`;

db.get(query, [menuId], (err, row) => {
  if (err) {
    console.error('Error al ejecutar la consulta:', err.message);
  } else if (row) {
    console.log('El menuId existe en la base de datos:', row);
  } else {
    console.log('El menuId no se encontró en la base de datos.');
  }

  // Cerrar la conexión a la base de datos
  db.close((closeErr) => {
    if (closeErr) {
      return console.error('Error al cerrar la conexión:', closeErr.message);
    }
    console.log('Conexión a la base de datos cerrada.');
  });
});
