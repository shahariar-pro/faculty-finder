import { SITE } from '../config'
import { parseCsvToObjects } from '../lib/csv'
import { normalizeRecords } from '../lib/normalize'
import type { Dataset } from '../types/faculty'

const OVERRIDE_KEY = 'ff-data-override'

/** Returns the admin-uploaded override dataset if one is stored, else null. */
export function getOverrideDataset(): Dataset | null {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Dataset
  } catch { return null }
}

/** Saves a dataset to localStorage so it overrides the server file until cleared. */
export function setOverrideDataset(ds: Dataset): void {
  try { localStorage.setItem(OVERRIDE_KEY, JSON.stringify({ ...ds, fromOverride: true })) } catch { /* storage full */ }
}

/** Clears the admin override. The next load will fetch from the server. */
export function clearOverrideDataset(): void {
  try { localStorage.removeItem(OVERRIDE_KEY) } catch { /* ignore */ }
}

/** Parses text that is either a JSON array/object or a CSV string. */
export function parseAny(text: string, filename?: string): Dataset {
  const trimmed = text.trimStart()
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return parseJsonText(text, filename ?? 'uploaded.json')
  }
  return parseCsvText(text, filename ?? 'uploaded.csv')
}

export function parseCsvText(text: string, source = 'faculty.csv'): Dataset {
  const { headers, records } = parseCsvToObjects(text)
  if (headers.length === 0) throw new Error('The file appears to be empty or has no columns.')
  return normalizeRecords(headers, records, { source })
}

export function parseJsonText(text: string, source = 'faculty.json'): Dataset {
  let data: unknown
  try { data = JSON.parse(text) } catch (e) { throw new Error('The file is not valid JSON.') }
  let records: Record<string, string>[]
  if (Array.isArray(data)) {
    records = data as Record<string, string>[]
  } else if (data && typeof data === 'object' && !Array.isArray(data)) {
    // Support { data: [...] } or { faculty: [...] } wrappers
    const obj = data as Record<string, unknown>
    const wrapped = obj['data'] ?? obj['faculty'] ?? obj['records'] ?? obj['results']
    if (Array.isArray(wrapped)) records = wrapped as Record<string, string>[]
    else throw new Error('JSON should be an array of faculty objects (or an object with a "data" key).')
  } else {
    throw new Error('JSON should be an array of faculty objects.')
  }
  if (records.length === 0) throw new Error('The JSON file has no records.')
  const headers = Object.keys(records[0]!)
  // Stringify any non-string values
  const stringified = records.map((r) => {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(r)) out[k] = v == null ? '' : String(v)
    return out
  })
  return normalizeRecords(headers, stringified, { source })
}

/** Main loader — checks localStorage override first, then fetches from the server. */
export async function loadFaculty(signal?: AbortSignal): Promise<Dataset> {
  const override = getOverrideDataset()
  if (override) return override

  const url = SITE.csvUrl.trim() || '/faculty.json'
  const res = await fetch(url, { signal, cache: 'no-cache' })
  if (!res.ok) throw new Error(`Could not load the faculty file (HTTP ${res.status}). Check that ${url} exists in the public/ folder.`)
  const text = await res.text()
  if (/^\s*<(!doctype|html)/i.test(text)) throw new Error(`The faculty file was not found at ${url}. Make sure faculty.json or faculty.csv is in the public/ folder.`)

  const ds = parseAny(text, url.split('/').pop())

  if (import.meta.env.DEV) {
    const r = ds.report
    console.info('[Faculty-Finder] Loaded', r.totalRows, 'rows from', r.source)
    console.info('[Faculty-Finder] Matched columns:', r.matchedColumns)
    if (r.unknownColumns.length) console.info('[Faculty-Finder] Unrecognised columns (kept as extra):', r.unknownColumns)
    if (r.skipped)    console.warn('[Faculty-Finder] Skipped (no name):', r.skipped)
    if (r.duplicates) console.info('[Faculty-Finder] Merged duplicates:', r.duplicates)
  }
  return ds
}
