import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@renderer/views/Home.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@renderer/views/Settings.vue'),
    },
  ],
})

export default router
