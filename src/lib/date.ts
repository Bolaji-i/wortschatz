export function dateKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, days: number): string {
  const d = parseKey(key)
  d.setDate(d.getDate() + days)
  return dateKey(d)
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseKey(b).getTime() - parseKey(a).getTime()) / 86_400_000)
}

export function lastNDays(n: number, end = dateKey()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(end, i - n + 1))
}

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

export function weekdayShort(key: string) {
  return WEEKDAYS[parseKey(key).getDay()]
}

export function prettyDate(key: string) {
  return parseKey(key).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
}
