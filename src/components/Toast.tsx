import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Icon } from './Icons'

type ToastFn = (message: string) => void
const ToastContext = createContext<ToastFn>(() => {})

export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<{ id: number; text: string } | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const show = useCallback<ToastFn>((text) => {
    window.clearTimeout(timer.current)
    setMessage({ id: Date.now(), text })
    timer.current = window.setTimeout(() => setMessage(null), 2200)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])
  const value = useMemo(() => show, [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {message && (
          <div className="toast" key={message.id}>
            <Icon.Check size={16} />
            <span>{message.text}</span>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}
