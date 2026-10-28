import { Capacitor } from '@capacitor/core'
import { TextToSpeech } from '@capacitor-community/text-to-speech'
import { LocalNotifications } from '@capacitor/local-notifications'
import { state } from './store'
import { t } from './i18n'

export const isNative = Capacitor.isNativePlatform()
export const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web'

/** Speak German text using the phone's text-to-speech engine. */
export async function speak(text: string) {
  try {
    await TextToSpeech.stop()
    await TextToSpeech.speak({
      text,
      lang: 'de-DE',
      rate: state.settings.speechRate,
      pitch: 1,
      volume: 1,
      // iOS: 'playback' keeps pronunciation audible even when the silent switch is on
      category: 'playback'
    })
  } catch (e) {
    // Fallback for browsers where the plugin isn't available
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'de-DE'
      u.rate = state.settings.speechRate
      speechSynthesis.cancel()
      speechSynthesis.speak(u)
    } else {
      console.warn('Speech not available', e)
    }
  }
}

const REMINDER_ID = 1001

/** Schedules (or cancels) the daily reminder. Returns false if permission was denied. */
export async function syncReminder(): Promise<boolean> {
  if (!isNative) return true
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] }).catch(() => {})
  if (!state.settings.reminderOn) return true

  const perm = await LocalNotifications.checkPermissions()
  if (perm.display !== 'granted') {
    const req = await LocalNotifications.requestPermissions()
    if (req.display !== 'granted') return false
  }

  const [hour, minute] = state.settings.reminderTime.split(':').map(Number)
  await LocalNotifications.schedule({
    notifications: [
      {
        id: REMINDER_ID,
        title: t('reminderTitle'),
        body: t('reminderBody', { n: state.settings.dailyGoal }),
        schedule: { on: { hour, minute }, allowWhileIdle: true }
      }
    ]
  })
  return true
}
