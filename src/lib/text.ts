/** Small text helpers shared by the normalizer, search and highlighter. */

const MARKS = /\p{M}/gu

export function fold(input: string): string {
  return input.normalize('NFD').replace(MARKS, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

export function collapseSpaces(input: string): string {
  return input.replace(/[\u00a0\u200b]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function smartTitleCase(input: string): string {
  const s = collapseSpaces(input)
  const letters = s.replace(/[^\p{L}]/gu, '')
  if (!letters) return s
  const allUpper = letters === letters.toUpperCase()
  const allLower = letters === letters.toLowerCase()
  if (!allUpper && !allLower) return s
  return s.toLowerCase().replace(/(^|[\s\-'(./])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase())
}

export function initials(name: string): string {
  const words = collapseSpaces(name)
    .replace(/\b(dr|prof|professor|mr|mrs|ms|engr|md)\b\.?/gi, '')
    .split(' ')
    .filter((w) => /\p{L}/u.test(w))
  if (words.length === 0) return '?'
  const first = words[0]![0]!
  const last = words.length > 1 ? words[words.length - 1]![0]! : ''
  return (first + last).toUpperCase()
}

/**
 * Splits list-like cell values.
 * Handles: semicolons, pipes, line breaks, bullets, and commas.
 * Commas are included because AIUB exports use them as the separator in
 * interest/expertise fields (e.g., "Machine Learning,Deep Learning,IoT").
 */
export function splitList(input: string): string[] {
  if (!input.trim()) return []
  // If the value contains semicolons, pipes, or newlines → split on those only
  // (preserves items that legitimately contain commas, e.g. "PhD, Computer Science")
  if (/[;|\n\r•]/.test(input)) {
    return input.split(/[;|\n\r•]+/).map(collapseSpaces).filter(Boolean)
  }
  // Otherwise split on commas (AIUB comma-separated list style)
  return input.split(',').map(collapseSpaces).filter(Boolean)
}

export function hueFor(key: string): number {
  let h = 2166136261
  const s = fold(key)
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h) % 360
}

export function slugify(input: string): string {
  return (
    fold(input)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'faculty'
  )
}

export function pluralize(n: number, one: string, many = one + 's'): string {
  return `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`
}

export interface Range { start: number; end: number }

export function highlightRanges(text: string, tokens: string[]): Range[] {
  if (!text || tokens.length === 0) return []
  let folded = ''
  const map: number[] = []
  for (let i = 0; i < text.length; i++) {
    const piece = text[i]!.normalize('NFD').replace(MARKS, '').toLowerCase()
    for (const ch of piece) { map.push(i); folded += ch }
  }
  const ranges: Range[] = []
  for (const token of tokens) {
    if (!token) continue
    let from = 0
    for (;;) {
      const at = folded.indexOf(token, from)
      if (at === -1) break
      ranges.push({ start: map[at]!, end: map[at + token.length - 1]! + 1 })
      from = at + token.length
    }
  }
  ranges.sort((a, b) => a.start - b.start)
  const merged: Range[] = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (last && r.start <= last.end) last.end = Math.max(last.end, r.end)
    else merged.push({ ...r })
  }
  return merged
}
