import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.voltron.wortschatz',
  appName: 'Wortschatz',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      iconColor: '#E4572E'
    }
  }
}

export default config
