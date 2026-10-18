import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue'
import { App as CapApp } from '@capacitor/app'
import App from './App.vue'
import router from './router'
import { loadState, refreshToday } from './lib/store'

import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'
import '@ionic/vue/css/palettes/dark.system.css'
import '@fontsource-variable/fraunces'
import './theme/app.css'

const app = createApp(App).use(IonicVue, { mode: 'md' }).use(router)

loadState().then(async () => {
  await router.isReady()
  app.mount('#app')
})

// A new day may have started while the app was in the background
CapApp.addListener('resume', () => refreshToday()).catch(() => {})
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refreshToday()
})
