import { useRef, type CSSProperties } from 'react'
import { SITE } from '../config'
import { copyText, downloadVCard, telHref } from '../lib/contact'
import { hueFor } from '../lib/text'
import type { Faculty } from '../types/faculty'
import { Avatar } from './Avatar'
import { EmptyState } from './States'
import { Icon } from './Icons'
import { Sheet } from './Sheet'
import { useToast } from './Toast'

interface Props {
  open: boolean
  faculty: Faculty | undefined
  /** True when a profile URL was requested but no such person exists. */
  missing: boolean
  onClose: () => void
  onPickDepartment: (department: string) => void
}

function Row({ label, children, copy, onCopy }: { label: string; children: React.ReactNode; copy?: string; onCopy?: (value: string, label: string) => void }) {
  return (
    <div className="row">
      <dt>{label}</dt>
      <dd>{children}</dd>
      {copy && onCopy && (
        <button className="icon-btn icon-btn-sm" onClick={() => onCopy(copy, label)} aria-label={`Copy ${label.toLowerCase()}`} title={`Copy ${label.toLowerCase()}`}>
          <Icon.Copy size={17} />
        </button>
      )}
    </div>
  )
}

export function ProfileSheet({ open, faculty, missing, onClose, onPickDepartment }: Props) {
  const toast = useToast()
  const last = useRef<Faculty | undefined>(undefined)
  if (faculty) last.current = faculty
  const f = faculty ?? last.current

  const copy = async (value: string, label: string) => {
    toast((await copyText(value)) ? `${label} copied` : 'Couldn’t copy on this browser')
  }

  return (
    <Sheet open={open} onClose={onClose} labelledBy="profile-title" className="sheet-profile">
      <div className="sheet-head">
        <span className="grab" aria-hidden="true" />
        <button className="icon-btn" onClick={onClose} aria-label="Close profile" data-autofocus>
          <Icon.X />
        </button>
      </div>

      {!f && missing && (
        <div className="sheet-body">
          <h2 id="profile-title" className="sr-only">
            Profile not found
          </h2>
          <EmptyState title="Profile not found" text="This faculty link may be outdated. Search the directory to find the person you’re looking for.">
            <button className="btn btn-primary" onClick={onClose}>
              Back to directory
            </button>
          </EmptyState>
        </div>
      )}

      {f && (
        <>
          <div className="sheet-body" style={{ '--h': hueFor(f.department ?? f.name) } as CSSProperties}>
            <div className="profile-hero">
              <Avatar faculty={f} size="xl" />
              <div className="profile-id">
                <h2 id="profile-title">{f.name}</h2>
                {f.designation && <p className="profile-role">{f.designation}</p>}
                <div className="profile-meta">
                  {f.department && (
                    <button className="dept-link" onClick={() => onPickDepartment(f.department!)} title={`See everyone in ${f.department}`}>
                      <span className="dot" aria-hidden="true" />
                      {f.department}
                    </button>
                  )}
                  {f.type && <span className="badge">{f.type}</span>}
                </div>
              </div>
            </div>

            {(f.email || f.phones.length > 0 || f.profileUrl) && (
              <div className="profile-actions">
                {f.email && (
                  <a className="btn btn-primary btn-lg" href={`mailto:${f.email}`}>
                    <Icon.Mail size={18} /> Email
                  </a>
                )}
                {f.phones[0] && (
                  <a className="btn btn-lg" href={telHref(f.phones[0])}>
                    <Icon.Phone size={18} /> Call
                  </a>
                )}
                {f.profileUrl && (
                  <a className="btn btn-lg" href={f.profileUrl} target="_blank" rel="noreferrer">
                    <Icon.External size={18} /> Profile
                  </a>
                )}
              </div>
            )}

            {(f.email || f.phones.length > 0 || f.office || Object.keys(f.extra).length > 0) && (
              <dl className="details">
                {f.email && (
                  <Row label="Email" copy={f.email} onCopy={copy}>
                    <a href={`mailto:${f.email}`}>{f.email}</a>
                  </Row>
                )}
                {f.phones.map((p, i) => (
                  <Row key={p} label={f.phones.length > 1 ? `Phone ${i + 1}` : 'Phone'} copy={p} onCopy={copy}>
                    <a href={telHref(p)}>{p}</a>
                  </Row>
                ))}
                {f.office && (
                  <Row label="Office" copy={f.office} onCopy={copy}>
                    {f.office}
                  </Row>
                )}
                {Object.entries(f.extra).map(([k, v]) => (
                  <Row key={k} label={k}>
                    {v}
                  </Row>
                ))}
              </dl>
            )}

            {f.education.length > 0 && (
              <section className="psection">
                <h3>Education</h3>
                <ul className="plist">
                  {f.education.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </section>
            )}

            {f.research.length > 0 && (
              <section className="psection">
                <h3>Research interests</h3>
                <ul className="tags">
                  {f.research.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div className="sheet-foot">
            <button
              className="btn"
              onClick={async () => toast((await copyText(window.location.origin + '/faculty/' + f.slug)) ? 'Link copied' : 'Couldn’t copy on this browser')}
            >
              <Icon.Link size={17} /> Copy link
            </button>
            {(f.email || f.phones.length > 0) && (
              <button className="btn" onClick={() => downloadVCard(f, SITE.university)}>
                <Icon.Download size={17} /> Save contact
              </button>
            )}
          </div>
        </>
      )}
    </Sheet>
  )
}
