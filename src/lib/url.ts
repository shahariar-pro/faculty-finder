import { EMPTY_FILTERS } from './search'
import type { DirectoryState } from '../types/faculty'

export type Route =
  | { name: 'home' }
  | { name: 'departments' }
  | { name: 'profile'; slug: string }
  | { name: 'admin' }
  | { name: 'notfound' }

export function parseRoute(pathname: string): Route {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return { name: 'home' }
  if (path === '/departments') return { name: 'departments' }
  if (path === '/admin') return { name: 'admin' }
  const m = path.match(/^\/faculty\/([^/]+)$/)
  if (m) return { name: 'profile', slug: decodeURIComponent(m[1]!) }
  return { name: 'notfound' }
}

export function readState(search: string): DirectoryState {
  const p = new URLSearchParams(search)
  return {
    q: p.get('q') ?? '',
    filters: {
      departments: p.getAll('dept'),
      designations: p.getAll('role'),
      types: p.getAll('type'),
      schools: p.getAll('school'),
    },
  }
}

export function writeState(state: DirectoryState): string {
  const p = new URLSearchParams()
  if (state.q.trim()) p.set('q', state.q.trim())
  state.filters.departments.forEach((v)  => p.append('dept', v))
  state.filters.designations.forEach((v) => p.append('role', v))
  state.filters.types.forEach((v)        => p.append('type', v))
  state.filters.schools.forEach((v)      => p.append('school', v))
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const emptyState = (): DirectoryState => ({ q: '', filters: { ...EMPTY_FILTERS } })
