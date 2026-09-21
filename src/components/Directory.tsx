import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { SITE } from '../config'
import type { FacultyState } from '../hooks/useFaculty'
import { canGoBackInApp, navigate } from '../hooks/useRoute'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { EMPTY_FILTERS, applyFilters, buildFacets, buildIndex, countFilters, departmentTotals, searchIndex, tokenize } from '../lib/search'
import { pluralize } from '../lib/text'
import { writeState, type Route } from '../lib/url'
import type { DirectoryState, Faculty, Filters } from '../types/faculty'
import { FacultyGrid } from './FacultyGrid'
import { FilterPanel } from './FilterPanel'
import { Icon } from './Icons'
import { ProfileSheet } from './ProfileSheet'
import { Sheet } from './Sheet'
import { EmptyState, ErrorState, SkeletonGrid } from './States'

const NONE: Faculty[] = []

interface Props {
  data: FacultyState
  retry: () => void
  state: DirectoryState
  setState: Dispatch<SetStateAction<DirectoryState>>
  route: Route
}

export function Directory({ data, retry, state, setState, route }: Props) {
  const faculty = data.status === 'ready' ? data.data.faculty : NONE
  const inputRef = useRef<HTMLInputElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const wide = useMediaQuery('(min-width: 640px)')

  /* ---------- data pipeline: index -> search -> filter -> facets ---------- */
  const deferredQ = useDeferredValue(state.q)
  const tokens = useMemo(() => tokenize(deferredQ), [deferredQ])
  const index = useMemo(() => buildIndex(faculty), [faculty])
  const searched = useMemo(() => searchIndex(index, tokens), [index, tokens])
  const results = useMemo(() => applyFilters(searched.list, state.filters), [searched, state.filters])
  const facets = useMemo(() => buildFacets(faculty, searched.list, state.filters), [faculty, searched, state.filters])
  const rail = useMemo(() => departmentTotals(faculty).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)), [faculty])

  const activeCount = countFilters(state.filters)
  const canFilter = facets.departments.length > 1 || facets.designations.length > 1 || facets.types.length > 1
  const query = state.q.trim()

  /* ---------- state updates ---------- */
  const setQuery = (q: string) => setState((s) => ({ ...s, q }))
  const toggle = useCallback(
    (group: keyof Filters, value: string) =>
      setState((s) => {
        const list = s.filters[group]
        return { ...s, filters: { ...s.filters, [group]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] } }
      }),
    [setState],
  )
  const clearFilters = () => setState((s) => ({ ...s, filters: { ...EMPTY_FILTERS } }))
  const clearAll = () => setState({ q: '', filters: { ...EMPTY_FILTERS } })

  /* ---------- profile routing ---------- */
  const qs = writeState(state)
  const hrefFor = useCallback((slug: string) => `/faculty/${encodeURIComponent(slug)}${qs}`, [qs])
  const openProfile = useCallback((slug: string) => navigate(hrefFor(slug)), [hrefFor])
  const closeProfile = useCallback(() => {
    if (canGoBackInApp()) window.history.back()
    else navigate('/' + qs, { replace: true })
  }, [qs])
  const pickDepartment = (department: string) => {
    setState({ q: '', filters: { ...EMPTY_FILTERS, departments: [department] } })
    closeProfile()
  }
  const profileSlug = route.name === 'profile' ? route.slug : undefined
  const profile = profileSlug ? faculty.find((f) => f.slug === profileSlug) : undefined
  const profileMissing = Boolean(profileSlug) && data.status === 'ready' && !profile

  /* ---------- keyboard shortcuts: "/" or Ctrl/Cmd+K focuses search ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      const isK = e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)
      if ((e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) || isK) {
        if (document.querySelector('.sheet-root')) return
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  /* ---------- sticky search: add a shadow once it sticks ---------- */
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setStuck(!entry!.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  /* ---------- pieces ---------- */
  const activeChips = [
    ...state.filters.schools.map((v) => ({ group: 'schools' as const, value: v })),
    ...state.filters.departments.map((v) => ({ group: 'departments' as const, value: v })),
    ...state.filters.designations.map((v) => ({ group: 'designations' as const, value: v })),
    ...state.filters.types.map((v) => ({ group: 'types' as const, value: v })),
  ]

  let body: React.ReactNode
  if (data.status === 'loading') body = <SkeletonGrid />
  else if (data.status === 'error') body = <ErrorState message={data.message} onRetry={retry} />
  else if (faculty.length === 0)
    body = (
      <EmptyState
        icon={<Icon.Users size={22} />}
        title="No faculty data yet"
        text="The faculty file loaded, but no usable rows were found. Check that public/faculty.csv has a header row and a name for each person."
      />
    )
  else if (results.length === 0)
    body = (
      <EmptyState title="No faculty found" text="Try searching by a different name, department, or designation.">
        {query && (
          <button className="btn" onClick={() => setQuery('')}>
            Clear search
          </button>
        )}
        {activeCount > 0 && (
          <button className="btn" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </EmptyState>
    )
  else body = <FacultyGrid items={results} tokens={searched.fuzzy ? [] : tokens} hrefFor={hrefFor} onOpen={openProfile} />

  const statusText =
    data.status === 'loading'
      ? 'Loading faculty…'
      : data.status === 'error' || faculty.length === 0
        ? ''
        : results.length === 0
          ? '0 faculty found'
          : `${pluralize(results.length, 'faculty', 'faculty')} found`

  return (
    <>
      <section className="wrap hero">
        <h1>Find your faculty. Fast.</h1>
        <p>Search {SITE.university} faculty by name, department, designation, or research interest.</p>
      </section>

      <div ref={sentinelRef} className="sentinel" aria-hidden="true" />
      <div className={`dock${stuck ? ' is-stuck' : ''}`}>
        <div className="wrap dock-in">
          <form
            className="search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              inputRef.current?.blur() // closes the phone keyboard so results are visible
            }}
          >
            <label htmlFor="faculty-search" className="sr-only">
              Search faculty by name, department, or designation
            </label>
            <span className="search-icon">
              <Icon.Search size={20} />
            </span>
            <input
              id="faculty-search"
              ref={inputRef}
              type="search"
              value={state.q}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  if (state.q) setQuery('')
                  else inputRef.current?.blur()
                }
              }}
              placeholder={wide ? 'Search by name, department, designation, or research interest...' : 'Name, dept, or research interest'}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="search"
            />
            {state.q ? (
              <button
                type="button"
                className="search-clear"
                aria-label="Clear search"
                onClick={() => {
                  setQuery('')
                  inputRef.current?.focus()
                }}
              >
                <Icon.X size={18} />
              </button>
            ) : (
              <kbd className="kbd" aria-hidden="true">
                /
              </kbd>
            )}
          </form>
          {canFilter && (
            <button className="btn filter-btn" onClick={() => setFiltersOpen(true)} aria-haspopup="dialog" aria-label={activeCount > 0 ? `Filters, ${activeCount} active` : 'Filters'}>
              <Icon.Sliders size={18} />
              <span>Filters</span>
              {activeCount > 0 && <span className="badge-count" aria-hidden="true">{activeCount}</span>}
            </button>
          )}
        </div>
      </div>

      <div className="wrap">
        {rail.length > 1 && (
          <div className="rail" role="group" aria-label="Quick department filter">
            <button className="chip" aria-pressed={state.filters.departments.length === 0} onClick={() => setState((s) => ({ ...s, filters: { ...s.filters, departments: [] } }))}>
              All
            </button>
            {rail.map((d) => (
              <button key={d.value} className="chip" aria-pressed={state.filters.departments.includes(d.value)} onClick={() => toggle('departments', d.value)}>
                {d.value} <span className="chip-count">{d.count}</span>
              </button>
            ))}
          </div>
        )}

        <div className="layout">
          {canFilter && (
            <aside className="sidebar" aria-label="Filters">
              <div className="sidebar-head">
                <h2>Filters</h2>
                {activeCount > 0 && (
                  <button className="link-btn" onClick={clearFilters}>
                    Clear all
                  </button>
                )}
              </div>
              <FilterPanel facets={facets} filters={state.filters} onToggle={toggle} />
            </aside>
          )}

          <section className="results" aria-label="Faculty results">
            <div className="results-bar">
              <p className="status" role="status" aria-live="polite">
                {statusText}
                {searched.fuzzy && results.length > 0 && <span className="status-note"> · closest matches for “{query}”</span>}
              </p>
              {(activeChips.length > 0 || query) && data.status === 'ready' && (
                <div className="active-chips">
                  {activeChips.map((c) => (
                    <button key={c.group + c.value} className="chip chip-x" onClick={() => toggle(c.group, c.value)} aria-label={`Remove filter ${c.value}`}>
                      {c.value} <Icon.X size={14} />
                    </button>
                  ))}
                  <button className="link-btn" onClick={clearAll}>
                    Clear all
                  </button>
                </div>
              )}
            </div>
            {body}
          </section>
        </div>
      </div>

      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} labelledBy="filters-title" className="sheet-filters">
        <div className="sheet-head sheet-head-titled">
          <span className="grab" aria-hidden="true" />
          <h2 id="filters-title">Filters</h2>
          <button className="icon-btn" onClick={() => setFiltersOpen(false)} aria-label="Close filters" data-autofocus>
            <Icon.X />
          </button>
        </div>
        <div className="sheet-body">
          <FilterPanel facets={facets} filters={state.filters} onToggle={toggle} />
        </div>
        <div className="sheet-foot">
          <button className="btn btn-lg" onClick={clearFilters} disabled={activeCount === 0}>
            Clear all
          </button>
          <button className="btn btn-primary btn-lg grow" onClick={() => setFiltersOpen(false)}>
            Show {pluralize(results.length, 'faculty', 'faculty')}
          </button>
        </div>
      </Sheet>

      <ProfileSheet open={Boolean(profileSlug)} faculty={profile} missing={profileMissing} onClose={closeProfile} onPickDepartment={pickDepartment} />
    </>
  )
}
