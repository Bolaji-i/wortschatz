import { reactive, watch, computed } from 'vue'
import { Preferences } from '@capacitor/preferences'
import { LEVELS, WORDS, WORDS_BY_LEVEL, WORD_BY_ID, type Level, type Word } from '@/data/words'
import { addDays, dateKey, daysBetween } from './date'

/** Days until the next review for each Leitner box. Box 6+ counts as mastered. */
export const INTERVALS = [1, 2, 4, 7, 15, 30, 60, 120]
export const MASTERED_BOX = 5

export interface Card {
  box: number
  due: string
  introduced: string
  reviews: number
  lapses: number
}

export interface Sentence {
  text: string
  date: string
  feedback?: string
}

export interface DayEntry {
  words: string[]
  practised: string[]
  completed: boolean
  reviewed: number
}

export interface Settings {
  dailyGoal: number
  levels: Level[]
  reminderOn: boolean
  reminderTime: string
  speechRate: number
  aiOn: boolean
  aiKey: string
  /** false until the first-run setup (levels + daily goal) has been completed */
  onboarded: boolean
}

export const MIN_GOAL = 1
export const MAX_GOAL = 30

export interface AppState {
  version: 1
  settings: Settings
  days: Record<string, DayEntry>
  cards: Record<string, Card>
  sentences: Record<string, Sentence[]>
  streak: { current: number; longest: number; lastDate: string | null }
}

const STORAGE_KEY = 'wortschatz-state-v1'

function freshState(): AppState {
  return {
    version: 1,
    settings: {
      dailyGoal: 5,
      levels: ['A2', 'B1', 'B2'],
      reminderOn: false,
      reminderTime: '19:00',
      speechRate: 0.9,
      aiOn: false,
      aiKey: '',
      onboarded: false
    },
    days: {},
    cards: {},
    sentences: {},
    streak: { current: 0, longest: 0, lastDate: null }
  }
}

export const state = reactive<AppState>(freshState())
export const ui = reactive({ loaded: false, today: dateKey() })

export async function loadState() {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY })
    if (value) applyState(JSON.parse(value))
  } catch (e) {
    console.warn('Could not load saved progress', e)
  }
  ui.loaded = true
  refreshToday()
  persist().catch(() => {})
  let timer: ReturnType<typeof setTimeout> | undefined
  watch(
    state,
    () => {
      clearTimeout(timer)
      timer = setTimeout(persist, 250)
    },
    { deep: true }
  )
}

export async function persist() {
  await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(state) })
}

function applyState(data: Partial<AppState>) {
  const base = freshState()
  Object.assign(state, {
    ...base,
    ...data,
    settings: { ...base.settings, ...(data.settings ?? {}) },
    streak: { ...base.streak, ...(data.streak ?? {}) }
  })
}

/** Call when the app opens or comes back to the foreground: handles a new day. */
export function refreshToday() {
  ui.today = dateKey()
  ensureDay(ui.today)
}

function ensureDay(key: string) {
  if (!state.days[key]) {
    state.days[key] = { words: [], practised: [], completed: false, reviewed: 0 }
    addWords(state.settings.dailyGoal, key)
  } else if (state.days[key].words.length === 0) {
    addWords(state.settings.dailyGoal, key)
  }
}

export function selectedLevels(): Level[] {
  const chosen = LEVELS.filter(l => state.settings.levels.includes(l))
  return chosen.length ? chosen : ['B1']
}

/**
 * Next unseen words. Every selected level gets an equal share of the day,
 * taken in turns (e.g. B2 + C1 with 5 words → B2, C1, B2, C1, B2).
 * The starting level rotates so no level is always favoured.
 */
function nextNewWords(count: number): Word[] {
  const seen = new Set(Object.keys(state.cards))
  const levels = selectedLevels()
  const queues = levels.map(l => WORDS_BY_LEVEL[l].filter(w => !seen.has(w.id)))
  const out: Word[] = []
  let turn = Object.keys(state.cards).length % levels.length
  while (out.length < count && queues.some(q => q.length)) {
    const q = queues[turn % levels.length]
    if (q.length) out.push(q.shift()!)
    turn++
  }
  return out
}

/** A word introduced today that hasn't been practised, reviewed or written about yet. */
function isUntouched(id: string, day: DayEntry) {
  const card = state.cards[id]
  return !day.practised.includes(id) && (!card || card.reviews === 0) && !(state.sentences[id]?.length)
}

function releaseWord(id: string, day: DayEntry) {
  day.words = day.words.filter(w => w !== id)
  delete state.cards[id]
}

/**
 * Apply a changed plan (levels / daily goal) to today right away:
 * today's untouched words are re-picked from the selected levels
 * and the list is topped up or trimmed to the new goal.
 * Words you have already practised are never removed.
 */
export function applyPlan() {
  const day = state.days[ui.today]
  if (!day) return ensureDay(ui.today)
  // Put all untouched words back and pick a fresh, evenly mixed set
  for (const id of [...day.words]) if (isUntouched(id, day)) releaseWord(id, day)
  const goal = state.settings.dailyGoal
  if (day.words.length < goal) addWords(goal - day.words.length)
  day.completed = false
  checkDayComplete()
}

/** How a day's new words split across the selected levels, e.g. { B2: 3, C1: 2 }. */
export function dailySplit(goal = state.settings.dailyGoal): Partial<Record<Level, number>> {
  const levels = selectedLevels()
  const split: Partial<Record<Level, number>> = {}
  levels.forEach((l, i) => (split[l] = Math.floor(goal / levels.length) + (i < goal % levels.length ? 1 : 0)))
  return split
}

/** A word counts as learned once it has been practised, reviewed, or was introduced on an earlier day. */
export function isLearned(id: string) {
  const c = state.cards[id]
  return !!c && (c.introduced < ui.today || c.reviews > 0 || !!state.sentences[id]?.length)
}

/** Learned / total words per level. */
export const levelStats = computed(() => {
  const res = {} as Record<Level, { learned: number; total: number }>
  for (const l of LEVELS) {
    const total = WORDS_BY_LEVEL[l].length
    const learned = WORDS_BY_LEVEL[l].filter(w => isLearned(w.id)).length
    res[l] = { learned, total }
  }
  return res
})

export function addWords(count: number, key = ui.today): number {
  const day = state.days[key]
  const fresh = nextNewWords(count)
  for (const w of fresh) {
    day.words.push(w.id)
    state.cards[w.id] = { box: 0, due: addDays(key, 1), introduced: key, reviews: 0, lapses: 0 }
  }
  if (fresh.length) day.completed = false
  return fresh.length
}

export function remainingNewWords() {
  return nextNewWords(Infinity).length
}

export const today = computed<DayEntry>(() => state.days[ui.today] ?? { words: [], practised: [], completed: false, reviewed: 0 })
export const todayWords = computed(() => today.value.words.map(id => WORD_BY_ID[id]).filter(Boolean))

export function saveSentence(wordId: string, text: string, feedback?: string) {
  const list = (state.sentences[wordId] ??= [])
  list.unshift({ text: text.trim(), date: ui.today, feedback })
  const day = state.days[ui.today]
  if (day && day.words.includes(wordId) && !day.practised.includes(wordId)) {
    day.practised.push(wordId)
  }
  checkDayComplete()
}

function checkDayComplete() {
  const day = state.days[ui.today]
  if (!day || day.completed) return false
  if (day.words.length > 0 && day.words.every(id => day.practised.includes(id))) {
    day.completed = true
    bumpStreak()
    return true
  }
  return false
}

function bumpStreak() {
  const s = state.streak
  if (s.lastDate === ui.today) return
  s.current = s.lastDate && daysBetween(s.lastDate, ui.today) === 1 ? s.current + 1 : 1
  s.longest = Math.max(s.longest, s.current)
  s.lastDate = ui.today
}

/** Streak as the user should see it (0 if they missed yesterday). */
export const currentStreak = computed(() => {
  const s = state.streak
  if (!s.lastDate) return 0
  return daysBetween(s.lastDate, ui.today) <= 1 ? s.current : 0
})

export function dueWords(limit = 20): Word[] {
  return Object.entries(state.cards)
    .filter(([, c]) => c.due <= ui.today)
    .sort((a, b) => (a[1].due < b[1].due ? -1 : a[1].due > b[1].due ? 1 : a[1].box - b[1].box))
    .slice(0, limit)
    .map(([id]) => WORD_BY_ID[id])
    .filter(Boolean)
}

export const dueCount = computed(() => Object.values(state.cards).filter(c => c.due <= ui.today).length)

export const nextDueDate = computed(() => {
  const dates = Object.values(state.cards).map(c => c.due).filter(d => d > ui.today).sort()
  return dates[0] ?? null
})

export function recordReview(wordId: string, correct: boolean) {
  const card = state.cards[wordId]
  if (!card) return
  card.reviews++
  if (correct) {
    card.box = Math.min(card.box + 1, INTERVALS.length - 1)
  } else {
    card.lapses++
    card.box = 0
  }
  card.due = addDays(ui.today, INTERVALS[card.box])
  const day = state.days[ui.today]
  if (day) day.reviewed++
}

export const stats = computed(() => {
  const cards = Object.values(state.cards)
  return {
    learned: Object.keys(state.cards).filter(isLearned).length,
    mastered: cards.filter(c => c.box >= MASTERED_BOX).length,
    sentences: Object.values(state.sentences).reduce((n, l) => n + l.length, 0),
    total: WORDS.length
  }
})

export function exportData(): string {
  return JSON.stringify(state)
}

export function importData(json: string) {
  const data = JSON.parse(json)
  if (!data || data.version !== 1 || typeof data.cards !== 'object') throw new Error('This doesn’t look like a Wortschatz backup.')
  applyState(data)
  refreshToday()
}

export function resetProgress() {
  const settings = { ...state.settings }
  applyState({ ...freshState(), settings })
  refreshToday()
}
