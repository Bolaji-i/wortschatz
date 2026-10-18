<template>
  <ion-header v-if="!welcome">
    <ion-toolbar>
      <ion-title>Dein Lernplan</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="done">Fertig</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <div class="page">
      <header v-if="welcome" class="welcome">
        <p class="eyebrow">Willkommen bei Wortschatz</p>
        <h1 class="big-title">Lass uns deinen Lernplan einrichten</h1>
        <p class="muted">Du kannst das jederzeit unter „Mehr“ oder oben auf der Seite „Heute“ ändern.</p>
      </header>
      <StudyPlan @change="onChange" />
      <ion-button expand="block" size="large" class="go" @click="done">
        {{ welcome ? 'Los geht’s' : 'Fertig' }}
      </ion-button>
    </div>
  </ion-content>
</template>

<script setup lang="ts">
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, modalController } from '@ionic/vue'
import StudyPlan from './StudyPlan.vue'
import { applyPlan, state } from '@/lib/store'
import { syncReminder } from '@/lib/device'

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
