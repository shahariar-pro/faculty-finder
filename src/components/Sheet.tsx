import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'

interface Props {
  open: boolean
  onClose: () => void
  labelledBy: string
  className?: string
  children: ReactNode
}

/**
 * Accessible dialog used for both the filter bottom sheet and the profile drawer.
 * Bottom sheet on phones, side drawer on wide screens (see CSS). Handles Escape, focus trap,
 * focus return, scroll lock and an exit animation.
 */
export function Sheet({ open, onClose, labelledBy, className = '', children }: Props) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
      return
    }
    if (!mounted) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setClosing(true)
    const t = window.setTimeout(
      () => {
        setMounted(false)
        setClosing(false)
      },
      reduced ? 0 : 200,
    )
    return () => window.clearTimeout(t)
  }, [open, mounted])

  useEffect(() => {
    if (!open || !mounted) return
    const opener = document.activeElement as HTMLElement | null
    const root = panel.current
    document.documentElement.classList.add('no-scroll')
    ;(root?.querySelector<HTMLElement>('[data-autofocus]') ?? root)?.focus({ preventScroll: true })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !root) return
      const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]!
      const last = items[items.length - 1]!
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === root)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.classList.remove('no-scroll')
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true })
    }
  }, [open, mounted])

  if (!mounted) return null
  return createPortal(
    <div className="sheet-root" data-closing={closing || undefined}>
      <div className="scrim" onClick={() => onClose()} aria-hidden="true" />
      <div ref={panel} className={`sheet ${className}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}>
        {children}
      </div>
    </div>,
    document.body,
  )
}
