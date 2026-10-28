<template>
  <article class="word-card" :class="{ done: practised }">
    <div class="top">
      <div class="head" @click="open = !open">
        <div class="meta">
          <span v-if="word.article" class="chip" :class="`bg-${word.article}`">{{ word.article }}</span>
          <span v-else class="chip">{{ posLabel }}</span>
          <span class="chip level">{{ word.level }}</span>
          <span v-if="practised" class="chip ok"><ion-icon :icon="checkmark" /> {{ t('practisedChip') }}</span>
        </div>
        <h2 class="word serif" lang="de" :style="{ fontSize: fitFont(headword(word), 160, 30) }">
          <span v-if="word.article" :class="`art-${word.article}`">{{ word.article }}</span> {{ word.de }}
        </h2>
        <p class="en">{{ word.en }}</p>
        <p v-if="word.plural" class="extra">{{ t('plural') }}: {{ word.plural }}</p>
        <p v-if="word.conj" class="extra">{{ word.conj }}</p>
      </div>
      <button class="speak" :aria-label="t('listenWord')" @click.stop="speak(headword(word))">
        <ion-icon :icon="volumeHighOutline" />
      </button>
    </div>

    <div v-if="open" class="body">
      <div class="example">
        <p class="de">
          {{ word.example.de }}
          <button class="mini-speak" :aria-label="t('listenSentence')" @click="speak(word.example.de)">
            <ion-icon :icon="volumeMediumOutline" />
          </button>
        </p>
        <p class="muted">{{ word.example.en }}</p>
      </div>
      <p v-if="word.usage" class="usage"><strong>{{ t('tip') }}</strong> {{ tipText(word.usage) }}</p>
      <p v-if="lastSentence" class="mine"><span class="eyebrow">{{ t('yourSentence') }}</span><br />{{ lastSentence }}</p>
    </div>

    <ion-button expand="block" :fill="practised ? 'outline' : 'solid'" class="practise" @click="$emit('practise', word)">
      <ion-icon slot="start" :icon="createOutline" />
      {{ practised ? t('writeAnother') : t('writeOwn') }}
    </ion-button>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { IonButton, IonIcon } from '@ionic/vue'
import { checkmark, createOutline, volumeHighOutline, volumeMediumOutline } from 'ionicons/icons'
import { headword, type Word } from '@/data/words'
import { speak } from '@/lib/device'
import { fitFont } from '@/lib/check'
import { state } from '@/lib/store'
import { t, tipText } from '@/lib/i18n'

const props = defineProps<{ word: Word; practised: boolean; startOpen?: boolean }>()
defineEmits<{ practise: [word: Word] }>()

const open = ref(props.startOpen || !props.practised)
const lastSentence = computed(() => state.sentences[props.word.id]?.[0]?.text)

const posLabel = computed(() => t(`pos_${props.word.pos}`))
</script>

<style scoped>
.word-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 14px;
}
.word-card.done {
  border-color: color-mix(in srgb, var(--ok) 35%, var(--line));
}
.top {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.head {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}
.meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.chip.ok {
  background: var(--das-soft);
  color: var(--ok);
}
.word {
  font-size: 30px;
  font-weight: 600;
  margin: 10px 0 2px;
  line-height: 1.15;
  hyphens: auto;
  -webkit-hyphens: auto;
  overflow-wrap: break-word;
}
.en {
  font-size: 17px;
  margin: 0;
}
.extra {
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--ink-soft);
}
.speak {
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: var(--amber-soft);
  color: var(--ink);
  font-size: 22px;
  display: grid;
  place-items: center;
}
.body {
  margin-top: 14px;
  border-top: 1px dashed var(--line);
  padding-top: 12px;
}
.example .de {
  font-family: var(--serif);
  font-size: 18px;
  margin: 0 0 4px;
  line-height: 1.4;
}
.example .muted {
  margin: 0;
  font-size: 14px;
}
.mini-speak {
  border: none;
  background: none;
  color: var(--ink-soft);
  font-size: 18px;
  vertical-align: middle;
  padding: 0 4px;
}
.usage {
  margin: 12px 0 0;
  padding: 8px 12px;
  border-radius: 12px;
  background: var(--amber-soft);
  font-size: 14px;
}
.mine {
  margin: 12px 0 0;
  font-size: 15px;
  font-style: italic;
}
.practise {
  margin-top: 14px;
  min-height: 46px;
}
</style>
