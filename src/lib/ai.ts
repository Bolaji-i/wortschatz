import type { Word } from '@/data/words'
import { headword } from '@/data/words'
import { lang, t } from './i18n'

/**
 * Optional AI feedback on your sentences – Claude (Anthropic), ChatGPT (OpenAI) or Gemini (Google).
 * Your API key is stored only on your phone and sent only to the chosen provider.
 */

export type AiProvider = 'anthropic' | 'openai' | 'gemini'

export interface AiFeedback {
  correct: boolean
  corrected: string
  explanation: string
  alternative: string
}

export interface ProviderInfo {
  id: AiProvider
  name: string
  company: string
  defaultModel: string
  keyPlaceholder: string
  keyUrl: string
  /** i18n key of the short cost note shown in settings */
  noteKey: 'notePaid' | 'noteGemini'
}

export const PROVIDERS: Record<AiProvider, ProviderInfo> = {
  anthropic: {
    id: 'anthropic',
    name: 'Claude',
    company: 'Anthropic',
    defaultModel: 'claude-haiku-5-5',
    keyPlaceholder: 'sk-ant-…',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    noteKey: 'notePaid'
  },
  openai: {
    id: 'openai',
    name: 'ChatGPT',
    company: 'OpenAI',
    defaultModel: 'gpt-5-mini',
    keyPlaceholder: 'sk-…',
    keyUrl: 'https://platform.openai.com/api-keys',
    noteKey: 'notePaid'
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    company: 'Google',
    // Google's alias that always points to the current Flash model
    defaultModel: 'gemini-flash-latest',
    keyPlaceholder: 'AIza…',
    keyUrl: 'https://aistudio.google.com/apikey',
    noteKey: 'noteGemini'
  }
}

export const AI_PROVIDERS = Object.values(PROVIDERS)

function buildPrompt(word: Word, sentence: string) {
  return `You are a friendly, encouraging German teacher. A learner (studying ${word.level}-level vocabulary) wrote a sentence to practise the word "${headword(word)}" (${word.en}).

Learner's sentence: """${sentence}"""

Check grammar, word order, gender/case, spelling and whether the word is used naturally with the right meaning.
Reply with ONLY a JSON object, no other text:
{"correct": true or false, "corrected": "the corrected sentence (same as the original if it is correct)", "explanation": "max 3 short sentences in ${lang.value === 'de' ? 'simple German' : 'simple English'} explaining any mistakes, or praising what is good", "alternative": "one more natural German example sentence using the word"}`
}

const ANTHROPIC_HEADERS = (key: string) => ({
  'content-type': 'application/json',
  'x-api-key': key,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true'
})

/** Turns HTTP errors into short, helpful German messages. */
async function failure(res: Response, provider: AiProvider): Promise<never> {
  const body = await res.text().catch(() => '')
  let detail = ''
  try {
    const j = JSON.parse(body)
    detail = j.error?.message ?? j.message ?? ''
  } catch {
    detail = body.slice(0, 160)
  }
  const name = PROVIDERS[provider].name
  if (res.status === 401 || res.status === 403 || /api key not valid|invalid.*key|incorrect api key/i.test(detail)) {
    throw new Error(t('aiKeyRejected', { p: name }))
  }
  if (res.status === 429) throw new Error(t('aiLimit', { p: name }))
  if (res.status === 404 || /model.*(not found|does not exist|not supported)/i.test(detail)) {
    throw new Error(t('aiModelNotFound', { p: name }))
  }
  throw new Error(`${t('aiError', { p: name, s: res.status })} ${detail}`.trim())
}

async function askAnthropic(key: string, model: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: ANTHROPIC_HEADERS(key),
    body: JSON.stringify({ model, max_tokens: 600, messages: [{ role: 'user', content: prompt }] })
  })
  if (!res.ok) await failure(res, 'anthropic')
  const data = await res.json()
  return (data.content ?? []).map((c: { text?: string }) => c.text ?? '').join('')
}

async function askOpenAI(key: string, model: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    })
  })
  if (!res.ok) await failure(res, 'openai')
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function askGemini(key: string, model: string, prompt: string): Promise<string> {
  const id = model.replace(/^models\//, '')
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(id)}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  })
  if (!res.ok) await failure(res, 'gemini')
  const data = await res.json()
  const parts = data.candidates?.[0]?.content?.parts ?? []
  return parts.map((p: { text?: string; thought?: boolean }) => (p.thought ? '' : p.text ?? '')).join('')
}

export interface AiConfig {
  provider: AiProvider
  key: string
  model?: string
}

export async function getAiFeedback(cfg: AiConfig, word: Word, sentence: string): Promise<AiFeedback> {
  const key = cfg.key.trim()
  const model = cfg.model?.trim() || PROVIDERS[cfg.provider].defaultModel
  const prompt = buildPrompt(word, sentence)
  const ask = cfg.provider === 'openai' ? askOpenAI : cfg.provider === 'gemini' ? askGemini : askAnthropic

  let text: string
  try {
    text = await ask(key, model, prompt)
  } catch (e) {
    if (e instanceof TypeError) throw new Error(t('aiOffline'))
    throw e
  }

  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(t('aiUnreadable'))
  const parsed = JSON.parse(match[0])
  return {
    correct: Boolean(parsed.correct),
    corrected: String(parsed.corrected ?? sentence),
    explanation: String(parsed.explanation ?? ''),
    alternative: String(parsed.alternative ?? '')
  }
}

/** Text models available for this key, newest first, so the learner can pick one. */
export async function listModels(provider: AiProvider, rawKey: string): Promise<string[]> {
  const key = rawKey.trim()
  let ids: string[] = []
  try {
    if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/models?limit=100', { headers: ANTHROPIC_HEADERS(key) })
      if (!res.ok) await failure(res, provider)
      ids = ((await res.json()).data ?? []).map((m: { id: string }) => m.id)
    } else if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', { headers: { authorization: `Bearer ${key}` } })
      if (!res.ok) await failure(res, provider)
      ids = ((await res.json()).data ?? [])
        .sort((a: { created: number }, b: { created: number }) => b.created - a.created)
        .map((m: { id: string }) => m.id)
        .filter((id: string) => /^(gpt|o\d|chatgpt)/.test(id) && !/audio|realtime|image|tts|transcribe|search|embedding|codex|instruct/.test(id))
    } else {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key } })
      if (!res.ok) await failure(res, provider)
      ids = ((await res.json()).models ?? [])
        .filter((m: { supportedGenerationMethods?: string[] }) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: { name: string }) => m.name.replace(/^models\//, ''))
        .filter((id: string) => /^gemini/.test(id) && !/image|tts|live|embedding|audio|computer-use|robotics/.test(id))
        .reverse()
    }
  } catch (e) {
    if (e instanceof TypeError) throw new Error(t('aiOffline'))
    throw e
  }
  return [...new Set(ids)]
}
