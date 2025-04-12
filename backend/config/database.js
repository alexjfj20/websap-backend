const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

// Cargar variables de entorno
dotenv.config();

// Obtener la contraseña de cualquiera de las variables posibles (DB_PASS o DB_PASSWORD)
const dbPassword = process.env.DB_PASS || process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'websap';
const dbUser = process.env.DB_USER || 'root';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 3306;

// Imprimir información de depuración
console.log('⚙️ Configuración de conexión DB:');
console.log(`- Host: ${dbHost}`);
console.log(`- Database: ${dbName}`);
console.log(`- Usuario: ${dbUser}`);
console.log(`- Puerto: ${dbPort}`);
console.log(`- Contraseña configurada: ${dbPassword ? 'Sí' : 'No'}`);

// Configuración para conexión
const dbConfig = {
  host: dbHost,
  dialect: 'mysql',
  logging: false, // Deshabilitar logs para reducir la salida
  port: dbPort,
  define: {
    timestamps: true,
    underscored: true,
  },
  pool: {
    max: 2, // Reducir aún más el número máximo de conexiones
    min: 0,
    acquire: 30000,
    idle: 10000,
    evict: 10000 // Tiempo en ms para revisar conexiones inactivas
  },
  dialectOptions: {
    connectTimeout: 60000, // Aumentar el tiempo de espera para conexiones
    decimalNumbers: true
  }
};

// Función para crear la base de datos si no existe
const createDatabaseIfNotExists = async () => {
  let connection = null;
  try {
    console.log(`🔍 Verificando si la base de datos '${dbName}' existe...`);
    
    // Conectar a MySQL sin especificar una base de datos
    connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword
    });
    
    // Crear la base de datos si no existe
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✅ Base de datos '${dbName}' verificada/creada con éxito.`);
    
    return true;
  } catch (error) {
    console.error('❌ Error al crear la base de datos:', error);
    return false;
  } finally {
    // Asegurarse de cerrar la conexión
    if (connection) {
      try {
        await connection.end();
        console.log('Conexión cerrada correctamente');
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
};

// Crear instancia de Sequelize con una sola conexión
let sequelize = null;
try {
  sequelize = new Sequelize(
    dbName,
    dbUser,
    dbPassword,
    dbConfig
  );
} catch (error) {
  console.error('Error al crear instancia de Sequelize:', error);
}

// Función para obtener la instancia de Sequelize
const getSequelize = () => {
  if (!sequelize) {
    console.log('⚠️ Creando nueva instancia de Sequelize...');
    try {
      sequelize = new Sequelize(
        dbName,
        dbUser,
        dbPassword,
        dbConfig
      );
    } catch (error) {
      console.error('Error al crear instancia de Sequelize:', error);
      return null;
    }
  }
  return sequelize;
};

// Función para probar la conexión
const testConnection = async () => {
  let tempConnection = null;
  
  try {
    // Primero intentar crear la base de datos si no existe
    const dbCreated = await createDatabaseIfNotExists();
    if (!dbCreated) {
      throw new Error('No se pudo crear/verificar la base de datos');
    }
    
    // Probar la conexión con Sequelize
    await getSequelize().authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    
    // Mostrar recomendaciones útiles
    console.log(`
RECOMENDACIÓN PARA SOLUCIONAR PROBLEMAS DE BASE DE DATOS:

1. Verifica que el servicio MySQL está en ejecución en tu sistema.
   - En Windows: Comprueba en Servicios (services.msc)
   - En Linux: sudo systemctl status mysql

2. Verifica que las credenciales son correctas:
   mysql -u ${dbUser} -p${dbPassword ? ' (usando tu contraseña)' : ''}

3. Verifica que el puerto es correcto (por defecto 3306):
   - Comprueba la configuración de MySQL

4. Si el error es "Too many connections", reinicia el servicio MySQL:
   - En Windows: Reinicia el servicio en services.msc
   - En Linux: sudo systemctl restart mysql
`);
    return false;
  } finally {
    // Asegurarse de cerrar cualquier conexión temporal
    if (tempConnection) {
      try {
        await tempConnection.close();
      } catch (closeError) {
        console.error('Error al cerrar conexión temporal:', closeError);
      }
    }
  }
};

// Función para cerrar la conexión de Sequelize
const closeConnection = async () => {
  if (sequelize) {
    try {
      // En lugar de cerrar completamente la conexión, solo limpiar el pool
      const db = sequelize();
      if (db && db.connectionManager) {
        await db.connectionManager.pool.drain();
        console.log('Pool de conexiones drenado correctamente');
      } else {
        console.log('No hay pool de conexiones activo para drenar');
      }
      console.log('Limpieza de conexiones completada');
    } catch (error) {
      console.error('Error al limpiar el pool de conexiones:', error);
    }
  }
};

module.exports = {
  sequelize: getSequelize,
  testConnection,
  closeConnection,
  dbConfig,
  dbName,
  dbUser,
  dbPassword,
  dbHost
};