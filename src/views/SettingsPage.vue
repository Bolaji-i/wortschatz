<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="page">
        <header class="hero">
          <p class="eyebrow">Einstellungen</p>
          <h1 class="big-title">Mach es zu deiner App</h1>
        </header>

        <section class="panel">
          <StudyPlan @change="onPlanChange" />
        </section>

        <section class="panel">
          <div class="row">
            <h3>Tägliche Erinnerung</h3>
            <ion-toggle :checked="state.settings.reminderOn" @ion-change="setReminder($event.detail.checked)" aria-label="Erinnerung" />
          </div>
          <div v-if="state.settings.reminderOn" class="row time">
            <span>Uhrzeit</span>
            <input v-model="state.settings.reminderTime" type="time" @change="syncReminderWithToast" />
          </div>
          <p v-if="!isNative" class="hint">Erinnerungen funktionieren in der Android-App.</p>
        </section>

        <section class="panel">
          <h3>Sprechgeschwindigkeit</h3>
          <ion-range v-model="state.settings.speechRate" :min="0.5" :max="1.2" :step="0.1" :pin="true" :pin-formatter="(v: number) => v.toFixed(1)">
            <ion-icon slot="start" :icon="walkOutline" />
            <ion-icon slot="end" :icon="bicycleOutline" />
          </ion-range>
          <ion-button fill="outline" size="small" @click="speak('Ich lerne jeden Tag fünf neue Wörter.')">
            <ion-icon slot="start" :icon="volumeHighOutline" /> Testen
          </ion-button>
          <p class="hint">Wenn du keine Stimme hörst: Android-Einstellungen → Sprachausgabe → Deutsch installieren.</p>
        </section>

        <section class="panel">
          <div class="row">
            <h3>KI-Feedback zu deinen Sätzen</h3>
            <ion-toggle v-model="state.settings.aiOn" aria-label="KI-Feedback" />
          </div>
          <p class="hint">
            Optional. Ohne KI prüft die App deine Sätze offline (Wort benutzt, Großschreibung, Satzzeichen).
            Mit einem Claude-API-Schlüssel bekommst du echte Grammatik-Korrekturen. Der Schlüssel bleibt nur auf deinem Handy.
          </p>
          <template v-if="state.settings.aiOn">
            <ion-input
              v-model="state.settings.aiKey"
              type="password"
              placeholder="sk-ant-…"
              class="key"
              fill="outline"
              label="API-Schlüssel"
              label-placement="stacked"
            />
            <ion-button size="small" fill="outline" :disabled="!state.settings.aiKey || testing" @click="testAi">
              {{ testing ? 'Teste …' : 'Verbindung testen' }}
            </ion-button>
          </template>
        </section>

        <section class="panel">
          <h3>Sicherung</h3>
          <p class="hint">Dein Fortschritt ist auf dem Handy gespeichert. Mit einer Sicherung kannst du ihn auf ein neues Handy übertragen.</p>
          <div class="btns">
            <ion-button size="small" fill="outline" @click="doExport">Sicherung kopieren</ion-button>
            <ion-button size="small" fill="outline" @click="doImport">Sicherung einfügen</ion-button>
          </div>
        </section>

        <section class="panel danger">
          <h3>Neu anfangen</h3>
          <ion-button size="small" color="danger" fill="outline" @click="confirmReset">Fortschritt zurücksetzen</ion-button>
        </section>

        <p class="about muted">Wortschatz 1.2 · {{ WORDS.length }} Wörter · Viel Erfolg, Voltron!</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  IonPage, IonContent, IonToggle, IonRange, IonIcon, IonButton, IonInput,
  alertController, toastController
} from '@ionic/vue'
import { bicycleOutline, volumeHighOutline, walkOutline } from 'ionicons/icons'
import StudyPlan from '@/components/StudyPlan.vue'
import { WORDS } from '@/data/words'
import { applyPlan, exportData, importData, resetProgress, state } from '@/lib/store'
import { isNative, speak, syncReminder } from '@/lib/device'
import { getAiFeedback } from '@/lib/ai'

const testing = ref(false)

async function toast(message: string, color = 'primary') {
  const t = await toastController.create({ message, duration: 2200, position: 'top', color })
  await t.present()
}

let reminderTimer: ReturnType<typeof setTimeout> | undefined
/** Levels or daily goal changed: update today's words and the reminder text. */
function onPlanChange() {
  applyPlan()
  if (state.settings.reminderOn) {
    clearTimeout(reminderTimer)
    reminderTimer = setTimeout(() => syncReminder().catch(() => {}), 800)
  }
}

async function setReminder(on: boolean) {
  state.settings.reminderOn = on
  await syncReminderWithToast()
}

async function syncReminderWithToast() {
  try {
    const ok = await syncReminder()
    if (!ok) {
      state.settings.reminderOn = false
      toast('Benachrichtigungen sind blockiert. Erlaube sie in den Android-Einstellungen.', 'warning')
    } else if (state.settings.reminderOn && isNative) {
      toast(`Erinnerung täglich um ${state.settings.reminderTime} Uhr`)
    }
  } catch (e) {
    toast('Erinnerung konnte nicht gesetzt werden.', 'danger')
  }
}

async function testAi() {
  testing.value = true
  try {
    const r = await getAiFeedback(state.settings.aiKey, WORDS[0], 'Die Straße ist im Winter gefährlich.')
    toast(r.correct ? 'Verbindung klappt ✅' : 'Verbindung klappt ✅ (Antwort erhalten)')
  } catch (e) {
    toast(e instanceof Error ? e.message : 'Test fehlgeschlagen', 'danger')
  } finally {
    testing.value = false
  }
}

async function doExport() {
  try {
    await navigator.clipboard.writeText(exportData())
    toast('Sicherung in die Zwischenablage kopiert. Speichere sie z. B. in einer Notiz.')
  } catch {
    const a = await alertController.create({
      header: 'Sicherung',
      message: 'Kopieren hat nicht geklappt. Markiere den Text unten und kopiere ihn manuell.',
      inputs: [{ type: 'textarea', value: exportData() }],
      buttons: ['OK']
    })
    await a.present()
  }
}

async function doImport() {
  const a = await alertController.create({
    header: 'Sicherung einfügen',
    message: 'Achtung: Das ersetzt deinen aktuellen Fortschritt.',
    inputs: [{ name: 'json', type: 'textarea', placeholder: 'Sicherung hier einfügen' }],
    buttons: [
      { text: 'Abbrechen', role: 'cancel' },
      {
        text: 'Wiederherstellen',
        handler: (data: { json: string }) => {
          try {
            importData(data.json)
            toast('Fortschritt wiederhergestellt ✅')
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Ungültige Sicherung', 'danger')
            return false
          }
        }
      }
    ]
  })
  await a.present()
}

async function confirmReset() {
  const a = await alertController.create({
    header: 'Wirklich zurücksetzen?',
    message: 'Alle gelernten Wörter, Sätze und deine Serie werden gelöscht.',
    buttons: [
      { text: 'Abbrechen', role: 'cancel' },
      { text: 'Zurücksetzen', role: 'destructive', handler: () => { resetProgress(); toast('Neu angefangen.') } }
    ]
  })
  await a.present()
}
</script>

<style scoped>
.hero {
  padding: calc(var(--ion-safe-area-top, 0px) + 20px) 0 18px;
}
section {
  margin-bottom: 12px;
}
h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 10px;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.row h3 {
  margin: 0;
}
.time {
  margin-top: 12px;
}
.time input {
  font-size: 18px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--paper);
  color: var(--ink);
}
.hint {
  font-size: 13px;
  color: var(--ink-soft);
  margin: 10px 0 0;
  line-height: 1.45;
}
.levels {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.key {
  margin: 12px 0 8px;
}
.btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}
.about {
  text-align: center;
  font-size: 13px;
  margin-top: 20px;
}
ion-segment {
  --background: var(--paper);
}
</style>
