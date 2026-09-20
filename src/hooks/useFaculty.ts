import { useCallback, useEffect, useState } from 'react'
import { loadFaculty } from '../data/loadFaculty'
import type { Dataset } from '../types/faculty'

export type FacultyState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: Dataset }

export function useFaculty() {
  const [state, setState] = useState<FacultyState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ status: 'loading' })
    loadFaculty(ctrl.signal)
      .then((data) => setState({ status: 'ready', data }))
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return
        setState({ status: 'error', message: err instanceof Error ? err.message : 'Something went wrong while loading faculty.' })
      })
    return () => ctrl.abort()
  }, [attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { state, retry }
}
