import { useEffect, useRef, useState } from 'react'
import type { Faculty } from '../types/faculty'
import { FacultyCard } from './FacultyCard'

const PAGE = 36

interface Props {
  items: Faculty[]
  tokens: string[]
  hrefFor: (slug: string) => string
  onOpen: (slug: string) => void
}

/** Renders cards in batches so a few hundred faculty never slow the page down. */
export function FacultyGrid({ items, tokens, hrefFor, onOpen }: Props) {
  const [count, setCount] = useState(PAGE)
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => setCount(PAGE), [items])

  useEffect(() => {
    const el = sentinel.current
    if (!el || count >= items.length) return
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && setCount((c) => c + PAGE), { rootMargin: '800px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [count, items.length])

  return (
    <>
      <div className="grid">
        {items.slice(0, count).map((f) => (
          <FacultyCard key={f.slug} faculty={f} tokens={tokens} href={hrefFor(f.slug)} onOpen={onOpen} />
        ))}
      </div>
      {count < items.length && (
        <div ref={sentinel} className="more">
          <button className="btn" onClick={() => setCount((c) => c + PAGE)}>
            Show more
          </button>
        </div>
      )}
    </>
  )
}
