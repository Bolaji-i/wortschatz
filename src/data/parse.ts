/**
 * Parser for the compact word lists in ./lists.
 *
 * One word per line, fields separated by " | ":
 *
 *   N die Gefahr, Gefahren | danger | Rauchen ist eine Gefahr. | Smoking is a danger.
 *   N das Vertrauen, — | trust | …                        (— = no plural)
 *   V leiden (leidet, litt, hat gelitten) | to suffer | … | … | leiden unter + Dativ
 *   V sich bewerben (bewirbt sich, bewarb sich, hat sich beworben) | to apply | …
 *   V aufgeben (gibt auf, gab auf, hat aufgegeben) | to give up | …
 *   A gefährlich | dangerous | …
 *   D trotzdem | nevertheless | …            (adverb)
 *   K obwohl | although | …                  (conjunction)
 *   P Bescheid sagen | to let someone know | … | … | +bescheid
 *
 * Optional 5th/6th fields: a usage tip, and/or "+form1, form2" = extra word starts
 * the sentence checker should accept (verb forms are derived automatically).
 * Lines starting with # are comments.
 */

export type Level = 'A2' | 'B1' | 'B2' | 'C1'
export const LEVELS: Level[] = ['A2', 'B1', 'B2', 'C1']
export type Pos = 'noun' | 'verb' | 'adj' | 'adv' | 'conj' | 'phrase'
export type Article = 'der' | 'die' | 'das'

export interface Word {
  id: string
  de: string
  article?: Article
  plural?: string
  conj?: string
  pos: Pos
  en: string
  forms: string[]
  example: { de: string; en: string }
  usage?: string
  level: Level
}

const POS: Record<string, Pos> = { N: 'noun', V: 'verb', A: 'adj', D: 'adv', K: 'conj', P: 'phrase' }

export function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function infinitiveStem(inf: string) {
  if (/(er|el)n$/.test(inf)) return inf.slice(0, -1)
  if (inf.endsWith('en')) return inf.slice(0, -2)
  if (inf.endsWith('n')) return inf.slice(0, -1)
  return inf
}

const strip = (s: string) => s.split(/\s+/).filter(t => t && t !== 'sich')

/** Word starts that identify a verb in any common form. */
export function verbForms(inf: string, p3: string, prat: string, perf: string): string[] {
  const infWord = strip(inf).join(' ')
  const p3t = strip(p3)
  const prt = strip(prat)
  const prefix = p3t.length > 1 ? p3t[p3t.length - 1] : ''
  const sep = prefix ? ' ' + prefix : ''
  const forms = new Set<string>()
  const stem = infinitiveStem(infWord)
  forms.add(stem)
  // -ern/-eln verbs often drop the e: bedauern → ich bedaure, zweifeln → ich zweifle
  if (/(er|el)n$/.test(infWord)) forms.add(infWord.slice(0, -3) + infWord.slice(-2, -1))
  if (prefix && stem.startsWith(prefix)) forms.add(stem.slice(prefix.length) + sep)
  if (p3t[0]) forms.add((p3t[0].length > 3 && p3t[0].endsWith('t') ? p3t[0].slice(0, -1) : p3t[0]) + sep)
  if (prt[0]) forms.add((prt[0].length > 3 && prt[0].endsWith('e') ? prt[0].slice(0, -1) : prt[0]) + sep)
  const part = strip(perf).pop()
  if (part) forms.add(part)
  return [...forms].filter(f => f.replace(/\s/g, '').length >= 2)
}

export function parseList(src: string, level: Level): Word[] {
  const out: Word[] = []
  src.split('\n').forEach((raw, i) => {
    const line = raw.trim()
    if (!line || line.startsWith('#')) return
    const pos = POS[line[0]]
    if (!pos || line[1] !== ' ') throw new Error(`[${level} line ${i + 1}] unknown word type: ${line}`)
    const fields = line.slice(2).split('|').map(s => s.trim())
    if (fields.length < 4) throw new Error(`[${level} line ${i + 1}] needs 4 fields: ${line}`)
    const [head, en, exDe, exEn, ...rest] = fields
    let usage: string | undefined
    let extra: string[] = []
    for (const r of rest) {
      if (r.startsWith('+')) extra = r.slice(1).split(',').map(s => s.trim()).filter(Boolean)
      else if (r) usage = r
    }

    const w: Omit<Word, 'id'> = { de: head, pos, en, forms: [], example: { de: exDe, en: exEn }, usage, level }

    if (pos === 'noun') {
      const [sing, pl] = head.split(',').map(s => s.trim())
      const [article, ...word] = sing.split(' ')
      if (!['der', 'die', 'das'].includes(article)) throw new Error(`[${level} line ${i + 1}] bad article: ${line}`)
      w.article = article as Article
      w.de = word.join(' ')
      if (pl && pl !== '—' && pl !== '-') w.plural = `die ${pl}`
      w.forms = [w.de]
      if (pl && pl !== '—' && pl !== '-' && pl !== w.de) w.forms.push(pl)
    } else if (pos === 'verb') {
      const m = head.match(/^(.+?)\s*\((.+)\)$/)
      if (!m) throw new Error(`[${level} line ${i + 1}] verb needs (forms): ${line}`)
      const parts = m[2].split(',').map(s => s.trim())
      if (parts.length !== 3) throw new Error(`[${level} line ${i + 1}] verb needs 3 forms: ${line}`)
      w.de = m[1].trim()
      w.conj = parts.join(' – ')
      w.forms = verbForms(w.de, parts[0], parts[1], parts[2])
    } else {
      w.forms = [head.replace(/[.!?]$/, '')]
    }
    if (extra.length) w.forms = extra.concat(pos === 'phrase' ? [] : w.forms)
    out.push({ ...w, id: `${pos}-${slug(w.de)}` })
  })
  return out
}
