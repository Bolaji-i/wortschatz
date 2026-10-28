import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.voltron.wortschatz',
  appName: 'Super Wortschatz',
  webDir: 'dist',
  plugins: {
    // Send fetch() through the native HTTP stack in the apps, so AI providers' CORS rules never get in the way
    CapacitorHttp: { enabled: true },
    LocalNotifications: {
      iconColor: '#E4572E'
    }
  }
}

export default config
