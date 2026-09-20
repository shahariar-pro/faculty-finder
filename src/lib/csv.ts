/**
 * A tiny, dependency-free CSV parser (RFC 4180 style).
 * Handles: quoted cells, escaped quotes (""), line breaks inside quotes, CRLF/LF, a UTF-8 BOM,
 * and comma / semicolon / tab delimiters (auto-detected from the header line).
 */

export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
  const candidates = [',', ';', '\t']
  let best = ','
  let bestCount = -1
  for (const d of candidates) {
    let count = 0
    let inQuotes = false
    for (const ch of firstLine) {
      if (ch === '"') inQuotes = !inQuotes
      else if (ch === d && !inQuotes) count++
    }
    if (count > bestCount) {
      best = d
      bestCount = count
    }
  }
  return best
}

export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, '')
  const delimiter = detectDelimiter(text)
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else inQuotes = false
      } else cell += ch
      continue
    }
    if (ch === '"') inQuotes = true
    else if (ch === delimiter) {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      cell = ''
      rows.push(row)
      row = []
    } else cell += ch
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

/** Parses CSV text into objects keyed by the header row. */
export function parseCsvToObjects(text: string): { headers: string[]; records: Record<string, string>[] } {
  const rows = parseCsv(text)
  if (rows.length === 0) return { headers: [], records: [] }
  const headers = rows[0]!.map((h) => h.trim())
  const records = rows.slice(1).map((cells) => {
    const rec: Record<string, string> = {}
    headers.forEach((h, i) => {
      if (h) rec[h] = cells[i] ?? ''
    })
    return rec
  })
  return { headers, records }
}
