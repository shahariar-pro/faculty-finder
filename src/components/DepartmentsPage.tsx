import type { CSSProperties } from 'react'
import { hueFor, pluralize } from '../lib/text'
import type { FacetOption } from '../lib/search'
import { EmptyState, SkeletonGrid } from './States'

interface Props {
  loading: boolean
  departments: FacetOption[]
  onPick: (department: string) => void
}

export function DepartmentsPage({ loading, departments, onPick }: Props) {
  return (
    <div className="wrap page">
      <h1 className="page-title">Departments</h1>
      <p className="page-sub">Pick a department to see everyone in it.</p>
      {loading ? (
        <SkeletonGrid count={6} />
      ) : departments.length === 0 ? (
        <EmptyState title="No departments listed" text="The faculty file doesn’t include a department column, so there is nothing to browse yet." />
      ) : (
        <ul className="dept-grid">
          {departments.map((d) => (
            <li key={d.value}>
              <button className="dept-tile" style={{ '--h': hueFor(d.value) } as CSSProperties} onClick={() => onPick(d.value)}>
                <span className="dot dot-lg" aria-hidden="true" />
                <span className="dept-name">{d.value}</span>
                <span className="dept-count">{pluralize(d.count, 'faculty', 'faculty')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
