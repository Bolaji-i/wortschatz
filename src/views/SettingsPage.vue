<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="page">
        <header class="hero">
          <p class="eyebrow">{{ t('settingsEyebrow') }}</p>
          <h1 class="big-title">{{ t('settingsTitle') }}</h1>
        </header>

        <section class="panel">
          <h3>{{ t('appLanguage') }}</h3>
          <div class="langs" role="group" :aria-label="t('appLanguage')">
            <button
              v-for="l in UI_LANGS"
              :key="l.id"
              type="button"
              class="lang"
              :class="{ on: state.settings.uiLang === l.id }"
              @click="setLang(l.id)"
            >
              {{ l.label }}
            </button>
          </div>
          <p class="hint">{{ t('appLanguageHint') }}</p>
        </section>

        <section class="panel">
          <StudyPlan @change="onPlanChange" />
        </section>

        <section class="panel">
          <div class="row">
            <h3>{{ t('reminder') }}</h3>
            <ion-toggle :checked="state.settings.reminderOn" @ion-change="setReminder($event.detail.checked)" :aria-label="t('reminder')" />
          </div>
          <div v-if="state.settings.reminderOn" class="row time">
            <span>{{ t('time') }}</span>
            <input v-model="state.settings.reminderTime" type="time" @change="syncReminderWithToast" />
          </div>
          <p v-if="!isNative" class="hint">{{ t('remindersNativeOnly') }}</p>
        </section>

        <section class="panel">
          <h3>{{ t('speechRate') }}</h3>
          <ion-range v-model="state.settings.speechRate" :min="0.5" :max="1.2" :step="0.1" :pin="true" :pin-formatter="(v: number) => v.toFixed(1)">
            <ion-icon slot="start" :icon="walkOutline" />
            <ion-icon slot="end" :icon="bicycleOutline" />
          </ion-range>
          <ion-button fill="outline" size="small" @click="speak('Ich lerne jeden Tag fünf neue Wörter.')">
            <ion-icon slot="start" :icon="volumeHighOutline" /> {{ t('test') }}
          </ion-button>
          <p class="hint">{{ voiceHint }}</p>
        </section>

        <section class="panel">
          <div class="row">
            <h3>{{ t('aiTitle') }}</h3>
            <ion-toggle v-model="state.settings.aiOn" :aria-label="t('aiTitle')" />
          </div>
          <p class="hint">{{ t('aiHint') }}</p>
          <template v-if="state.settings.aiOn">
            <p class="label">{{ t('provider') }}</p>
            <div class="providers">
              <button
                v-for="p in AI_PROVIDERS"
                :key="p.id"
                type="button"
                class="provider"
                :class="{ on: state.settings.aiProvider === p.id }"
                @click="state.settings.aiProvider = p.id"
              >
                <strong>{{ p.name }}</strong>
                <span>{{ p.company }}</span>
                <i v-if="state.settings.aiKeys[p.id]" class="has-key" :aria-label="t('keyStored')"><ion-icon :icon="key" /></i>
              </button>
            </div>
            <p class="hint provider-note">
              {{ t(provider.noteKey) }}
              <a :href="provider.keyUrl" target="_blank" rel="noopener">{{ t('createKey', { p: provider.name }) }}</a>
            </p>

            <ion-input
              v-model="state.settings.aiKeys[state.settings.aiProvider]"
              type="password"
              :placeholder="provider.keyPlaceholder"
              class="key"
              fill="outline"
              :label="t('apiKey', { p: provider.name })"
              label-placement="stacked"
              autocomplete="off"
              :clear-input="true"
            />

            <div class="model-row">
              <ion-input
                v-model="state.settings.aiModels[state.settings.aiProvider]"
                class="key model"
                fill="outline"
                :label="t('model')"
                label-placement="stacked"
                :placeholder="provider.defaultModel"
                autocapitalize="off"
                :spellcheck="false"
              />
              <ion-button size="small" fill="clear" :disabled="!currentKey || loadingModels" @click="pickModel">
                {{ loadingModels ? t('loading') : t('loadList') }}
              </ion-button>
            </div>
            <p class="hint">{{ t('modelHint', { c: provider.company }) }}</p>

            <ion-button size="small" fill="outline" :disabled="!currentKey || testing" @click="testAi">
              {{ testing ? t('testing') : t('testConnection') }}
            </ion-button>
          </template>
        </section>

        <section class="panel">
          <h3>{{ t('backup') }}</h3>
          <p class="hint">{{ t('backupHint') }}</p>
          <div class="btns">
            <ion-button size="small" fill="outline" @click="doExport">{{ t('copyBackup') }}</ion-button>
            <ion-button size="small" fill="outline" @click="doImport">{{ t('pasteBackup') }}</ion-button>
          </div>
        </section>

        <section class="panel danger">
          <h3>{{ t('startOver') }}</h3>
          <ion-button size="small" color="danger" fill="outline" @click="confirmReset">{{ t('resetProgress') }}</ion-button>
        </section>

        <p class="about muted">
          {{ t('about', { v: APP_VERSION, n: WORDS.length.toLocaleString(state.settings.uiLang === 'de' ? 'de-DE' : 'en-GB') }) }}
          · <a href="#" @click.prevent="openPrivacy">{{ t('privacy') }}</a>
        </p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  IonPage, IonContent, IonToggle, IonRange, IonIcon, IonButton, IonInput,
  alertController, modalController, toastController
} from '@ionic/vue'
import { bicycleOutline, key, volumeHighOutline, walkOutline } from 'ionicons/icons'
import StudyPlan from '@/components/StudyPlan.vue'
import { WORDS } from '@/data/words'
import { applyPlan, exportData, importData, resetProgress, state } from '@/lib/store'
import { isNative, platform, speak, syncReminder } from '@/lib/device'
import { AI_PROVIDERS, PROVIDERS, getAiFeedback, listModels } from '@/lib/ai'
import { UI_LANGS, t, type UiLang } from '@/lib/i18n'
import { APP_VERSION } from '@/lib/app'
import PrivacyModal from '@/components/PrivacyModal.vue'

const testing = ref(false)
const voiceHint = computed(() => (platform === 'ios' ? t('voiceIos') : platform === 'android' ? t('voiceAndroid') : t('voiceWeb')))

async function openPrivacy() {
  const m = await modalController.create({ component: PrivacyModal })
  await m.present()
}

function setLang(l: UiLang) {
  state.settings.uiLang = l
  // The reminder text is stored in the notification, so refresh it in the new language
  if (state.settings.reminderOn) syncReminder().catch(() => {})
}

async function toast(message: string, color = 'primary') {
  const el = await toastController.create({ message, duration: 2200, position: 'top', color })
  await el.present()
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
      toast(platform === 'ios' ? t('notifBlockedIos') : t('notifBlockedAndroid'), 'warning')
    } else if (state.settings.reminderOn && isNative) {
      toast(t('reminderSet', { t: state.settings.reminderTime }))
    }
  } catch (e) {
    toast(t('reminderFailed'), 'danger')
  }
}

const provider = computed(() => PROVIDERS[state.settings.aiProvider])
const currentKey = computed(() => state.settings.aiKeys[state.settings.aiProvider]?.trim() ?? '')
const loadingModels = ref(false)

async function pickModel() {
  loadingModels.value = true
  try {
    const p = state.settings.aiProvider
    const models = await listModels(p, currentKey.value)
    if (!models.length) return toast(t('noModels'), 'warning')
    const current = state.settings.aiModels[p] || PROVIDERS[p].defaultModel
    const a = await alertController.create({
      header: t('chooseModel', { p: PROVIDERS[p].name }),
      inputs: [
        { type: 'radio', label: t('standardModel', { m: PROVIDERS[p].defaultModel }), value: '', checked: !state.settings.aiModels[p] },
        ...models.slice(0, 40).map(m => ({ type: 'radio' as const, label: m, value: m, checked: m === current && !!state.settings.aiModels[p] }))
      ],
      buttons: [
        { text: t('cancel'), role: 'cancel' },
        { text: t('apply'), handler: (v: string) => { state.settings.aiModels[p] = v ?? '' } }
      ]
    })
    await a.present()
  } catch (e) {
    toast(e instanceof Error ? e.message : t('modelsFailed'), 'danger')
  } finally {
    loadingModels.value = false
  }
}

async function testAi() {
  testing.value = true
  try {
    const p = state.settings.aiProvider
    const r = await getAiFeedback({ provider: p, key: currentKey.value, model: state.settings.aiModels[p] }, WORDS[0], 'Die Straße ist im Winter gefährlich.')
    if (r) toast(t('aiWorks', { p: PROVIDERS[p].name }))
  } catch (e) {
    toast(e instanceof Error ? e.message : t('testFailed'), 'danger')
  } finally {
    testing.value = false
  }
}

async function doExport() {
  try {
    await navigator.clipboard.writeText(exportData())
    toast(t('backupCopied'))
  } catch {
    const a = await alertController.create({
      header: t('backup'),
      message: t('backupCopyFailed'),
      inputs: [{ type: 'textarea', value: exportData() }],
      buttons: ['OK']
    })
    await a.present()
  }
}

async function doImport() {
  const a = await alertController.create({
    header: t('pasteTitle'),
    message: t('pasteWarning'),
    inputs: [{ name: 'json', type: 'textarea', placeholder: t('pastePlaceholder') }],
    buttons: [
      { text: t('cancel'), role: 'cancel' },
      {
        text: t('restore'),
        handler: (data: { json: string }) => {
          try {
            importData(data.json)
            toast(t('restored'))
          } catch (e) {
            toast(t('invalidBackup'), 'danger')
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
    header: t('resetTitle'),
    message: t('resetMsg'),
    buttons: [
      { text: t('cancel'), role: 'cancel' },
      { text: t('resetBtn'), role: 'destructive', handler: () => { resetProgress(); toast(t('resetDone')) } }
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
.langs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 10px;
}
.lang {
  padding: 12px;
  border-radius: 14px;
  border: 1.5px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font-weight: 600;
  font-size: 15px;
}
.lang.on {
  border-color: var(--ink);
  background: var(--amber-soft);
}
.about a {
  color: inherit;
}
.label {
  font-size: 13px;
  font-weight: 700;
  margin: 14px 0 8px;
}
.providers {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.provider {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 10px;
  border-radius: 14px;
  border: 1.5px solid var(--line);
  background: var(--card);
  color: var(--ink);
  text-align: left;
}
.provider.on {
  border-color: var(--ink);
  background: var(--amber-soft);
}
.provider strong {
  font-size: 15px;
}
.provider span {
  font-size: 11px;
  color: var(--ink-soft);
}
.has-key {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 13px;
  color: var(--ok);
  line-height: 0;
}
.provider-note a {
  color: var(--ink);
  font-weight: 600;
  white-space: nowrap;
}
.model-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}
.model-row .model {
  flex: 1;
  margin-bottom: 0;
}
ion-segment {
  --background: var(--paper);
}
</style>
