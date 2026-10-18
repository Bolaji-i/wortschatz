/**
 * Wortschatz word bank – A2 to C1.
 * The words live in ./lists as one-line entries (format explained in ./parse.ts).
 * To add words, append lines to any list file, or create a new file and add it below.
 */
import { parseList, type Level, type Word } from './parse.ts'
import a2Core from './lists/a2-core.ts'
import a2A from './lists/a2-a.ts'
import a2B from './lists/a2-b.ts'
import a2C from './lists/a2-c.ts'
import b1Core from './lists/b1-core.ts'
import b1A from './lists/b1-a.ts'
import b1B from './lists/b1-b.ts'
import b1C from './lists/b1-c.ts'
import b1D from './lists/b1-d.ts'
import b2Core from './lists/b2-core.ts'
import b2A from './lists/b2-a.ts'
import b2B from './lists/b2-b.ts'
import b2C from './lists/b2-c.ts'
import c1A from './lists/c1-a.ts'
import c1B from './lists/c1-b.ts'

export type { Level, Pos, Article, Word } from './parse.ts'
export { LEVELS } from './parse.ts'

const LISTS: Record<Level, string[]> = {
  A2: [a2Core, a2A, a2B, a2C],
  B1: [b1Core, b1A, b1B, b1C, b1D],
  B2: [b2Core, b2A, b2B, b2C],
  C1: [c1A, c1B]
}

const byLevel: Record<Level, Word[]> = {
  A2: LISTS.A2.flatMap(src => parseList(src, 'A2')),
  B1: LISTS.B1.flatMap(src => parseList(src, 'B1')),
  B2: LISTS.B2.flatMap(src => parseList(src, 'B2')),
  C1: LISTS.C1.flatMap(src => parseList(src, 'C1'))
}

/** Words of each level, in teaching order. */
export const WORDS_BY_LEVEL: Record<Level, Word[]> = byLevel

/** All words (A2 → C1). */
export const WORDS: Word[] = (Object.keys(byLevel) as Level[]).flatMap(l => byLevel[l])

export const WORD_BY_ID: Record<string, Word> = Object.fromEntries(WORDS.map(w => [w.id, w]))

/** Display form, e.g. "die Gefahr". */
export function headword(w: Word) {
  return w.article ? `${w.article} ${w.de}` : w.de
}
