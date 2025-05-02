/**
 * Script de despliegue para WebSAP
 * Este script automatiza el proceso de compilación y preparación para producción
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ora = require('ora');

// Configuración
const config = {
  frontendDir: path.join(__dirname, 'frontend'),
  distDir: path.join(__dirname, 'frontend/dist'),
  publicDir: path.join(__dirname, 'public/websap'),
  backendFiles: [
    '.env',
    'package.json',
    'package-lock.json',
    'server.js',
    'render-server.js',
    'src'
  ]
};

// Función para ejecutar comandos y mostrar la salida
function runCommand(command, cwd = __dirname) {
  console.log(`\n> ${command}\n`);
  return execSync(command, { cwd, stdio: 'inherit' });
}

// Función para crear directorios si no existen
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Creado directorio: ${dir}`);
  }
}

// Función principal de despliegue
async function deploy() {
  console.log('\n=== INICIANDO DESPLIEGUE DE WEBSAP ===\n');
  
  try {
    // Paso 1: Compilar el frontend
    const spinnerBuild = ora('Compilando frontend...').start();
    try {
      process.chdir(config.frontendDir);
      execSync('npm run build', { stdio: 'pipe' });
      spinnerBuild.succeed('Frontend compilado con éxito');
    } catch (error) {
      spinnerBuild.fail('Error al compilar el frontend');
      console.error(error.toString());
      process.exit(1);
    }
    
    // Paso 2: Asegurar que existe el archivo .htaccess para el frontend
    const spinnerHtaccess = ora('Verificando archivo .htaccess...').start();
    const htaccessSrc = path.join(__dirname, '.htaccess');
    const htaccessDest = path.join(config.distDir, '.htaccess');
    
    if (fs.existsSync(htaccessSrc)) {
      fs.copyFileSync(htaccessSrc, htaccessDest);
      spinnerHtaccess.succeed('Archivo .htaccess copiado correctamente');
    } else {
      spinnerHtaccess.warn('No se encontró archivo .htaccess en la raíz. Creando uno básico...');
      
      const htaccessContent = `
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /websap/
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /websap/index.html [L]
</IfModule>
      `.trim();
      
      fs.writeFileSync(htaccessDest, htaccessContent);
      spinnerHtaccess.succeed('Archivo .htaccess básico creado');
    }
    
    // Paso 3: Asegurar que las rutas en index.html son correctas
    const spinnerIndex = ora('Verificando index.html...').start();
    const indexPath = path.join(config.distDir, 'index.html');
    let indexContent = fs.readFileSync(indexPath, 'utf-8');
    
    // Verificar si las rutas están correctamente configuradas
    if (!indexContent.includes('href="/websap/') && !indexContent.includes('src="/websap/')) {
      indexContent = indexContent
        .replace(/href="\//g, 'href="/websap/')
        .replace(/src="\//g, 'src="/websap/');
      
      fs.writeFileSync(indexPath, indexContent);
      spinnerIndex.succeed('Rutas en index.html corregidas');
    } else {
      spinnerIndex.succeed('Rutas en index.html están correctas');
    }
    
    // Paso 4: Mostrar resumen y próximos pasos
    console.log('\n=== DESPLIEGUE COMPLETADO ===\n');
    console.log('Los archivos del frontend están listos en:');
    console.log(`  ${config.distDir}`);
    console.log('\nPara completar el despliegue:');
    console.log('1. Sube todos los archivos de la carpeta dist a https://allseo.xyz/websap/');
    console.log('2. Asegúrate de que el archivo .htaccess se haya subido correctamente');
    console.log('3. Para el backend, asegúrate de que Render.com esté configurado para usar:');
    console.log('   - Comando de inicio: node server.js');
    console.log('   - Variables de entorno con las credenciales de la BD');
    console.log('\nCredenciales del sistema:');
    console.log('Usuario: admin');
    console.log('Contraseña: admin123');
    
  } catch (error) {
    console.error('\n❌ ERROR EN EL DESPLIEGUE:');
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar el despliegue
deploy();