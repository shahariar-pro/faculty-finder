import type { MouseEvent } from 'react'
import { SITE } from '../config'
import { navigate } from '../hooks/useRoute'
import type { Theme } from '../hooks/useTheme'
import type { Route } from '../lib/url'
import { BrandMark, Icon } from './Icons'

function go(to: string) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault(); navigate(to); window.scrollTo({ top: 0 })
  }
}

interface Props {
  route: Route
  theme: Theme
  onToggleTheme: () => void
  isOverrideActive?: boolean
}

export function Header({ route, theme, onToggleTheme, isOverrideActive }: Props) {
  const onDepartments = route.name === 'departments'
  return (
    <header className="site-header">
      <div className="wrap header-in">
        <a className="brand" href="/" onClick={go('/')} aria-label={`${SITE.name} home`}>
          <BrandMark />
          <span>{SITE.name}</span>
          {isOverrideActive && <span className="override-dot" title="Admin data override is active" aria-label="Admin data override is active" />}
        </a>
        <nav className="nav" aria-label="Main">
          <a href="/" className="nav-link nav-directory" onClick={go('/')} aria-current={!onDepartments && route.name !== 'admin' ? 'page' : undefined}>
            Directory
          </a>
          <a href="/departments" className="nav-link" onClick={go('/departments')} aria-current={onDepartments ? 'page' : undefined}>
            Departments
          </a>
        </nav>
        <div className="header-tools">
          {SITE.githubUrl && (
            <a className="icon-btn hide-xs" href={SITE.githubUrl} target="_blank" rel="noreferrer" aria-label="View source on GitHub">
              <Icon.Github />
            </a>
          )}
          <button className="icon-btn" onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}>
            {theme === 'dark' ? <Icon.Sun /> : <Icon.Moon />}
          </button>
        </div>
      </div>
    </header>
  )
}
