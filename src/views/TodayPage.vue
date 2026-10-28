<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="page">
        <header class="hero">
          <div>
            <p class="eyebrow">{{ prettyDate(ui.today) }}</p>
            <h1 class="big-title">{{ t('todayTitle1') }}<br />{{ t('todayTitle2') }}</h1>
          </div>
          <div class="streak" :class="{ lit: currentStreak > 0 }">
            <ion-icon :icon="flame" />
            <strong>{{ currentStreak }}</strong>
            <span>{{ currentStreak === 1 ? t('dayOne') : t('dayMany') }}</span>
          </div>
        </header>

        <button type="button" class="plan-pill" @click="openPlan">
          <span class="lv">
            <span v-for="l in selectedLevels()" :key="l" class="chip lvl">{{ l }}</span>
          </span>
          <span class="goal">{{ t('perDayShort', { n: state.settings.dailyGoal, words: words(state.settings.dailyGoal) }) }}</span>
          <span class="edit"><ion-icon :icon="optionsOutline" /> {{ t('change') }}</span>
        </button>

        <div class="progress panel">
          <div class="bar"><div class="fill" :style="{ width: pct + '%' }" /></div>
          <p>
            <strong>{{ t('practisedOf', { a: today.practised.length, b: todayWords.length }) }}</strong> {{ t('practisedLabel') }}
            <span class="muted"> · {{ t('practiseHint') }}</span>
          </p>
        </div>

        <div v-if="today.completed" class="done-banner panel">
          <p class="serif">{{ t('doneTitle') }}</p>
          <p class="muted">
            {{ t('doneText') }}
            <template v-if="dueCount > 0"> {{ t('dueLeft', { n: dueCount }) }}</template>
          </p>
          <ion-button v-if="dueCount > 0" router-link="/tabs/review" color="secondary">{{ t('reviewNow') }}</ion-button>
        </div>

        <WordCard
          v-for="w in todayWords"
          :key="w.id"
          :word="w"
          :practised="today.practised.includes(w.id)"
          @practise="openPractice"
        />

        <p v-if="todayWords.length === 0" class="muted empty">
          {{ t('allLearnedToday') }}
        </p>

        <ion-button v-if="remaining > 0" expand="block" fill="clear" class="more" @click="more">
          <ion-icon slot="start" :icon="addCircleOutline" />
          {{ t('moreWords', { n: state.settings.dailyGoal }) }}
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonPage, IonContent, IonIcon, IonButton, modalController } from '@ionic/vue'
import { addCircleOutline, flame, optionsOutline } from 'ionicons/icons'
import WordCard from '@/components/WordCard.vue'
import PracticeModal from '@/components/PracticeModal.vue'
import PlanModal from '@/components/PlanModal.vue'
import type { Word } from '@/data/words'
import { prettyDate } from '@/lib/date'
import { t, words } from '@/lib/i18n'
import { addWords, currentStreak, dueCount, remainingNewWords, selectedLevels, state, stats, today, todayWords, ui } from '@/lib/store'

const pct = computed(() => (todayWords.value.length ? (today.value.practised.length / todayWords.value.length) * 100 : 0))
const remaining = computed(() => {
  void Object.keys(state.cards).length
  return remainingNewWords()
})

async function openPlan() {
  const modal = await modalController.create({ component: PlanModal, initialBreakpoint: 1, breakpoints: [0, 1] })
  await modal.present()
}

async function openPractice(word: Word) {
  const modal = await modalController.create({ component: PracticeModal, componentProps: { word } })
  await modal.present()
}

function more() {
  addWords(state.settings.dailyGoal)
}
</script>

<style scoped>
.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: calc(var(--ion-safe-area-top, 0px) + 20px) 0 18px;
}
.plan-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin: -4px 0 12px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px dashed var(--line);
  background: transparent;
  color: var(--ink);
  font-size: 14px;
  text-align: left;
}
.plan-pill .lv {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.chip.lvl {
  background: var(--ink);
  color: var(--paper);
}
.plan-pill .goal {
  flex: 1;
  font-weight: 600;
}
.plan-pill .edit {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--ink-soft);
  font-size: 13px;
}
.streak {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 64px;
  padding: 10px 8px;
  border-radius: 18px;
  background: var(--card);
  border: 1px solid var(--line);
  color: var(--ink-soft);
  font-size: 12px;
}
.streak ion-icon {
  font-size: 22px;
}
.streak strong {
  font-size: 22px;
  line-height: 1.1;
  color: var(--ink);
}
.streak.lit {
  background: var(--amber-soft);
  border-color: transparent;
}
.streak.lit ion-icon {
  color: var(--amber);
}
.progress {
  margin-bottom: 16px;
  padding: 14px 16px;
}
.progress p {
  margin: 10px 0 0;
  font-size: 14px;
}
.bar {
  height: 10px;
  border-radius: 999px;
  background: var(--line);
  overflow: hidden;
}
.fill {
  height: 100%;
  border-radius: inherit;
  background: var(--amber);
  transition: width 0.4s ease;
}
.done-banner {
  margin-bottom: 16px;
  background: var(--das-soft);
  border-color: transparent;
}
.done-banner .serif {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px;
}
.done-banner p {
  margin: 0 0 8px;
}
.more {
  margin-top: 4px;
}
.empty {
  text-align: center;
  padding: 24px 8px;
}
</style>
