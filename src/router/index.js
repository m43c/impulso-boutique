import { createRouter, createWebHistory } from 'vue-router'

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
          meta: { title: 'Usuarios' },
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/users/ProfileView.vue'),
          meta: { title: 'Perfil' },
        },
      ],
    },
  ],
})

export default router
