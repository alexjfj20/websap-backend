// Entry point for Render deployment
const fs = require('fs');
const path = require('path');

// Mostrar información del entorno para diagnóstico
console.log('--- Información del entorno de despliegue ---');
console.log(`Directorio actual: ${__dirname}`);
console.log(`Archivos en el directorio raíz:`);
try {
  const files = fs.readdirSync(__dirname);
  console.log(files);
} catch (error) {
  console.error(`Error al listar archivos: ${error.message}`);
}

// Comprobar estructura de carpetas críticas
console.log('\n--- Verificando estructura de carpetas ---');
const criticalPaths = [
  'src/database',
  'src/server/routes'
];

criticalPaths.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${dir} existe`);
    try {
      const files = fs.readdirSync(fullPath);
      console.log(`   Archivos: ${files.join(', ')}`);
    } catch (error) {
      console.error(`   Error al listar archivos: ${error.message}`);
    }
  } else {
    console.error(`❌ ${dir} no existe`);
  }
});

// Check which main file exists and use that one
console.log('\n--- Buscando archivo principal ---');
const possibleMainFiles = ['server.js', 'index.js', 'app.js'];
let mainFile = null;

for (const file of possibleMainFiles) {
  if (fs.existsSync(path.join(__dirname, file))) {
    mainFile = file;
    console.log(`✅ Encontrado: ${file}`);
    break;
  }
}

if (mainFile) {
  console.log(`\n🚀 Iniciando servidor desde ${mainFile}...`);
  try {
    require(`./${mainFile}`);
    console.log('✅ Servidor iniciado correctamente');
  } catch (error) {
    console.error(`❌ Error al iniciar el servidor: ${error.message}`);
    console.error(error.stack);
    
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error(`\nMódulo no encontrado. Rutas de búsqueda de Node.js:`);
      console.error(module.paths);
    }
    
    process.exit(1);
  }
} else {
  console.error('\n❌ No se encontró ningún archivo principal (server.js, index.js, app.js)');
  process.exit(1);
}