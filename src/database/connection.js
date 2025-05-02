// Archivo de conexión a la base de datos con modo de simulación forzado
// Este archivo ha sido simplificado para garantizar que la aplicación funcione
// mientras se resuelve el problema de acceso a la base de datos en el servidor Render

console.log('Iniciando servicio de base de datos (MODO SIMULACIÓN)');

// Datos simulados para uso cuando no hay conexión a base de datos
const mockData = {
  menuItems: [
    {
      id: 1,
      nombre: "Plato Margarita",
      descripcion: "Pizza clásica con tomate y queso mozzarella",
      precio: 8.99,
      categoria: "Pizzas",
      disponible: true
    },
    {
      id: 2,
      nombre: "Costillas Especiales",
      descripcion: "Costillas en salsa barbacoa con patatas fritas caseras",
      precio: 14.50,
      categoria: "Carnes",
      disponible: true
    },
    {
      id: 3,
      nombre: "Tiramisu",
      descripcion: "Postre tradicional italiano con café y mascarpone",
      precio: 6.75,
      categoria: "Postres",
      disponible: true
    },
    {
      id: 4,
      nombre: "Patatas Bravas",
      descripcion: "Patatas fritas con salsa picante y alioli",
      precio: 5.50,
      categoria: "Entrantes",
      disponible: true
    }
  ],
  
  // Función para obtener elementos del menú
  getMenuItems: async function() {
    return this.menuItems;
  },
  
  // Función para guardar elementos del menú
  saveMenuItems: async function(items) {
    this.menuItems = items;
    return { success: true, message: "Menú guardado correctamente (modo simulado)" };
  }
};

// Objeto sequelize simulado
const sequelize = {
  authenticate: async () => true,
  transaction: async (callback) => await callback({ id: 'mock-transaction' }),
  query: async (sql) => {
    console.log('SQL simulado:', sql.substring(0, 50) + '...');
    if (sql.toLowerCase().includes('select') && sql.toLowerCase().includes('menu_items')) {
      return [mockData.menuItems, null];
    }
    return [[], null];
  }
};

// Función para probar la conexión (siempre exitosa en modo simulación)
async function testConnection() {
  console.log('⚠️ Usando modo de simulación para la base de datos.');
  return true;
}

// Exportar todo lo necesario
module.exports = {
  sequelize,
  testConnection,
  USE_MOCK_MODE: true,
  mockData
};