import { describe, expect, it } from 'vitest'
import { parseCsv, parseCsvToObjects } from './csv'
import { normalizeRecords, cleanEmail, cleanPhones, cleanUrl } from './normalize'
import { buildIndex, searchIndex, tokenize, buildFacets } from './search'
import { highlightRanges, smartTitleCase } from './text'

const load = (csv: string) => {
  const { headers, records } = parseCsvToObjects(csv)
  return normalizeRecords(headers, records)
}

describe('csv parser', () => {
  it('handles quotes, commas, escaped quotes, CRLF and BOM', () => {
    const rows = parseCsv('\uFEFFa,b\r\n"x, y","say ""hi"""\r\n')
    expect(rows).toEqual([['a', 'b'], ['x, y', 'say "hi"']])
  })
  it('handles line breaks inside quoted cells and semicolon delimiters', () => {
    expect(parseCsv('a;b\n"1\n2";3')).toEqual([['a', 'b'], ['1\n2', '3']])
  })
})

describe('normalizer', () => {
  const ds = load(
    [
      'Full Name,Dept,Job Title,E-mail,Mobile,Photo,Notes',
      'JOHN DOE,computer science,LECTURER,John@Example.com,N/A,,hello',
      'Jane   Roe,Computer Science,Lecturer,jane@example.com,"0123456, 0123457",not a url,',
      'john doe,Computer Science,Lecturer,john@example.com,,,',
      ',English,Lecturer,x@example.com,,,',
    ].join('\n'),
  )
  it('maps flexible headers and drops nameless rows', () => {
    expect(ds.faculty).toHaveLength(2)
    expect(ds.report.skipped).toBe(1)
    expect(ds.report.matchedColumns.department).toBe('Dept')
  })
  it('merges duplicates and fixes case/whitespace', () => {
    expect(ds.report.duplicates).toBe(1)
    const john = ds.faculty.find((f) => f.name === 'John Doe')!
    expect(john.email).toBe('john@example.com')
    expect(john.extra.Notes).toBe('hello')
  })
  it('groups department spellings into one label', () => {
    expect(new Set(ds.faculty.map((f) => f.department)).size).toBe(1)
  })
  it('validates emails, phones and urls', () => {
    expect(cleanEmail('nope')).toBeUndefined()
    expect(cleanEmail('mailto:A@B.co')).toBe('a@b.co')
    expect(cleanPhones('n/a')).toEqual([])
    expect(cleanPhones('01711-000000, 01811-000000')).toHaveLength(2)
    expect(cleanUrl('javascript:alert(1)')).toBeUndefined()
    expect(cleanUrl('www.example.com/a')).toBe('https://www.example.com/a')
  })
  it('title-cases only shouty or lowercase strings', () => {
    expect(smartTitleCase('DR. JOHN DOE')).toBe('Dr. John Doe')
    expect(smartTitleCase('Md. McDonald')).toBe('Md. McDonald')
  })
})

describe('search', () => {
  const ds = load(
    [
      'Name,Designation,Department,Email',
      'Dr. Sarah Khan,Professor,Computer Science,sarah@u.edu',
      'Imran Hossain,Lecturer,Business Administration,imran@u.edu',
      'Nadia Islam,Assistant Professor,English,nadia@u.edu',
    ].join('\n'),
  )
  const index = buildIndex(ds.faculty)
  const names = (q: string) => searchIndex(index, tokenize(q)).list.map((f) => f.name)

  it('matches partial names, departments, designations and initials', () => {
    expect(names('sar')).toEqual(['Dr. Sarah Khan'])
    expect(names('business')).toEqual(['Imran Hossain'])
    expect(names('assistant prof')).toEqual(['Nadia Islam'])
    expect(names('cs')).toEqual(['Dr. Sarah Khan'])
  })
  it('requires all words and ignores case', () => {
    expect(names('SARAH english')).toEqual([])
  })
  it('falls back to typo-tolerant matches', () => {
    const r = searchIndex(index, tokenize('imram'))
    expect(r.fuzzy).toBe(true)
    expect(r.list[0]!.name).toBe('Imran Hossain')
  })
  it('builds facet counts', () => {
    const facets = buildFacets(ds.faculty, ds.faculty, { departments: [], designations: [], types: [], schools: [] })
    expect(facets.departments).toHaveLength(3)
  })
  it('finds highlight ranges in the original string', () => {
    expect(highlightRanges('Dr. Sarah', ['sar'])).toEqual([{ start: 4, end: 7 }])
  })
})
