import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@renderer/views/ChatView.vue'),
    },
    {
      path: '/settings',
      component: () => import('@renderer/views/Settings.vue'),
      children: [
        {
          path: '',
          redirect: '/settings/llm',
        },
        {
          path: 'general',
          name: 'settings-general',
          component: () => import('@renderer/views/settings/GeneralSettings.vue'),
        },
        {
          path: 'llm',
          name: 'settings-llm',
          component: () => import('@renderer/views/settings/LlmSettings.vue'),
        },
        {
          path: 'mcp',
          name: 'settings-mcp',
          component: () => import('@renderer/views/settings/McpSettings.vue'),
        },
        {
          path: 'skills',
          name: 'settings-skills',
          component: () => import('@renderer/views/settings/SkillSettings.vue'),
        },
      ],
    },
  ],
})

export default router
