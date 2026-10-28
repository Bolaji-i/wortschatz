<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="close()">{{ t('close') }}</ion-button>
      </ion-buttons>
      <ion-title>{{ t('practiseTitle') }}</ion-title>
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
        :placeholder="t('sentencePlaceholder')"
        @ion-input="result = null; ai = null; aiError = ''"
      />

      <div class="actions">
        <ion-button fill="outline" :disabled="!text.trim()" @click="check">{{ t('check') }}</ion-button>
        <ion-button :disabled="!canSave" @click="save">{{ t('save') }}</ion-button>
      </div>

      <div v-if="result" class="result" :class="result.problems.length ? 'warn' : 'good'">
        <p class="verdict">
          <ion-icon :icon="result.problems.length ? alertCircleOutline : checkmarkCircleOutline" />
          {{ result.problems.length ? t('almost') : t('looksGood') }}
        </p>
        <ul v-if="result.problems.length">
          <li v-for="p in result.problems" :key="p">{{ p }}</li>
        </ul>
        <ul class="tips">
          <li v-for="t in result.tips" :key="t">{{ t }}</li>
        </ul>
      </div>

      <div v-if="aiLoading" class="result ai"><ion-spinner name="dots" /> {{ t('aiChecking', { p: providerName }) }}</div>
      <div v-else-if="ai" class="result ai">
        <p class="verdict">
          <ion-icon :icon="sparklesOutline" />
          {{ ai.correct ? t('aiCorrect') : t('aiCorrection') }}
          <span class="via">{{ providerName }}</span>
        </p>
        <p v-if="!ai.correct" class="corrected serif">{{ ai.corrected }}</p>
        <p>{{ ai.explanation }}</p>
        <p v-if="ai.alternative" class="alt"><span class="eyebrow">{{ t('anotherExample') }}</span><br /><span class="serif">{{ ai.alternative }}</span></p>
        <ion-button v-if="!ai.correct" size="small" fill="clear" @click="useCorrection">{{ t('useCorrection') }}</ion-button>
      </div>
      <p v-else-if="aiError" class="ai-error">{{ aiError }}</p>

      <div class="example">
        <span class="eyebrow">{{ t('example') }}</span>
        <p class="serif">{{ word.example.de }}</p>
        <p class="muted">{{ word.example.en }}</p>
      </div>

      <div v-if="previous.length" class="previous">
        <span class="eyebrow">{{ t('previousSentences') }}</span>
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
import { PROVIDERS, getAiFeedback, type AiFeedback } from '@/lib/ai'
import { aiConfig, saveSentence, state } from '@/lib/store'
import { lang, t, tList, tipText } from '@/lib/i18n'

const props = defineProps<{ word: Word }>()

const text = ref('')
const result = ref<CheckResult | null>(null)
const ai = ref<AiFeedback | null>(null)
const aiLoading = ref(false)
const aiError = ref('')

const providerName = computed(() => PROVIDERS[state.settings.aiProvider].name)
const previous = computed(() => (state.sentences[props.word.id] ?? []).slice(0, 5))
const canSave = computed(() => text.value.trim().length > 0)

// Writing prompts fit the word's level: simple topics for A1/A2, more demanding ones from B1
const promptIndex = Math.random()
const prompt = computed(() => {
  const list = tList(props.word.level === 'A1' || props.word.level === 'A2' ? 'promptsEasy' : 'promptsHard')
  return list[Math.floor(promptIndex * list.length)]
})

async function check() {
  result.value = checkSentence(props.word, text.value, lang.value, tipText)
  ai.value = null
  aiError.value = ''
  // AI also runs when the offline check didn't spot the word – it may be an unusual form
  const cfg = aiConfig()
  if (cfg && text.value.trim().split(/\s+/).length >= 3) {
    aiLoading.value = true
    try {
      ai.value = await getAiFeedback(cfg, props.word, text.value.trim())
    } catch (e) {
      aiError.value = e instanceof Error ? e.message : t('aiUnavailable')
    } finally {
      aiLoading.value = false
    }
  }
}

function useCorrection() {
  if (!ai.value) return
  text.value = ai.value.corrected
  result.value = checkSentence(props.word, text.value, lang.value, tipText)
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
        header: t('notRecognisedTitle'),
        message: t('notRecognisedMsg', { w: props.word.de }),
        buttons: [
          { text: t('change'), role: 'cancel', handler: () => resolve(false) },
          { text: t('saveAnyway'), handler: () => resolve(true) }
        ]
      })
      await a.present()
    })
    if (!confirmed) return
  }
  const feedback = ai.value ? `${ai.value.corrected} — ${ai.value.explanation}` : undefined
  saveSentence(props.word.id, text.value, feedback)
  const toast = await toastController.create({ message: t('savedToast'), duration: 1600, position: 'top', color: 'primary' })
  await toast.present()
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
.via {
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-soft);
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
