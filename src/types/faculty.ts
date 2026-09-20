/** A single, cleaned faculty record. Optional fields are simply absent when the source has no data. */
export interface Faculty {
  /** Stable unique id (also used in the profile URL). */
  slug: string
  name: string
  /** The academic school/faculty grouping, e.g. "Faculty of Science & Technology". */
  school?: string
  /** The department, e.g. "Department of Computer Science". */
  department?: string
  /** Academic rank / job title, e.g. "Associate Professor". */
  designation?: string
  /** Administrative role or faculty type, e.g. "Department Head", "Full-time". */
  type?: string
  email?: string
  phones: string[]
  office?: string
  profileUrl?: string
  imageUrl?: string
  education: string[]
  research: string[]
  extra: Record<string, string>
}

export interface Filters {
  departments: string[]
  designations: string[]
  types: string[]
  schools: string[]
}

export interface DirectoryState {
  q: string
  filters: Filters
}

export interface LoadReport {
  totalRows: number
  skipped: number
  duplicates: number
  unknownColumns: string[]
  matchedColumns: Record<string, string>
  source: string
}

export interface Dataset {
  faculty: Faculty[]
  report: LoadReport
  /** True if this dataset came from a localStorage override (admin upload). */
  fromOverride?: boolean
}
