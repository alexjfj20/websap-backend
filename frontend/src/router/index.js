import { createRouter, createWebHistory } from 'vue-router';

// Importar vistas
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import MenuView from '../views/MenuView.vue';
import NotFoundView from '../views/NotFoundView.vue';

// Importar servicios
import { isAuthenticated } from '@/services/authService';

// Configuración base para el enrutador
const isProduction = window.location.hostname.includes('allseo.xyz');
const baseUrl = isProduction ? '/websap/' : '/';

// Definir las rutas
const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/menu',
    name: 'menu',
    component: MenuView,
    meta: { requiresAuth: true }
  },
  // Ruta para manejar 404
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView
  }
];

// Crear el enrutador
const router = createRouter({
  history: createWebHistory(baseUrl),
  routes
});

// Guardia de navegación
router.beforeEach(async (to, from, next) => {
  console.log(`Navegando de ${from.path} a ${to.path}`);
  
  // Si la ruta requiere autenticación
  if (to.meta.requiresAuth) {
    // Verificar si el usuario está autenticado
    const authenticated = await isAuthenticated();
    
    if (authenticated) {
      // Usuario autenticado, permitir acceso
      next();
    } else {
      // Usuario no autenticado, redirigir a login
      console.log('Usuario no autenticado, redirigiendo a login');
      next({ name: 'login', query: { redirect: to.fullPath } });
    }
  } else {
    // No requiere autenticación, permitir acceso
    next();
  }
});

export default router;