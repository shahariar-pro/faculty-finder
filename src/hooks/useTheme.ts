import { useCallback, useState } from 'react'

export type Theme = 'light' | 'dark'
const KEY = 'faculty-finder-theme'
const COLORS: Record<Theme, string> = { light: '#F3F5F8', dark: '#0D1017' }

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'))

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark'
      document.documentElement.dataset.theme = next
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS[next])
      try {
        localStorage.setItem(KEY, next)
      } catch {
        /* private mode: theme just won't persist */
      }
      return next
    })
  }, [])

  return { theme, toggle }
}
