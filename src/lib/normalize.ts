import { mapColumns, type FieldKey } from './columns'
import { collapseSpaces, fold, slugify, smartTitleCase, splitList } from './text'
import type { Dataset, Faculty } from '../types/faculty'

export interface NormalizeOptions {
  baseUrl?: string
  source?: string
}

const EMPTY_LIKE = /^(n\/?a|na|none|null|nil|undefined|tbd|not available|not provided|no email|-+|—+|–+|\.+|\?+|other)$/i
const EMAIL_RE = /[a-z0-9._%+'-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/i

export function clean(value: unknown): string {
  if (typeof value !== 'string') return ''
  const s = collapseSpaces(value)
  return EMPTY_LIKE.test(s) ? '' : s
}

export function cleanEmail(value: string): string | undefined {
  const m = clean(value).replace(/^mailto:/i, '').match(EMAIL_RE)
  return m ? m[0].toLowerCase() : undefined
}

export function cleanPhones(value: string): string[] {
  return clean(value)
    .split(/[,;/|\n]+/)
    .map(collapseSpaces)
    .filter((p) => p.replace(/\D/g, '').length >= 5 && !EMPTY_LIKE.test(p))
}

export function cleanUrl(value: string, baseUrl?: string): string | undefined {
  let s = clean(value)
  if (!s) return undefined
  if (s.startsWith('//')) s = 'https:' + s
  else if (/^www\./i.test(s)) s = 'https://' + s
  try {
    const url = baseUrl ? new URL(s, baseUrl) : new URL(s)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
    return url.href
  } catch { return undefined }
}

function canonicalizer(values: (string | undefined)[]) {
  const groups = new Map<string, Map<string, number>>()
  for (const v of values) {
    if (!v) continue
    const key = fold(v)
    const forms = groups.get(key) ?? new Map<string, number>()
    forms.set(v, (forms.get(v) ?? 0) + 1)
    groups.set(key, forms)
  }
  const canon = new Map<string, string>()
  for (const [key, forms] of groups) {
    const best = [...forms.entries()].sort((a, b) => b[1] - a[1])[0]![0]
    canon.set(key, best)
  }
  return (v: string | undefined) => (v ? canon.get(fold(v)) ?? v : undefined)
}

function sortKey(name: string): string {
  return fold(name.replace(/^(dr|prof|professor|engr|mr|mrs|ms)\b\.?\s*/i, ''))
}

/** Strips "FACULTY OF " prefix, title-cases the rest. */
function cleanSchool(raw: string): string {
  const s = smartTitleCase(
    raw.replace(/^FACULTY\s+OF\s+/i, '').replace(/^DEPARTMENT\s+OF\s+/i, ''),
  )
  return s
}

/** Strips "DEPARTMENT OF " prefix, title-cases. */
function cleanDepartment(raw: string): string {
  return smartTitleCase(raw.replace(/^DEPARTMENT\s+OF\s+/i, ''))
}

/**
 * Title-cases positions like "ASSISTANT PROFESSOR (on Study Leave)".
 * The main text before parentheses may be ALL CAPS even when the parenthetical is mixed.
 */
function cleanDesignation(raw: string): string {
  const trimmed = raw.trim()
  // Split into main part and optional parenthetical
  const m = trimmed.match(/^([^(]+?)(\s*\(.+\))?$/)
  if (!m) return smartTitleCase(trimmed)
  const main = m[1]?.trim() ?? trimmed
  const paren = m[2] ?? ''
  const mainLetters = main.replace(/[^\p{L}]/gu, '')
  const mainAllCaps = mainLetters.length > 0 && mainLetters === mainLetters.toUpperCase()
  const mainCased = mainAllCaps
    ? main.toLowerCase().replace(/(^|[\s\-])(\p{L})/gu, (_, s: string, ch: string) => s + ch.toUpperCase())
    : main
  return (mainCased + paren).trim()
}

type Draft = Omit<Faculty, 'slug'>

export function normalizeRecords(
  headers: string[],
  records: Record<string, string>[],
  options: NormalizeOptions = {},
): Dataset {
  const cols = mapColumns(headers)
  const get = (rec: Record<string, string>, key: FieldKey): string => {
    const h = cols.fields[key]
    return h ? clean(rec[h] ?? '') : ''
  }

  const drafts: Draft[] = []
  let skipped = 0
  let duplicates = 0
  const seen = new Map<string, Draft>()

  for (const rec of records) {
    let name = get(rec, 'name')
    if (!name && (cols.firstName || cols.lastName)) {
      name = collapseSpaces(`${clean(rec[cols.firstName ?? ''] ?? '')} ${clean(rec[cols.lastName ?? ''] ?? '')}`)
    }
    name = smartTitleCase(name)
    if (!name) { skipped++; continue }

    // Build combined office from room + building (or single office column)
    let office = get(rec, 'office')
    if (!office) {
      const room = get(rec, 'room')
      const building = get(rec, 'building')
      if (room && building) office = `Room ${room}, ${building}`
      else if (room) office = `Room ${room}`
      else if (building) office = building
    }

    const extra: Record<string, string> = {}
    for (const h of cols.unknown) {
      const v = clean(rec[h] ?? '')
      if (v) extra[h] = v
    }

    // Merge academic interests into research (deduplicate)
    const research = splitList(get(rec, 'research'))
    const academic = splitList(get(rec, 'academicInterests'))
    const researchSet = new Set(research.map(fold))
    const allResearch = [...research, ...academic.filter((a) => !researchSet.has(fold(a)))]

    const rawDesig = get(rec, 'designation')
    const rawType = get(rec, 'type')

    const draft: Draft = {
      name,
      school: cleanSchool(get(rec, 'school')) || undefined,
      department: cleanDepartment(get(rec, 'department')) || undefined,
      designation: cleanDesignation(rawDesig) || undefined,
      type: smartTitleCase(rawType) || undefined,
      email: cleanEmail(get(rec, 'email')),
      phones: cleanPhones(get(rec, 'phone')),
      office: office || undefined,
      profileUrl: cleanUrl(get(rec, 'profileUrl'), options.baseUrl),
      imageUrl: cleanUrl(get(rec, 'imageUrl'), options.baseUrl),
      education: splitList(get(rec, 'education')),
      research: allResearch,
      extra,
    }

    const key = draft.email ?? `${fold(draft.name)}|${fold(draft.department ?? '')}`
    const existing = seen.get(key)
    if (existing) {
      duplicates++
      existing.school ??= draft.school
      existing.department ??= draft.department
      existing.designation ??= draft.designation
      existing.type ??= draft.type
      existing.email ??= draft.email
      existing.office ??= draft.office
      existing.profileUrl ??= draft.profileUrl
      existing.imageUrl ??= draft.imageUrl
      if (existing.phones.length === 0) existing.phones = draft.phones
      if (existing.education.length === 0) existing.education = draft.education
      if (existing.research.length === 0) existing.research = draft.research
      existing.extra = { ...draft.extra, ...existing.extra }
      continue
    }
    seen.set(key, draft)
    drafts.push(draft)
  }

  const canonSchool = canonicalizer(drafts.map((d) => d.school))
  const canonDept   = canonicalizer(drafts.map((d) => d.department))
  const canonDes    = canonicalizer(drafts.map((d) => d.designation))
  const canonType   = canonicalizer(drafts.map((d) => d.type))

  drafts.sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name)))

  const usedSlugs = new Set<string>()
  const faculty: Faculty[] = drafts.map((d) => {
    const base = slugify(d.name.replace(/^(dr|prof|professor|engr|mr|mrs|ms)\b\.?\s*/i, ''))
    let slug = base
    if (usedSlugs.has(slug) && d.department) slug = `${base}-${slugify(d.department)}`.slice(0, 80)
    for (let n = 2; usedSlugs.has(slug); n++) slug = `${base}-${n}`
    usedSlugs.add(slug)
    return {
      ...d,
      slug,
      school: canonSchool(d.school),
      department: canonDept(d.department),
      designation: canonDes(d.designation),
      type: canonType(d.type),
    }
  })

  const matchedColumns: Record<string, string> = {}
  for (const [k, v] of Object.entries(cols.fields)) if (v) matchedColumns[k] = v

  return {
    faculty,
    report: {
      totalRows: records.length,
      skipped,
      duplicates,
      unknownColumns: cols.unknown,
      matchedColumns,
      source: options.source ?? 'unknown',
    },
  }
}
