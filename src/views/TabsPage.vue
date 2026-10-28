<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="today" href="/tabs/today">
          <ion-icon :icon="sunnyOutline" />
          <ion-label>{{ t('tabToday') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="review" href="/tabs/review">
          <ion-icon :icon="repeatOutline" />
          <ion-label>{{ t('tabReview') }}</ion-label>
          <ion-badge v-if="dueCount > 0" color="secondary">{{ dueCount }}</ion-badge>
        </ion-tab-button>
        <ion-tab-button tab="progress" href="/tabs/progress">
          <ion-icon :icon="statsChartOutline" />
          <ion-label>{{ t('tabProgress') }}</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="settings" href="/tabs/settings">
          <ion-icon :icon="settingsOutline" />
          <ion-label>{{ t('tabMore') }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge } from '@ionic/vue'
import { sunnyOutline, repeatOutline, statsChartOutline, settingsOutline } from 'ionicons/icons'
import { dueCount } from '@/lib/store'
import { t } from '@/lib/i18n'
</script>
