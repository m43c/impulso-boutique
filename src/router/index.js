import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Public routes
    {
      path: '/',
      redirect: { name: 'login' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    // Private routes
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'home',
          name: 'home',
          component: () => import('@/views/HomeView.vue'),
          meta: { title: 'Inicio' },
        },
        // User routes
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/users/UsersView.vue'),
          meta: { title: 'Usuarios', roles: ['admin'] },
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/users/ProfileView.vue'),
          meta: { title: 'Perfil' },
        },
        // Product routes
        {
          path: 'products',
          name: 'products',
          component: () => import('@/views/products/ProductsView.vue'),
          meta: { title: 'Productos' },
        },
        {
          path: 'products/:id',
          name: 'product-details',
          component: () => import('@/views/products/ProductDetailsView.vue'),
          meta: {
            title: 'Detalles del producto',
            breadcrumb: [{ title: 'Productos', to: { name: 'products' } }],
          },
        },
        {
          path: 'units/:unitId',
          name: 'unit-details',
          component: () => import('@/views/products/ProductUnitDetailsView.vue'),
          meta: {
            title: 'Detalles de unidad',
            breadcrumb: [{ title: 'Productos', to: { name: 'products' } }],
          },
        },
      ],
    },
    // 404 not found
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'Página no encontrada' },
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  await authStore.initialize()

  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'home' }
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if (to.meta.roles && !to.meta.roles.includes(authStore.role)) {
    toast.error('No tienes permisos para acceder a esta sección')
    return { name: 'home' }
  }
})

export default router
