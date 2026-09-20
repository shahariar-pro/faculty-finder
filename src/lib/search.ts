import { fold } from './text'
import type { Faculty, Filters } from '../types/faculty'

export interface IndexedFaculty {
  f: Faculty
  name: string
  school: string
  dept: string
  des: string
  other: string
  nameWords: string[]
  deptWords: string[]
  desWords: string[]
  deptInitials: string
  schoolInitials: string
}

const STOP = new Set(['of', 'and', 'the', 'for', '&', 'in'])

export function buildIndex(list: Faculty[]): IndexedFaculty[] {
  return list.map((f) => {
    const name  = fold(f.name)
    const school = fold(f.school ?? '')
    const dept  = fold(f.department ?? '')
    const des   = fold(f.designation ?? '')
    const other = fold(
      [f.email, f.office, f.type, ...f.phones, ...f.research, ...f.education, ...Object.values(f.extra)]
        .filter(Boolean).join(' '),
    )
    const deptWords = dept.split(/[^\p{L}\p{N}]+/u).filter(Boolean)
    const schoolWords = school.split(/[^\p{L}\p{N}]+/u).filter(Boolean)
    return {
      f, name, school, dept, des, other,
      nameWords: name.split(/[^\p{L}\p{N}]+/u).filter(Boolean),
      deptWords,
      desWords: des.split(/[^\p{L}\p{N}]+/u).filter(Boolean),
      deptInitials: deptWords.filter((w) => !STOP.has(w)).map((w) => w[0]).join(''),
      schoolInitials: schoolWords.filter((w) => !STOP.has(w)).map((w) => w[0]).join(''),
    }
  })
}

export function tokenize(query: string): string[] {
  return fold(query).split(' ').filter(Boolean)
}

function levenshtein(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1))
      cur.push(v); if (v < rowMin) rowMin = v
    }
    if (rowMin > max) return max + 1
    prev = cur
  }
  return prev[b.length]!
}

function fieldScore(words: string[], full: string, t: string, exact: number, prefix: number, sub: number): number {
  let best = 0
  for (const w of words) {
    if (w === t) return exact
    if (w.startsWith(t)) best = prefix
  }
  if (best) return best
  return full.includes(t) ? sub : 0
}

function strictTokenScore(it: IndexedFaculty, t: string): number {
  let s = fieldScore(it.nameWords, it.name, t, 100, 80, 50)
  s = Math.max(s, fieldScore(it.deptWords, it.dept, t, 34, 30, 20))
  s = Math.max(s, fieldScore(it.desWords, it.des, t, 34, 30, 20))
  s = Math.max(s, fieldScore(it.schoolInitials === t ? ['s'] : [], it.school, t, 30, 24, 14))
  if (t.length >= 2 && it.deptInitials === t) s = Math.max(s, 36)
  if (!s && it.other.includes(t)) s = 6
  return s
}

function fuzzyTokenScore(it: IndexedFaculty, t: string): number {
  if (t.length < 4) return 0
  const max = t.length >= 8 ? 2 : 1
  let best = 0
  const check = (words: string[], score: number) => {
    for (const w of words) {
      const d = Math.min(levenshtein(t, w, max), levenshtein(t, w.slice(0, t.length), max))
      if (d <= max) best = Math.max(best, score - d * 2)
    }
  }
  check(it.nameWords, 24); check(it.deptWords, 12); check(it.desWords, 12)
  return best
}

export interface SearchResult {
  list: Faculty[]
  fuzzy: boolean
}

export function searchIndex(index: IndexedFaculty[], tokens: string[]): SearchResult {
  if (tokens.length === 0) return { list: index.map((i) => i.f), fuzzy: false }
  const phrase = tokens.join(' ')
  const run = (scoreFn: (it: IndexedFaculty, t: string) => number) => {
    const scored: { f: Faculty; score: number }[] = []
    for (const it of index) {
      let total = 0; let ok = true
      for (const t of tokens) {
        const s = scoreFn(it, t)
        if (!s) { ok = false; break }
        total += s
      }
      if (!ok) continue
      if (tokens.length > 1 && it.name.includes(phrase)) total += 40
      if (it.name.startsWith(phrase)) total += 30
      scored.push({ f: it.f, score: total })
    }
    scored.sort((a, b) => b.score - a.score)
    return scored.map((s) => s.f)
  }
  const strict = run(strictTokenScore)
  if (strict.length > 0) return { list: strict, fuzzy: false }
  const fuzzy = run((it, t) => strictTokenScore(it, t) || fuzzyTokenScore(it, t))
  return { list: fuzzy, fuzzy: fuzzy.length > 0 }
}

export const EMPTY_FILTERS: Filters = { departments: [], designations: [], types: [], schools: [] }

export function hasFilters(f: Filters): boolean {
  return f.departments.length + f.designations.length + f.types.length + f.schools.length > 0
}

export function countFilters(f: Filters): number {
  return f.departments.length + f.designations.length + f.types.length + f.schools.length
}

function matchesFacet(value: string | undefined, selected: string[]): boolean {
  return selected.length === 0 || (value !== undefined && selected.includes(value))
}

export function matchesFilters(f: Faculty, filters: Filters, skip?: keyof Filters): boolean {
  return (
    (skip === 'departments'  || matchesFacet(f.department, filters.departments)) &&
    (skip === 'designations' || matchesFacet(f.designation, filters.designations)) &&
    (skip === 'types'        || matchesFacet(f.type, filters.types)) &&
    (skip === 'schools'      || matchesFacet(f.school, filters.schools))
  )
}

export function applyFilters(list: Faculty[], filters: Filters): Faculty[] {
  return hasFilters(filters) ? list.filter((f) => matchesFilters(f, filters)) : list
}

export interface FacetOption { value: string; count: number }

export interface Facets {
  schools: FacetOption[]
  departments: FacetOption[]
  designations: FacetOption[]
  types: FacetOption[]
}

export function buildFacets(all: Faculty[], searched: Faculty[], filters: Filters): Facets {
  const options = (key: keyof Filters, pick: (f: Faculty) => string | undefined, sortByCount: boolean): FacetOption[] => {
    const totals = new Map<string, number>()
    for (const f of all) { const v = pick(f); if (v) totals.set(v, 0) }
    for (const f of searched) {
      const v = pick(f)
      if (v && matchesFilters(f, filters, key)) totals.set(v, (totals.get(v) ?? 0) + 1)
    }
    const arr = [...totals.entries()].map(([value, count]) => ({ value, count }))
    arr.sort((a, b) => (sortByCount ? b.count - a.count : 0) || a.value.localeCompare(b.value))
    return arr
  }
  return {
    schools: options('schools', (f) => f.school, false),
    departments: options('departments', (f) => f.department, false),
    designations: options('designations', (f) => f.designation, true),
    types: options('types', (f) => f.type, true),
  }
}

export function departmentTotals(all: Faculty[]): FacetOption[] {
  const m = new Map<string, number>()
  for (const f of all) if (f.department) m.set(f.department, (m.get(f.department) ?? 0) + 1)
  return [...m.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value))
}

export function schoolTotals(all: Faculty[]): FacetOption[] {
  const m = new Map<string, number>()
  for (const f of all) if (f.school) m.set(f.school, (m.get(f.school) ?? 0) + 1)
  return [...m.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count)
}
