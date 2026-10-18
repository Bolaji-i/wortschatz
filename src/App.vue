<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { IonApp, IonRouterOutlet, modalController } from '@ionic/vue'
import PlanModal from '@/components/PlanModal.vue'
import { state } from '@/lib/store'

// First start (or first start after an update): choose levels and daily goal
onMounted(async () => {
  if (state.settings.onboarded) return
  const modal = await modalController.create({ component: PlanModal, componentProps: { welcome: true }, backdropDismiss: false, canDismiss: true })
  await modal.present()
})
</script>
