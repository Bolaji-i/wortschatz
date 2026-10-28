<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>{{ t('privacy') }}</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="close">{{ t('close') }}</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <!-- The policy ships with the app (public/privacy.html), so it also works offline -->
    <iframe :src="src" :title="t('privacy')" />
  </ion-content>
</template>

<script setup lang="ts">
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, modalController } from '@ionic/vue'
import { lang, t } from '@/lib/i18n'

const src = `${import.meta.env.BASE_URL}privacy.html#${lang.value}`
const close = () => modalController.dismiss()
</script>

<style scoped>
iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: var(--paper);
}
</style>
