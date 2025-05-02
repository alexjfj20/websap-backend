import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { isAuthenticated, hasRole, getCurrentUser, removeToken } from '../services/authService'
import { alert } from '../services/dialogService'
import LoginView from '../views/LoginView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/about',
    name: 'about',
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import(/* webpackChunkName: "register" */ '../views/RegisterView.vue')
  },
  {
    path: '/menu',
    name: 'menu',
    component: () => import(/* webpackChunkName: "menu" */ '../components/MenuComponent.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/menu/:id',
    name: 'shared-menu',
    component: () => import(/* webpackChunkName: "shared-menu" */ '../views/SharedMenuView.vue'),
    props: true
  },
  {
    path: '/superadmin',
    name: 'superadmin',
    component: () => import(/* webpackChunkName: "superadmin" */ '../views/SuperAdminView.vue'),
    meta: { 
      requiresAuth: true,
      roles: ['Superadministrador']
    }
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import(/* webpackChunkName: "admin" */ '../views/AdminView.vue'),
    meta: { 
      requiresAuth: true,
      roles: ['Administrador', 'Superadministrador']
    }
  },
  {
    path: '/admin/sync-business-info',
    name: 'sync-business-info',
    component: () => import(/* webpackChunkName: "sync-business-info" */ '../components/admin/SyncBusinessInfo.vue'),
    meta: { 
      requiresAuth: true,
      roles: ['Administrador', 'Superadministrador']
    }
  },
  {
    path: '/employee',
    name: 'employee',
    component: () => import(/* webpackChunkName: "employee" */ '../views/EmployeeView.vue'),
    meta: { 
      requiresAuth: true,
      roles: ['Empleado']
    }
  },
  {
    path: '/platos',
    name: 'platos',
    component: () => import(/* webpackChunkName: "platos" */ '../views/PlatosView.vue'),
    meta: { 
      requiresAuth: true,
      roles: ['Administrador', 'Superadministrador']
    }
  },
  {
    path: '/admin/usuarios',
    name: 'admin-usuarios',
    component: () => import(/* webpackChunkName: "admin-usuarios" */ '../components/admin/AdminUsuarios.vue'),
    meta: { 
      requiresAuth: true,
      roles: ['Administrador', 'Superadministrador']
    }
  },
  {
    path: '/admin/restaurantes',
    name: 'admin-restaurantes',
    component: () => import(/* webpackChunkName: "admin-restaurantes" */ '../components/admin/AdminRestaurantes.vue'),
    meta: { 
      requiresAuth: true,
      roles: ['Administrador', 'Superadministrador']
    }
  },
  {
    path: '/reservas',
    name: 'reservas',
    component: () => import(/* webpackChunkName: "reservas" */ '../views/ReservasView.vue'),
    meta: { 
      requiresAuth: true,
      roles: ['Administrador', 'Superadministrador', 'Empleado']
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Navegación con protección de rutas
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)
  const requiresRoles = to.meta.roles
  
  // Limpiar cualquier información de usuario incorrecta o desactualizada
  if (to.path === '/login') {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    removeToken();
  }
  
  // Si la ruta requiere autenticación y el usuario no está autenticado
  if (requiresAuth && !isAuthenticated()) {
    await alert('Debe iniciar sesión para acceder a esta página', {
      title: 'Acceso Restringido'
    });
    next({ name: 'login' })
  }
  // Si la ruta requiere ser invitado y el usuario está autenticado
  else if (requiresGuest && isAuthenticated()) {
    // Determinar a dónde redirigir basado en el rol
    const user = getCurrentUser();
    if (user && user.roles) {
      if (user.roles.includes('Superadministrador')) {
        next({ name: 'superadmin' });
      } else if (user.roles.includes('Administrador')) {
        next({ name: 'admin' });
      } else {
        next({ name: 'employee' });
      }
    } else {
      next({ name: 'home' });
    }
  }
  // Si la ruta requiere roles específicos
  else if (requiresRoles && isAuthenticated()) {
    const userHasRequiredRole = requiresRoles.some(role => hasRole(role))
    if (!userHasRequiredRole) {
      // Redirigir a una página de acceso denegado o dashboard por defecto
      await alert('No tiene permisos para acceder a esta sección', {
        title: 'Acceso Denegado'
      });
      next({ name: 'home' })
    } else {
      next()
    }
  }
  else {
    next()
  }
})

export default router