import { highlightRanges } from '../lib/text'

/** Wraps the parts of `text` that match the search tokens in <mark>. */
export function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
  const ranges = highlightRanges(text, tokens)
  if (ranges.length === 0) return <>{text}</>
  const out: React.ReactNode[] = []
  let cursor = 0
  ranges.forEach((r, i) => {
    if (r.start > cursor) out.push(text.slice(cursor, r.start))
    out.push(<mark key={i}>{text.slice(r.start, r.end)}</mark>)
    cursor = r.end
  })
  if (cursor < text.length) out.push(text.slice(cursor))
  return <>{out}</>
}
