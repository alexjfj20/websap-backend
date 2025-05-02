/**
 * Datos de simulación para usar cuando la base de datos no está disponible
 * Esto permite que la aplicación siga funcionando en modo de reserva
 */

const menuItems = [
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
];

const users = [
  {
    id: 1,
    username: "admin",
    name: "Administrador",
    role: "admin",
    email: "admin@example.com"
  },
  {
    id: 2,
    username: "empleado",
    name: "Empleado Demo",
    role: "employee",
    email: "empleado@example.com"
  }
];

const orders = [
  {
    id: 1,
    table: "Mesa 1",
    status: "completed",
    items: [
      { id: 1, quantity: 2, notes: "Sin cebolla" },
      { id: 4, quantity: 1 }
    ],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date(Date.now() - 3000000).toISOString()
  },
  {
    id: 2,
    table: "Mesa 3",
    status: "pending",
    items: [
      { id: 2, quantity: 1 },
      { id: 3, quantity: 2, notes: "Extra nata" }
    ],
    createdAt: new Date().toISOString()
  }
];

module.exports = {
  menuItems,
  users,
  orders,
  
  // Función para simular un retraso en las respuestas y que parezca una API real
  async getMenuItems() {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.menuItems), 300);
    });
  },
  
  async saveMenuItems(items) {
    return new Promise(resolve => {
      this.menuItems = items;
      setTimeout(() => resolve({ success: true, message: "Menú guardado correctamente (modo simulado)" }), 500);
    });
  },
  
  // Otras funciones simuladas según sea necesario
  async getOrders() {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.orders), 300);
    });
  }
};