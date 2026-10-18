import type { Word } from '@/data/words'
import { headword } from '@/data/words'

/**
 * Optional AI feedback on your sentences using the Claude API.
 * Your API key is stored only on your phone and sent only to api.anthropic.com.
 */

export interface AiFeedback {
  correct: boolean
  corrected: string
  explanation: string
  alternative: string
}

const MODEL = 'claude-haiku-5-5'

export async function getAiFeedback(apiKey: string, word: Word, sentence: string): Promise<AiFeedback> {
  const prompt = `You are a friendly, encouraging German teacher. A learner (studying ${word.level}-level vocabulary) wrote a sentence to practise the word "${headword(word)}" (${word.en}).

Learner's sentence: """${sentence}"""

Check grammar, word order, gender/case, spelling and whether the word is used naturally with the right meaning.
Reply with ONLY a JSON object, no other text:
{"correct": true or false, "corrected": "the corrected sentence (same as the original if it is correct)", "explanation": "max 3 short sentences in simple English explaining any mistakes, or praising what is good", "alternative": "one more natural German example sentence using the word"}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey.trim(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    if (res.status === 401) throw new Error('The API key was rejected. Check it in Settings.')
    throw new Error(`AI feedback failed (${res.status}). ${body.slice(0, 120)}`)
  }

  const data = await res.json()
  const text: string = (data.content ?? []).map((c: { text?: string }) => c.text ?? '').join('')
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Could not read the AI response.')
  const parsed = JSON.parse(match[0])
  return {
    correct: Boolean(parsed.correct),
    corrected: String(parsed.corrected ?? sentence),
    explanation: String(parsed.explanation ?? ''),
    alternative: String(parsed.alternative ?? '')
  }
}
