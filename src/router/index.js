import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import { Capacitor } from '@capacitor/core'

const isNativePlatform = Capacitor.isNativePlatform()
const webBase = import.meta.env.DEV ? '/' : '/tresnak/'

const router = createRouter({
  history: isNativePlatform
    ? createWebHashHistory()
    : createWebHistory(webBase),
  scrollBehavior() {
    return { top: 0, left: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'hasiera',
      component: () => import('../views/Hasiera.vue'),
      meta: { section: 'home', title: 'Jokatu!' }
    },
    {
      path: '/sinonimoak-jokoa',
      name: 'sinonimoak-jokoa',
      component: () => import('../views/SinonimoakJokoa.vue'),
      meta: { section: 'sinonimoak', title: 'Sinonimoen jolasa' }
    },
    {
      path: '/sinonimoak-zerrenda',
      name: 'sinonimoak-zerrenda',
      component: () => import('../views/SinonimoakZerrenda.vue'),
      meta: { section: 'sinonimoak', title: 'Sinonimoen zerrenda' }
    },
    {
      path: '/hiztegia',
      name: 'hiztegia',
      component: () => import('../views/Hiztegia.vue'),
      meta: { section: 'hiztegia', title: 'C1-eko hiztegia' }
    },
    {
      path: '/hiztegle',
      name: 'hiztegle',
      component: () => import('../views/HiztegleView.vue'),
      meta: { section: 'hiztegle', title: 'Hiztegle', dailyMode: false }
    },
    {
      path: '/hiztegle/eguneroko',
      name: 'hiztegle-eguneroko',
      component: () => import('../views/HiztegleView.vue'),
      meta: { section: 'hiztegle', title: 'Eguneroko erronka', dailyMode: true }
    },
    {
      path: '/aditzak',
      name: 'aditzak',
      component: () => import('../views/Aditzak.vue'),
      meta: { section: 'aditzak', title: 'Aditz laguntzaileak' }
    },
    {
      path: '/estatistikak',
      name: 'estatistikak',
      component: () => import('../views/StatsView.vue'),
      meta: { section: 'estatistikak', title: 'Estatistikak' }
    },
    {
      path: '/aditz-taulak',
      name: 'aditz-taulak',
      component: () => import('../views/ConjugationTables.vue'),
      meta: { section: 'taulak', title: 'Aditz taulak' }
    },
  ]
})

export default router
