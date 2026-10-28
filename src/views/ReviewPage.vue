<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="page">
        <!-- Start screen -->
        <template v-if="phase === 'start'">
          <header class="hero">
            <p class="eyebrow">{{ t('reviewEyebrow') }}</p>
            <h1 class="big-title">{{ t('reviewTitle') }}</h1>
          </header>
          <div class="panel start">
            <template v-if="dueCount > 0">
              <p class="count serif">{{ dueCount }}</p>
              <p>{{ dueCount === 1 ? t('dueOne') : t('dueMany') }}</p>
              <p class="muted small">{{ t('srsHint') }}</p>
              <ion-button expand="block" size="large" @click="start">{{ t('letsGo') }}</ion-button>
            </template>
            <template v-else>
              <p class="count serif">✓</p>
              <p>{{ t('allReviewed') }}</p>
              <p v-if="nextDueDate" class="muted small">{{ t('nextReview', { d: prettyDate(nextDueDate) }) }}</p>
              <p v-else class="muted small">{{ t('learnFirst') }}</p>
              <ion-button v-if="practiceable.length >= 4" expand="block" fill="outline" @click="start(true)">{{ t('practiseAnyway') }}</ion-button>
            </template>
          </div>
        </template>

        <!-- Question -->
        <template v-else-if="phase === 'quiz' && q">
          <div class="quiz-top">
            <ion-button fill="clear" size="small" @click="phase = 'summary'">{{ t('quit') }}</ion-button>
            <span class="muted">{{ index + 1 }} / {{ queue.length }}</span>
          </div>
          <div class="bar"><div class="fill" :style="{ width: ((index) / queue.length) * 100 + '%' }" /></div>

          <div class="question panel">
            <p class="eyebrow">{{ t(q.label) }}</p>
            <h2 lang="de" class="serif prompt" :class="q.type === 'cloze' ? 'cloze' : ''" :style="q.type === 'cloze' ? {} : { fontSize: fitFont(q.prompt, 90, 32) }">{{ q.prompt }}</h2>
            <p v-if="q.sub" class="muted">{{ q.sub }}</p>
            <button v-if="q.speakText" class="speak" @click="speak(q.speakText)"><ion-icon :icon="volumeHighOutline" /></button>
          </div>

          <div v-if="q.type === 'cloze'" class="type-answer">
            <ion-input
              ref="inputRef"
              v-model="typed"
              class="answer-input"
              :placeholder="t('missingWord')"
              autocapitalize="off"
              :disabled="answered"
              @keyup.enter="submitTyped"
            />
            <ion-button v-if="!answered" expand="block" :disabled="!typed.trim()" @click="submitTyped">{{ t('check') }}</ion-button>
            <ion-button v-if="!answered" expand="block" fill="clear" @click="answer(false)">{{ t('dontKnow') }}</ion-button>
          </div>

          <div v-else class="options" :class="{ articles: q.type === 'article' }">
            <button
              v-for="opt in q.options"
              :key="opt"
              class="option"
              :class="optionClass(opt)"
              :disabled="answered"
              @click="choose(opt)"
            >
              {{ opt }}
            </button>
          </div>

          <div v-if="answered" class="feedback" :class="wasCorrect ? 'right' : 'wrong'">
            <p class="verdict">{{ wasCorrect ? t('right') : t('wrong') }}</p>
            <p class="serif solution">{{ headword(q.word) }} — {{ q.word.en }}</p>
            <p class="muted">{{ q.word.example.de }}</p>
            <ion-button expand="block" @click="next">{{ index + 1 < queue.length ? t('next') : t('done') }}</ion-button>
          </div>
        </template>

        <!-- Summary -->
        <template v-else-if="phase === 'summary'">
          <header class="hero">
            <p class="eyebrow">{{ t('result') }}</p>
            <h1 class="big-title">{{ summaryTitle }}</h1>
          </header>
          <div class="panel start">
            <p class="count serif">{{ correctCount }}/{{ answeredCount }}</p>
            <p>{{ t('answeredCorrectly') }}</p>
            <div v-if="missed.length" class="missed">
              <p class="eyebrow">{{ t('missedHint') }}</p>
              <p v-for="w in missed" :key="w.id"><strong class="serif">{{ headword(w) }}</strong> <span class="muted">— {{ w.en }}</span></p>
            </div>
            <ion-button expand="block" @click="phase = 'start'">{{ t('back') }}</ion-button>
          </div>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { IonPage, IonContent, IonButton, IonIcon, IonInput } from '@ionic/vue'
import { volumeHighOutline } from 'ionicons/icons'
import { WORDS, WORD_BY_ID, headword, type Word } from '@/data/words'
import { prettyDate } from '@/lib/date'
import { speak } from '@/lib/device'
import { fitFont, makeCloze, normalizeAnswer } from '@/lib/check'
import { dueCount, dueWords, nextDueDate, recordReview, state } from '@/lib/store'
import { t } from '@/lib/i18n'

type QType = 'meaning' | 'reverse' | 'article' | 'cloze'
interface Question {
  word: Word
  type: QType
  label: 'qArticle' | 'qReverse' | 'qCloze' | 'qMeaning'
  prompt: string
  sub?: string
  speakText?: string
  options: string[]
  answer: string
}

const phase = ref<'start' | 'quiz' | 'summary'>('start')
const queue = ref<Question[]>([])
const index = ref(0)
const answered = ref(false)
const wasCorrect = ref(false)
const picked = ref<string | null>(null)
const typed = ref('')
const results = ref<{ id: string; correct: boolean }[]>([])
const inputRef = ref()
let countsForSrs = true

const q = computed(() => queue.value[index.value])
const practiceable = computed(() => Object.keys(state.cards).map(id => WORD_BY_ID[id]).filter(Boolean))
const correctCount = computed(() => results.value.filter(r => r.correct).length)
const answeredCount = computed(() => results.value.length)
const missed = computed(() => results.value.filter(r => !r.correct).map(r => WORD_BY_ID[r.id]))
const summaryTitle = computed(() => {
  const ratio = answeredCount.value ? correctCount.value / answeredCount.value : 0
  return ratio >= 0.9 ? t('sumGreat') : ratio >= 0.6 ? t('sumGood') : t('sumKeepGoing')
})

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function distractors(word: Word, pick: (w: Word) => string, n = 3): string[] {
  const correct = pick(word)
  const samePos = shuffle(WORDS.filter(w => w.id !== word.id && w.pos === word.pos))
  const out: string[] = []
  for (const w of [...samePos, ...shuffle(WORDS)]) {
    const val = pick(w)
    if (val !== correct && !out.includes(val)) out.push(val)
    if (out.length === n) break
  }
  return out
}

function buildQuestion(word: Word): Question {
  const card = state.cards[word.id]
  const types: QType[] = ['meaning', 'reverse']
  if (word.article) types.push('article')
  if ((card?.box ?? 0) >= 1 && makeCloze(word)) types.push('cloze', 'cloze')
  const type = types[Math.floor(Math.random() * types.length)]

  if (type === 'article') {
    return { word, type, label: 'qArticle', prompt: word.de, sub: word.en, options: ['der', 'die', 'das'], answer: word.article!, speakText: undefined }
  }
  if (type === 'reverse') {
    const ans = headword(word)
    return { word, type, label: 'qReverse', prompt: word.en, options: shuffle([ans, ...distractors(word, headword)]), answer: ans }
  }
  if (type === 'cloze') {
    const c = makeCloze(word)!
    return { word, type, label: 'qCloze', prompt: c.text, sub: `${word.en}${word.article ? ' · ' + word.article + ' …' : ''}`, options: [], answer: c.answer }
  }
  return { word, type, label: 'qMeaning', prompt: headword(word), speakText: headword(word), options: shuffle([word.en, ...distractors(word, w => w.en)]), answer: word.en }
}

function start(extra = false) {
  countsForSrs = extra !== true
  const words = countsForSrs ? dueWords(20) : shuffle(practiceable.value).slice(0, 10)
  queue.value = shuffle(words).map(buildQuestion)
  index.value = 0
  results.value = []
  resetAnswer()
  phase.value = 'quiz'
}

function resetAnswer() {
  answered.value = false
  picked.value = null
  typed.value = ''
}

function answer(correct: boolean) {
  answered.value = true
  wasCorrect.value = correct
  results.value.push({ id: q.value.word.id, correct })
  if (countsForSrs) recordReview(q.value.word.id, correct)
  if (correct) speak(q.value.type === 'cloze' ? q.value.word.example.de : headword(q.value.word))
}

function choose(opt: string) {
  picked.value = opt
  answer(opt === q.value.answer)
}

function submitTyped() {
  if (!typed.value.trim() || answered.value) return
  answer(normalizeAnswer(typed.value) === normalizeAnswer(q.value.answer))
}

function optionClass(opt: string) {
  if (!answered.value) return ''
  if (opt === q.value.answer) return 'correct'
  if (opt === picked.value) return 'incorrect'
  return 'faded'
}

async function next() {
  if (index.value + 1 >= queue.value.length) {
    phase.value = 'summary'
    return
  }
  index.value++
  resetAnswer()
  await nextTick()
  if (q.value?.type === 'cloze') inputRef.value?.$el?.setFocus?.()
}
</script>

<style scoped>
.hero {
  padding: calc(var(--ion-safe-area-top, 0px) + 20px) 0 18px;
}
.start {
  text-align: center;
  padding: 28px 20px;
}
.start p {
  margin: 0 0 8px;
}
.count {
  font-size: 64px !important;
  font-weight: 600;
  line-height: 1;
  margin-bottom: 8px !important;
}
.small {
  font-size: 13px;
  margin-bottom: 18px !important;
}
.quiz-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: calc(var(--ion-safe-area-top, 0px) + 8px);
}
.bar {
  height: 8px;
  border-radius: 999px;
  background: var(--line);
  overflow: hidden;
  margin-bottom: 18px;
}
.fill {
  height: 100%;
  background: var(--amber);
  transition: width 0.3s ease;
}
.question {
  position: relative;
  text-align: center;
  padding: 28px 18px;
  margin-bottom: 16px;
}
.prompt {
  hyphens: auto;
  -webkit-hyphens: auto;
  overflow-wrap: break-word;
  font-size: 32px;
  font-weight: 600;
  margin: 8px 0 4px;
  line-height: 1.2;
}
.prompt.cloze {
  font-size: 21px;
  font-weight: 500;
  line-height: 1.45;
}
.speak {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: var(--amber-soft);
  color: var(--ink);
  font-size: 18px;
  display: grid;
  place-items: center;
}
.options {
  display: grid;
  gap: 10px;
}
.options.articles {
  grid-template-columns: repeat(3, 1fr);
}
.option {
  min-height: 56px;
  padding: 12px 16px;
  border-radius: 16px;
  border: 1.5px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font-size: 17px;
  text-align: left;
  transition: all 0.15s ease;
}
.articles .option {
  text-align: center;
  font-family: var(--serif);
  font-size: 22px;
  font-weight: 600;
}
.option:active {
  transform: scale(0.98);
}
.option.correct {
  border-color: var(--ok);
  background: var(--das-soft);
  color: var(--ok);
  font-weight: 600;
}
.option.incorrect {
  border-color: var(--bad);
  background: var(--die-soft);
  color: var(--bad);
}
.option.faded {
  opacity: 0.45;
}
.type-answer ion-button {
  margin-top: 10px;
}
.answer-input {
  --padding-start: 16px;
  --background: var(--card);
  border: 1.5px solid var(--line);
  border-radius: 16px;
  font-size: 20px;
  min-height: 56px;
}
.feedback {
  margin-top: 16px;
  padding: 16px;
  border-radius: 16px;
}
.feedback.right {
  background: var(--das-soft);
}
.feedback.wrong {
  background: var(--die-soft);
}
.feedback p {
  margin: 0 0 6px;
}
.verdict {
  font-weight: 700;
}
.solution {
  font-size: 20px;
}
.missed {
  text-align: left;
  margin: 18px 0;
  padding-top: 14px;
  border-top: 1px dashed var(--line);
}
.missed p {
  margin: 0 0 6px;
}
</style>
