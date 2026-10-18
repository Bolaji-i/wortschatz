<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="close()">Schließen</ion-button>
      </ion-buttons>
      <ion-title>Satz üben</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <div class="page">
      <div class="target">
        <h2 class="serif" lang="de" :style="{ fontSize: fitFont(headword(word), 48, 32) }">
          <span v-if="word.article" :class="`art-${word.article}`">{{ word.article }}</span> {{ word.de }}
        </h2>
        <p class="muted">{{ word.en }}</p>
      </div>

      <p class="prompt"><ion-icon :icon="bulbOutline" /> {{ prompt }}</p>

      <ion-textarea
        v-model="text"
        class="sentence"
        :auto-grow="true"
        :rows="3"
        autocapitalize="sentences"
        :spellcheck="false"
        placeholder="Schreib hier deinen Satz …"
        @ion-input="result = null; ai = null; aiError = ''"
      />

      <div class="actions">
        <ion-button fill="outline" :disabled="!text.trim()" @click="check">Prüfen</ion-button>
        <ion-button :disabled="!canSave" @click="save">Speichern</ion-button>
      </div>

      <div v-if="result" class="result" :class="result.problems.length ? 'warn' : 'good'">
        <p class="verdict">
          <ion-icon :icon="result.problems.length ? alertCircleOutline : checkmarkCircleOutline" />
          {{ result.problems.length ? 'Fast! Schau dir das an:' : 'Sieht gut aus!' }}
        </p>
        <ul v-if="result.problems.length">
          <li v-for="p in result.problems" :key="p">{{ p }}</li>
        </ul>
        <ul class="tips">
          <li v-for="t in result.tips" :key="t">{{ t }}</li>
        </ul>
      </div>

      <div v-if="aiLoading" class="result ai"><ion-spinner name="dots" /> KI prüft deinen Satz …</div>
      <div v-else-if="ai" class="result ai">
        <p class="verdict">
          <ion-icon :icon="sparklesOutline" />
          {{ ai.correct ? 'Richtig! 🎉' : 'Korrektur' }}
        </p>
        <p v-if="!ai.correct" class="corrected serif">{{ ai.corrected }}</p>
        <p>{{ ai.explanation }}</p>
        <p v-if="ai.alternative" class="alt"><span class="eyebrow">Noch ein Beispiel</span><br /><span class="serif">{{ ai.alternative }}</span></p>
        <ion-button v-if="!ai.correct" size="small" fill="clear" @click="useCorrection">Korrektur übernehmen</ion-button>
      </div>
      <p v-else-if="aiError" class="ai-error">{{ aiError }}</p>

      <div class="example">
        <span class="eyebrow">Beispiel</span>
        <p class="serif">{{ word.example.de }}</p>
        <p class="muted">{{ word.example.en }}</p>
      </div>

      <div v-if="previous.length" class="previous">
        <span class="eyebrow">Deine bisherigen Sätze</span>
        <p v-for="(s, i) in previous" :key="i" class="serif">„{{ s.text }}“</p>
      </div>
    </div>
  </ion-content>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonTextarea, IonIcon, IonSpinner, alertController, modalController, toastController } from '@ionic/vue'
import { alertCircleOutline, bulbOutline, checkmarkCircleOutline, sparklesOutline } from 'ionicons/icons'
import { headword, type Word } from '@/data/words'
import { checkSentence, fitFont, type CheckResult } from '@/lib/check'
import { getAiFeedback, type AiFeedback } from '@/lib/ai'
import { saveSentence, state } from '@/lib/store'

const props = defineProps<{ word: Word }>()

const text = ref('')
const result = ref<CheckResult | null>(null)
const ai = ref<AiFeedback | null>(null)
const aiLoading = ref(false)
const aiError = ref('')

const previous = computed(() => (state.sentences[props.word.id] ?? []).slice(0, 5))
const canSave = computed(() => text.value.trim().length > 0)

const PROMPTS = [
  'Schreib über deinen Arbeitstag.',
  'Schreib über etwas, das dir gestern passiert ist.',
  'Schreib eine Frage, die du einem Kollegen stellen würdest.',
  'Schreib über deine Pläne für das Wochenende.',
  'Schreib über München oder deine Stadt.',
  'Schreib über eine Person, die du kennst.',
  'Schreib einen Satz mit „weil“ oder „obwohl“.',
  'Schreib einen Satz in der Vergangenheit (Perfekt).',
  'Schreib einen Satz über ein Hobby.',
  'Schreib einen Satz, den du in einem Vorstellungsgespräch sagen könntest.'
]
const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)]

async function check() {
  result.value = checkSentence(props.word, text.value)
  ai.value = null
  aiError.value = ''
  // AI also runs when the offline check didn't spot the word – it may be an unusual form
  if (state.settings.aiOn && state.settings.aiKey && text.value.trim().split(/\s+/).length >= 3) {
    aiLoading.value = true
    try {
      ai.value = await getAiFeedback(state.settings.aiKey, props.word, text.value.trim())
    } catch (e) {
      aiError.value = e instanceof Error ? e.message : 'AI feedback is not available right now.'
    } finally {
      aiLoading.value = false
    }
  }
}

function useCorrection() {
  if (!ai.value) return
  text.value = ai.value.corrected
  result.value = checkSentence(props.word, text.value)
  ai.value = { ...ai.value, correct: true }
}

async function save() {
  // Run the check first if the sentence changed since the last check
  if (!result.value) await check()
  if (!result.value) return
  // The offline check can miss unusual forms (e.g. umlaut changes), so let the learner decide
  if (!result.value.usesWord && !(ai.value?.correct)) {
    const confirmed = await new Promise<boolean>(async resolve => {
      const a = await alertController.create({
        header: 'Wort nicht erkannt',
        message: `Ich habe „${props.word.de}“ in deinem Satz nicht gefunden. Hast du eine andere Form benutzt?`,
        buttons: [
          { text: 'Ändern', role: 'cancel', handler: () => resolve(false) },
          { text: 'Trotzdem speichern', handler: () => resolve(true) }
        ]
      })
      await a.present()
    })
    if (!confirmed) return
  }
  const feedback = ai.value ? `${ai.value.corrected} — ${ai.value.explanation}` : undefined
  saveSentence(props.word.id, text.value, feedback)
  const t = await toastController.create({ message: 'Gespeichert! Super gemacht 💪', duration: 1600, position: 'top', color: 'primary' })
  await t.present()
  close(true)
}

function close(saved = false) {
  modalController.dismiss({ saved })
}
</script>

<style scoped>
.target h2 {
  font-size: 32px;
  font-weight: 600;
  margin: 8px 0 0;
}
.target h2 {
  hyphens: auto;
  -webkit-hyphens: auto;
  overflow-wrap: break-word;
}

.target p {
  margin: 2px 0 0;
  font-size: 17px;
}
.prompt {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 18px 0 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--amber-soft);
  font-size: 14px;
}
.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 12px;
}
.actions ion-button {
  min-height: 48px;
  margin: 0;
}
.result {
  margin-top: 16px;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: var(--card);
  font-size: 15px;
}
.result.good {
  border-color: color-mix(in srgb, var(--ok) 40%, var(--line));
}
.result.warn {
  border-color: color-mix(in srgb, var(--amber) 60%, var(--line));
}
.result ul {
  margin: 6px 0 0;
  padding-left: 20px;
}
.result li {
  margin-bottom: 4px;
}
.tips {
  color: var(--ink-soft);
  font-size: 14px;
}
.verdict {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-weight: 700;
}
.ai {
  background: var(--der-soft);
  border-color: transparent;
}
.corrected {
  font-size: 18px;
  margin: 8px 0;
}
.alt {
  margin-bottom: 0;
}
.ai-error {
  color: var(--bad);
  font-size: 14px;
}
.example,
.previous {
  margin-top: 22px;
}
.example p,
.previous p {
  margin: 4px 0;
}
.example .serif,
.previous .serif {
  font-size: 17px;
}
</style>
