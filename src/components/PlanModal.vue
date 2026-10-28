<template>
  <ion-header v-if="!welcome">
    <ion-toolbar>
      <ion-title>{{ t('planTitle') }}</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="done">{{ t('done') }}</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <div class="page">
      <header v-if="welcome" class="welcome">
        <div class="lang-switch" role="group" :aria-label="t('appLanguage')">
          <button
            v-for="l in UI_LANGS"
            :key="l.id"
            type="button"
            :class="{ on: state.settings.uiLang === l.id }"
            @click="state.settings.uiLang = l.id"
          >
            {{ l.label }}
          </button>
        </div>
        <p class="eyebrow">{{ t('welcomeEyebrow') }}</p>
        <h1 class="big-title">{{ t('welcomeTitle') }}</h1>
        <p class="muted">{{ t('welcomeHint') }}</p>
      </header>
      <StudyPlan @change="onChange" />
      <ion-button expand="block" size="large" class="go" @click="done">
        {{ welcome ? t('letsGo') : t('done') }}
      </ion-button>
    </div>
  </ion-content>
</template>

<script setup lang="ts">
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, modalController } from '@ionic/vue'
import StudyPlan from './StudyPlan.vue'
import { applyPlan, state } from '@/lib/store'
import { syncReminder } from '@/lib/device'
import { UI_LANGS, t } from '@/lib/i18n'

defineProps<{ welcome?: boolean }>()

let reminderTimer: ReturnType<typeof setTimeout> | undefined
function onChange() {
  applyPlan()
  if (state.settings.reminderOn) {
    clearTimeout(reminderTimer)
    reminderTimer = setTimeout(() => syncReminder().catch(() => {}), 800)
  }
}

function done() {
  state.settings.onboarded = true
  applyPlan()
  modalController.dismiss()
}
</script>

<style scoped>
.lang-switch {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  margin-bottom: 18px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--card);
}
.lang-switch button {
  padding: 6px 14px;
  border-radius: 999px;
  background: transparent;
  color: var(--ink-soft);
  font-size: 13px;
  font-weight: 600;
}
.lang-switch button.on {
  background: var(--ink);
  color: var(--paper);
}
.welcome {
  padding: calc(var(--ion-safe-area-top, 0px) + 24px) 0 18px;
}
.welcome .muted {
  font-size: 14px;
  margin: 10px 0 0;
}
.go {
  margin-top: 24px;
  min-height: 54px;
}
</style>
