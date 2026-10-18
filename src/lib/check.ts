import type { Word } from '@/data/words'

export interface CheckResult {
  usesWord: boolean
  problems: string[]
  tips: string[]
}

export function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[.,!?;:„“"'’‚‘()\[\]–—-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

/** True when the sentence contains the word or one of its inflected forms. */
export function usesWord(word: Word, sentence: string): boolean {
  const t = tokens(sentence)
  return word.forms.some(form => tokens(form).every(part => t.some(tok => tok.startsWith(part))))
}

const VERB_FINAL = ['obwohl', 'ob', 'damit', 'sobald', 'indem', 'sodass', 'während', 'weil', 'dass', 'wenn']

/** Offline checks. They can't judge grammar fully, but they catch the most common slips. */
export function checkSentence(word: Word, raw: string): CheckResult {
  const sentence = raw.trim()
  const problems: string[] = []
  const tips: string[] = []
  const found = usesWord(word, sentence)

  if (!found) {
    problems.push(`Your sentence doesn’t seem to use “${word.de}” (or a form of it like ${formsHint(word)}).`)
  }

  const count = tokens(sentence).length
  if (count < 4) problems.push('Make it a full sentence – aim for at least 4 words.')

  if (sentence && sentence[0] !== sentence[0].toUpperCase()) {
    problems.push('Start the sentence with a capital letter.')
  }
  if (sentence && !/[.!?]$/.test(sentence)) {
    tips.push('End the sentence with . ! or ?')
  }

  if (word.pos === 'noun') {
    const forms = [word.de, word.plural?.replace(/^die /, '')].filter(Boolean) as string[]
    const words = sentence.split(/[\s.,!?;:]+/)
    const lowerNoun = words.find(w => forms.some(f => w.toLowerCase().startsWith(f.toLowerCase())) && w[0] === w[0].toLowerCase())
    if (lowerNoun) problems.push(`German nouns are always capitalised: “${capitalize(lowerNoun)}”.`)
    if (word.article) tips.push(`Remember the gender: ${word.article} ${word.de} (${word.article === 'der' ? 'masculine' : word.article === 'die' ? 'feminine' : 'neuter'}).`)
  }

  if (word.pos === 'verb' && word.conj) tips.push(`Forms: ${word.conj}`)
  if (word.usage) tips.push(`Usage: ${word.usage}`)

  const t = tokens(sentence)
  if (t.some(x => VERB_FINAL.includes(x)) && /,/.test(sentence) === false && count > 6) {
    tips.push('With words like weil, dass, obwohl, ob the clause is usually separated by a comma and the verb goes to the end.')
  }

  return { usesWord: found, problems, tips }
}

function formsHint(word: Word) {
  return word.forms
    .slice(0, 3)
    .map(f => `“${f}…”`)
    .join(', ')
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** For cloze questions: the example sentence with the target word replaced by a gap. */
export function makeCloze(word: Word): { text: string; answer: string } | null {
  const parts = word.example.de.split(/(\s+)/)
  const singleForms = word.forms.filter(f => !f.includes(' ')).map(f => f.toLowerCase())
  for (let i = 0; i < parts.length; i++) {
    const clean = parts[i].replace(/[.,!?;:„“"]/g, '')
    if (!clean) continue
    if (singleForms.some(f => clean.toLowerCase().startsWith(f))) {
      const answer = clean
      parts[i] = parts[i].replace(clean, '_____')
      return { text: parts.join(''), answer }
    }
  }
  return null
}

export function normalizeAnswer(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/ae/g, 'ä').replace(/oe/g, 'ö').replace(/ue/g, 'ü').replace(/ss/g, 'ß')
    .replace(/[.,!?]/g, '')
}

/**
 * CSS font-size that keeps a long German word on one line:
 * scales down with word length, never below `min` and never above `max`.
 */
export function fitFont(text: string, reservedPx: number, max: number, min = 16) {
  const longest = Math.max(...text.split(' ').map(t => t.length), 1)
  const total = text.length
  // prefer fitting the whole headword on one line, but at least the longest word
  const chars = total * 0.6 * max > 300 ? longest : total
  return `max(${min}px, min(${max}px, calc((100vw - ${reservedPx}px) / ${(chars * 0.62).toFixed(2)})))`
}
