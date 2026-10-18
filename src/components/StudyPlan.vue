<template>
  <div class="plan">
    <section>
      <h3>Welche Wörter möchtest du lernen?</h3>
      <p class="hint">Wähle ein Niveau – oder kombiniere mehrere. Jedes gewählte Niveau bekommt gleich viele Wörter pro Tag.</p>
      <div class="levels">
        <button
          v-for="l in LEVELS"
          :key="l"
          type="button"
          class="level"
          :class="[{ on: isOn(l) }, `lv-${l}`]"
          :aria-pressed="isOn(l)"
          @click="toggle(l)"
        >
          <span class="tick"><ion-icon :icon="isOn(l) ? checkmarkCircle : ellipseOutline" /></span>
          <strong class="code serif">{{ l }}</strong>
          <span class="name">{{ INFO[l].name }}</span>
          <span class="desc">{{ INFO[l].desc }}</span>
          <span class="bar"><i :style="{ width: pct(l) + '%' }" /></span>
          <span class="count">{{ levelStats[l].learned }} / {{ levelStats[l].total }} gelernt</span>
        </button>
      </div>
    </section>

    <section>
      <h3>Neue Wörter pro Tag</h3>
      <div class="stepper">
        <button type="button" class="step" aria-label="Weniger" :disabled="goal <= MIN_GOAL" @click="setGoal(goal - 1)">
          <ion-icon :icon="remove" />
        </button>
        <div class="value">
          <strong class="serif">{{ goal }}</strong>
          <span>{{ goal === 1 ? 'Wort' : 'Wörter' }} pro Tag</span>
        </div>
        <button type="button" class="step" aria-label="Mehr" :disabled="goal >= MAX_GOAL" @click="setGoal(goal + 1)">
          <ion-icon :icon="add" />
        </button>
      </div>
      <div class="presets">
        <button v-for="n in PRESETS" :key="n" type="button" class="preset" :class="{ on: goal === n }" @click="setGoal(n)">{{ n }}</button>
      </div>
      <p class="mix">
        <ion-icon :icon="layersOutline" />
        <span>Jeden Tag: <template v-for="(n, l, i) in split" :key="l"><template v-if="i">, </template><b>{{ n }}× {{ l }}</b></template></span>
      </p>
      <p class="hint">
        {{ estimate }}
        <template v-if="goal > 15"> Tipp: Viele neue Wörter bedeuten später auch viele Wiederholungen.</template>
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon, toastController } from '@ionic/vue'
import { add, checkmarkCircle, ellipseOutline, layersOutline, remove } from 'ionicons/icons'
import { LEVELS, type Level } from '@/data/words'
import { MAX_GOAL, MIN_GOAL, dailySplit, levelStats, selectedLevels, state } from '@/lib/store'

const emit = defineEmits<{ change: [] }>()

const PRESETS = [3, 5, 10, 15, 20]
const INFO: Record<Level, { name: string; desc: string }> = {
  A2: { name: 'Grundlagen', desc: 'Alltagswörter, die man oft verpasst' },
  B1: { name: 'Mittelstufe', desc: 'Beruf, Gefühle, Gesellschaft' },
  B2: { name: 'Fortgeschritten', desc: 'Argumentieren, Wirtschaft, Redewendungen' },
  C1: { name: 'Gehoben', desc: 'Präzise & elegant ausdrücken' }
}

const goal = computed(() => state.settings.dailyGoal)
const split = computed(() => dailySplit(goal.value))
const isOn = (l: Level) => state.settings.levels.includes(l)
const pct = (l: Level) => (levelStats.value[l].learned / levelStats.value[l].total) * 100

const estimate = computed(() => {
  const left = selectedLevels().reduce((n, l) => n + levelStats.value[l].total - levelStats.value[l].learned, 0)
  if (!left) return 'Du hast alle Wörter dieser Niveaus gelernt – wähle ein weiteres Niveau!'
  const days = Math.ceil(left / goal.value)
  const span = days < 60 ? `${days} Tagen` : days < 730 ? `${Math.round(days / 30)} Monaten` : `${(days / 365).toFixed(1).replace('.', ',')} Jahren`
  return `${left} neue Wörter in deiner Auswahl – bei diesem Tempo in etwa ${span} geschafft.`
})

async function toggle(l: Level) {
  const set = new Set(state.settings.levels)
  if (set.has(l)) {
    if (set.size === 1) {
      const t = await toastController.create({ message: 'Wähle mindestens ein Niveau.', duration: 1600, position: 'top', color: 'warning' })
      await t.present()
      return
    }
    set.delete(l)
  } else set.add(l)
  state.settings.levels = LEVELS.filter(x => set.has(x))
  emit('change')
}

function setGoal(n: number) {
  state.settings.dailyGoal = Math.min(MAX_GOAL, Math.max(MIN_GOAL, n))
  emit('change')
}
</script>

<style scoped>
section + section {
  margin-top: 22px;
}
h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 4px;
}
.hint {
  font-size: 13px;
  color: var(--ink-soft);
  margin: 4px 0 12px;
  line-height: 1.45;
}
.levels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.level {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 14px 12px 12px;
  border-radius: 16px;
  border: 1.5px solid var(--line);
  background: var(--card);
  color: var(--ink);
  text-align: left;
  transition: border-color 0.15s, background 0.15s, transform 0.1s;
}
.level:active {
  transform: scale(0.98);
}
.level.on {
  border-color: var(--ink);
  background: var(--amber-soft);
}
.tick {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 22px;
  color: var(--ink-soft);
  line-height: 0;
}
.level.on .tick {
  color: var(--ink);
}
.code {
  font-size: 28px;
  font-weight: 600;
  line-height: 1;
}
.name {
  font-weight: 700;
  font-size: 14px;
  margin-top: 4px;
}
.desc {
  font-size: 12px;
  color: var(--ink-soft);
  line-height: 1.35;
  min-height: 32px;
}
.bar {
  width: 100%;
  height: 5px;
  border-radius: 999px;
  background: var(--line);
  overflow: hidden;
  margin-top: 8px;
}
.bar i {
  display: block;
  height: 100%;
  background: var(--ok);
}
.count {
  font-size: 11px;
  color: var(--ink-soft);
  margin-top: 4px;
}
.stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  padding: 10px;
  border-radius: 18px;
  background: var(--paper);
  border: 1px solid var(--line);
}
.step {
  width: 52px;
  height: 52px;
  flex: none;
  border-radius: 14px;
  border: none;
  background: var(--ink);
  color: var(--paper);
  font-size: 24px;
  display: grid;
  place-items: center;
}
.step:disabled {
  opacity: 0.3;
}
.value {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.value strong {
  font-size: 40px;
  font-weight: 600;
  line-height: 1;
}
.value span {
  font-size: 13px;
  color: var(--ink-soft);
}
.presets {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.preset {
  flex: 1;
  min-height: 40px;
  border-radius: 12px;
  border: 1.5px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font-weight: 600;
  font-size: 15px;
}
.preset.on {
  border-color: var(--ink);
  background: var(--ink);
  color: var(--paper);
}
.mix {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 14px 0 0;
  font-size: 14px;
}
.mix ion-icon {
  font-size: 18px;
  color: var(--ink-soft);
  flex: none;
}
</style>
