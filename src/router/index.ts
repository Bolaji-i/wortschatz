import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import TabsPage from '@/views/TabsPage.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/tabs/today' },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      { path: '', redirect: '/tabs/today' },
      { path: 'today', component: () => import('@/views/TodayPage.vue') },
      { path: 'review', component: () => import('@/views/ReviewPage.vue') },
      { path: 'progress', component: () => import('@/views/ProgressPage.vue') },
      { path: 'settings', component: () => import('@/views/SettingsPage.vue') }
    ]
  }
]

export default createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes })
