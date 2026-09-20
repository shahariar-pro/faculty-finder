import { useEffect, useMemo, useState } from 'react'
import { AdminPage } from './components/AdminPage'
import { DepartmentsPage } from './components/DepartmentsPage'
import { Directory } from './components/Directory'
import { Header } from './components/Header'
import { Icon } from './components/Icons'
import { EmptyState, ErrorBoundary } from './components/States'
import { ToastProvider } from './components/Toast'
import { SITE } from './config'
import { getOverrideDataset } from './data/loadFaculty'
import { useFaculty } from './hooks/useFaculty'
import { navigate, useRoute } from './hooks/useRoute'
import { useTheme } from './hooks/useTheme'
import { EMPTY_FILTERS, departmentTotals } from './lib/search'
import { pluralize } from './lib/text'
import { readState, writeState } from './lib/url'
import type { Dataset, DirectoryState } from './types/faculty'

export default function App() {
  const route = useRoute()
  const { theme, toggle } = useTheme()
  const { state: data, retry } = useFaculty()
  const [state, setState] = useState<DirectoryState>(() => readState(window.location.search))
  const [adminOverride] = useState<Dataset | null>(() => getOverrideDataset())

  const faculty = data.status === 'ready' ? data.data.faculty : undefined
  const departments = useMemo(() => (faculty ? departmentTotals(faculty) : []), [faculty])
  const isOverrideActive = Boolean(data.status === 'ready' && data.data.fromOverride)

  /* Keep address bar in sync with search+filters */
  useEffect(() => {
    if (route.name !== 'home' && route.name !== 'profile') return
    const t = window.setTimeout(() => {
      const url = window.location.pathname + writeState(state)
      if (url === window.location.pathname + window.location.search) return
      try { window.history.replaceState(window.history.state, '', url) } catch { /* ignore */ }
    }, 300)
    return () => window.clearTimeout(t)
  }, [state, route.name])

  /* Page titles */
  useEffect(() => {
    const base = `${SITE.name} — Find ${SITE.university} Faculty`
    if (route.name === 'departments') document.title = `Departments — ${SITE.name}`
    else if (route.name === 'admin') document.title = `Admin — ${SITE.name}`
    else if (route.name === 'profile') {
      const f = faculty?.find((x) => x.slug === route.slug)
      document.title = f ? `${f.name}${f.designation ? ` — ${f.designation}` : ''} · ${SITE.name}` : base
    } else document.title = base
  }, [route, faculty])

  const pickDepartment = (department: string) => {
    const next = { q: '', filters: { ...EMPTY_FILTERS, departments: [department] } }
    setState(next)
    navigate('/' + writeState(next))
    window.scrollTo({ top: 0 })
  }

  return (
    <ToastProvider>
      <ErrorBoundary>
        <a className="skip-link" href="#main">Skip to content</a>
        <Header
          route={route}
          theme={theme}
          onToggleTheme={toggle}
          isOverrideActive={isOverrideActive}
        />
        <main id="main">
          {route.name === 'admin' ? (
            <AdminPage currentOverride={adminOverride} />
          ) : route.name === 'departments' ? (
            <DepartmentsPage loading={data.status === 'loading'} departments={departments} onPick={pickDepartment} />
          ) : route.name === 'notfound' ? (
            <div className="wrap page">
              <EmptyState icon={<Icon.Search size={22} />} title="Page not found" text="Head back to the directory to search for faculty.">
                <button className="btn btn-primary" onClick={() => navigate('/')}>Go to directory</button>
              </EmptyState>
            </div>
          ) : (
            <Directory data={data} retry={retry} state={state} setState={setState} route={route} />
          )}
        </main>
        <footer className="site-footer">
          <div className="wrap footer-in">
            <p>
              {faculty
                ? `${pluralize(faculty.length, 'faculty', 'faculty')} compiled from ${SITE.university}'s public website. Confirm details with the department. `
                : `Compiled from ${SITE.university}'s public website. `}
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              {SITE.githubUrl && (
                <a href={SITE.githubUrl} target="_blank" rel="noreferrer">Open source</a>
              )}
            </div>
          </div>
        </footer>
      </ErrorBoundary>
    </ToastProvider>
  )
}
