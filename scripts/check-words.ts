/**
 * Validates the word lists: duplicates, malformed lines, and that every example
 * sentence passes the app's own "did you use the word?" check.
 * Run with:  npm run check-words
 */
import { WORDS } from '../src/data/words.ts'
import { usesWord } from '../src/lib/check.ts'

let problems = 0
const ids = new Set<string>()
for (const w of WORDS) {
  if (ids.has(w.id)) { console.log('Duplicate:', w.id); problems++ }
  ids.add(w.id)
  if (!usesWord(w, w.example.de)) { console.log(`Example doesn’t use the word (${w.level}):`, w.id, '|', w.example.de); problems++ }
  if (!/[.!?][”“"»]?$/.test(w.example.de) || !/[.!?][”“"»]?$/.test(w.example.en)) { console.log('Missing end punctuation:', w.id); problems++ }
}
const byLevel: Record<string, number> = {}
WORDS.forEach(w => (byLevel[w.level] = (byLevel[w.level] ?? 0) + 1))
console.log(`${WORDS.length} words`, byLevel, problems ? `– ${problems} problem(s)` : '– all good ✓')
process.exit(problems ? 1 : 0)
