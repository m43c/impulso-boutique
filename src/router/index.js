import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: { name: 'login' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
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
      ],
    },
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
