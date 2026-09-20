import type { CSSProperties, MouseEvent } from 'react'
import { copyText, telHref } from '../lib/contact'
import { hueFor } from '../lib/text'
import type { Faculty } from '../types/faculty'
import { Avatar } from './Avatar'
import { Highlight } from './Highlight'
import { Icon } from './Icons'
import { useToast } from './Toast'

interface Props {
  faculty: Faculty
  tokens: string[]
  href: string
  onOpen: (slug: string) => void
}

export function FacultyCard({ faculty: f, tokens, href, onOpen }: Props) {
  const toast = useToast()
  const style = { '--h': hueFor(f.department ?? f.name) } as CSSProperties
  const phone = f.phones[0]

  const open = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    onOpen(f.slug)
  }

  const copyEmail = async () => {
    if (!f.email) return
    toast((await copyText(f.email)) ? 'Email copied' : 'Couldn’t copy — long-press the address instead')
  }

  return (
    <article className="card" style={style}>
      <div className="card-top">
        <Avatar faculty={f} />
        <div className="card-text">
          <h3 className="card-name">
            <a className="card-link" href={href} onClick={open}>
              <Highlight text={f.name} tokens={tokens} />
            </a>
          </h3>
          {f.designation && (
            <p className="card-role">
              <Highlight text={f.designation} tokens={tokens} />
            </p>
          )}
          {f.department && (
            <p className="card-dept">
              <span className="dot" aria-hidden="true" />
              <span>
                <Highlight text={f.department} tokens={tokens} />
              </span>
            </p>
          )}
        </div>
        <span className="card-chevron" aria-hidden="true">
          <Icon.Chevron size={18} />
        </span>
      </div>
      {(f.email || phone) && (
        <div className="card-actions">
          {f.email && (
            <a className="btn btn-sm" href={`mailto:${f.email}`} aria-label={`Email ${f.name}`}>
              <Icon.Mail size={17} /> Email
            </a>
          )}
          {phone && (
            <a className="btn btn-sm" href={telHref(phone)} aria-label={`Call ${f.name}`}>
              <Icon.Phone size={17} /> Call
            </a>
          )}
          {f.email && (
            <button className="btn btn-sm btn-icon" onClick={copyEmail} aria-label={`Copy email address of ${f.name}`} title="Copy email">
              <Icon.Copy size={17} />
            </button>
          )}
        </div>
      )}
    </article>
  )
}
