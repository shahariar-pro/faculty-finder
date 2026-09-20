import { useMemo, useSyncExternalStore } from 'react'
import { parseRoute, type Route } from '../lib/url'

const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  window.addEventListener('popstate', cb)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('popstate', cb)
  }
}

/** Client-side navigation without a router library. Paths: /, /departments, /faculty/:slug */
export function navigate(to: string, opts: { replace?: boolean } = {}) {
  try {
    if (opts.replace) window.history.replaceState({ ff: true }, '', to)
    else window.history.pushState({ ff: true }, '', to)
  } catch {
    window.location.assign(to)
    return
  }
  listeners.forEach((l) => l())
}

export function useRoute(): Route {
  const pathname = useSyncExternalStore(subscribe, () => window.location.pathname)
  return useMemo(() => parseRoute(pathname), [pathname])
}

/** True when the current history entry was created by in-app navigation (so back() stays inside the app). */
export function canGoBackInApp(): boolean {
  return Boolean((window.history.state as { ff?: boolean } | null)?.ff)
}
