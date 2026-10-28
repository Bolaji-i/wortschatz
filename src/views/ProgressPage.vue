<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="page">
        <header class="hero">
          <p class="eyebrow">{{ t('progressEyebrow') }}</p>
          <h1 class="big-title">{{ t('progressTitle') }}</h1>
        </header>

        <div class="tiles">
          <div class="tile panel"><strong class="serif">{{ stats.learned }}</strong><span>{{ t('tileLearned') }}</span></div>
          <div class="tile panel"><strong class="serif">{{ stats.mastered }}</strong><span>{{ t('tileMastered') }}</span></div>
          <div class="tile panel"><strong class="serif">{{ currentStreak }}</strong><span>{{ t('tileStreak', { n: state.streak.longest }) }}</span></div>
          <div class="tile panel"><strong class="serif">{{ stats.sentences }}</strong><span>{{ t('tileSentences') }}</span></div>
        </div>

        <div class="panel week">
          <p class="eyebrow">{{ t('last7') }}</p>
          <div class="bars">
            <div v-for="d in week" :key="d.key" class="col">
              <div class="stack" :title="t('dayBar', { p: d.practised, r: d.reviewed })">
                <div class="seg rev" :style="{ height: (d.reviewed / maxDay) * 100 + '%' }" />
                <div class="seg prac" :style="{ height: (d.practised / maxDay) * 100 + '%' }" />
              </div>
              <span :class="{ today: d.key === ui.today }">{{ d.label }}</span>
            </div>
          </div>
          <p class="legend"><i class="dot prac" /> {{ t('legendPractised') }} <i class="dot rev" /> {{ t('legendReviewed') }}</p>
        </div>

        <div class="panel overall">
          <p class="eyebrow">{{ t('byLevel', { a: stats.learned, b: stats.total.toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB') }) }}</p>
          <div v-for="l in LEVELS" :key="l" class="lvl-row" :class="{ off: !state.settings.levels.includes(l) }">
            <span class="lvl serif">{{ l }}</span>
            <div class="bar"><div class="fill" :style="{ width: (levelStats[l].learned / levelStats[l].total) * 100 + '%' }" /></div>
            <span class="num">{{ levelStats[l].learned }}/{{ levelStats[l].total }}</span>
          </div>
        </div>

        <ion-searchbar v-model="query" :placeholder="t('searchLearned')" class="search" />

        <div class="list">
          <button v-for="w in filtered" :key="w.id" class="row" @click="selected = w">
            <div class="left">
              <span class="serif name"><span v-if="w.article" :class="`art-${w.article}`">{{ w.article }}&nbsp;</span>{{ w.de }}</span>
              <span class="muted en">{{ w.en }}</span>
            </div>
            <span class="boxes" :aria-label="t('stage', { n: state.cards[w.id]?.box ?? 0 })">
              <i v-for="i in 6" :key="i" :class="{ on: (state.cards[w.id]?.box ?? 0) >= i }" />
            </span>
          </button>
          <p v-if="!filtered.length" class="muted empty">{{ t('noWordsYet') }}</p>
        </div>
      </div>

      <ion-modal :is-open="!!selected" :initial-breakpoint="0.75" :breakpoints="[0, 0.75, 1]" @did-dismiss="selected = null">
        <ion-content v-if="selected">
          <div class="page detail">
            <WordCard :word="selected" :practised="false" :start-open="true" @practise="practise" />
            <p class="eyebrow">{{ t('yourSentences') }}</p>
            <p v-for="(s, i) in state.sentences[selected.id] ?? []" :key="i" class="sentence serif">
              „{{ s.text }}“ <span class="muted date">{{ s.date }}</span>
            </p>
            <p v-if="!(state.sentences[selected.id] ?? []).length" class="muted">{{ t('noSentences') }}</p>
            <p class="muted small">{{ t('nextReview', { d: prettyDate(state.cards[selected.id]?.due ?? ui.today) }) }}</p>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { IonPage, IonContent, IonSearchbar, IonModal, modalController } from '@ionic/vue'
import WordCard from '@/components/WordCard.vue'
import PracticeModal from '@/components/PracticeModal.vue'
import { WORD_BY_ID, type Word } from '@/data/words'
import { lastNDays, prettyDate, weekdayShort } from '@/lib/date'
import { currentStreak, levelStats, state, stats, ui } from '@/lib/store'
import { LEVELS } from '@/data/words'
import { lang, t } from '@/lib/i18n'

const query = ref('')
const selected = ref<Word | null>(null)

const learned = computed(() =>
  Object.entries(state.cards)
    .sort((a, b) => (a[1].introduced < b[1].introduced ? 1 : -1))
    .map(([id]) => WORD_BY_ID[id])
    .filter(Boolean)
)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return learned.value
  return learned.value.filter(w => w.de.toLowerCase().includes(q) || w.en.toLowerCase().includes(q))
})

const week = computed(() => {
  void lang.value // re-label the weekdays when the interface language changes
  return lastNDays(7, ui.today).map(key => {
    const d = state.days[key]
    return { key, label: weekdayShort(key), practised: d?.practised.length ?? 0, reviewed: d?.reviewed ?? 0 }
  })
})
const maxDay = computed(() => Math.max(5, ...week.value.map(d => d.practised + d.reviewed)))

async function practise(word: Word) {
  selected.value = null
  const modal = await modalController.create({ component: PracticeModal, componentProps: { word } })
  await modal.present()
}
</script>

<style scoped>
.hero {
  padding: calc(var(--ion-safe-area-top, 0px) + 20px) 0 18px;
}
.tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}
.tile {
  display: flex;
  flex-direction: column;
  padding: 14px;
}
.tile strong {
  font-size: 34px;
  font-weight: 600;
  line-height: 1.1;
}
.tile span {
  font-size: 13px;
  color: var(--ink-soft);
}
.week,
.overall {
  margin-bottom: 12px;
}
.bars {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  height: 120px;
  margin-top: 12px;
}
.col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.stack {
  flex: 1;
  width: 100%;
  max-width: 28px;
  border-radius: 8px;
  background: var(--paper);
  display: flex;
  flex-direction: column-reverse;
  overflow: hidden;
}
.seg {
  width: 100%;
  transition: height 0.4s ease;
}
.seg.prac,
.dot.prac {
  background: var(--amber);
}
.seg.rev,
.dot.rev {
  background: var(--der);
}
.col span {
  font-size: 12px;
  color: var(--ink-soft);
}
.col span.today {
  color: var(--ink);
  font-weight: 700;
}
.legend {
  font-size: 12px;
  color: var(--ink-soft);
  margin: 10px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 3px;
}
.lvl-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}
.lvl-row.off {
  opacity: 0.45;
}
.lvl {
  width: 28px;
  font-weight: 600;
  font-size: 16px;
}
.num {
  min-width: 64px;
  text-align: right;
  font-size: 12px;
  color: var(--ink-soft);
}
.bar {
  flex: 1;
  height: 10px;
  border-radius: 999px;
  background: var(--line);
  overflow: hidden;
}
.fill {
  height: 100%;
  background: var(--ink);
}
.search {
  padding: 4px 0 8px;
  --border-radius: 14px;
  --background: var(--card);
  --box-shadow: none;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  text-align: left;
}
.left {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.name {
  font-size: 18px;
  font-weight: 600;
}
.en {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.boxes {
  display: flex;
  gap: 3px;
  flex: none;
}
.boxes i {
  width: 6px;
  height: 16px;
  border-radius: 3px;
  background: var(--line);
}
.boxes i.on {
  background: var(--ok);
}
.empty {
  text-align: center;
  padding: 20px;
}
.detail {
  padding-top: 20px;
}
.sentence {
  font-size: 17px;
  margin: 6px 0;
}
.date {
  font-family: var(--ion-font-family);
  font-size: 12px;
}
.small {
  font-size: 13px;
  margin-top: 16px;
}
</style>
