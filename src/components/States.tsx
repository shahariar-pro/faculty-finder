import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Icon } from './Icons'

interface EmptyProps {
  icon?: ReactNode
  title: string
  text?: string
  children?: ReactNode
}

export function EmptyState({ icon, title, text, children }: EmptyProps) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon ?? <Icon.Search size={22} />}</div>
      <h2 className="empty-title">{title}</h2>
      {text && <p className="empty-text">{text}</p>}
      {children && <div className="empty-actions">{children}</div>}
    </div>
  )
}

export function ErrorState({ title = 'Couldn’t load faculty', message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  return (
    <div role="alert">
      <EmptyState icon={<Icon.Alert size={22} />} title={title} text={message}>
        {onRetry && (
          <button className="btn btn-primary" onClick={onRetry}>
            <Icon.Refresh size={18} /> Try again
          </button>
        )}
      </EmptyState>
    </div>
  )
}

export function SkeletonGrid({ count = 9 }: { count?: number }) {
  return (
    <div className="grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="card skel-card" key={i}>
          <div className="card-top">
            <div className="skel skel-avatar" />
            <div className="skel-lines">
              <div className="skel" style={{ width: '70%' }} />
              <div className="skel" style={{ width: '50%' }} />
              <div className="skel" style={{ width: '60%' }} />
            </div>
          </div>
          <div className="skel skel-btn" />
        </div>
      ))}
    </div>
  )
}

interface BoundaryState {
  error: Error | null
}

/** Last line of defence: shows a friendly screen instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Faculty-Finder] Unexpected error', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="wrap" style={{ paddingBlock: '4rem' }}>
        <ErrorState
          title="Something went wrong"
          message="An unexpected error stopped the page from loading. Reloading usually fixes it."
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }
}
