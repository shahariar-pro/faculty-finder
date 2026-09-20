import { useState, type CSSProperties } from 'react'
import { hueFor, initials } from '../lib/text'
import type { Faculty } from '../types/faculty'

interface Props {
  faculty: Pick<Faculty, 'name' | 'imageUrl' | 'department'>
  size?: 'md' | 'xl'
}

/** Photo when we have a working one, otherwise initials tinted with the department colour. */
export function Avatar({ faculty, size = 'md' }: Props) {
  const [failed, setFailed] = useState(false)
  const style = { '--h': hueFor(faculty.department ?? faculty.name) } as CSSProperties
  return (
    <div className={`avatar avatar-${size}`} style={style} aria-hidden="true">
      <span>{initials(faculty.name)}</span>
      {faculty.imageUrl && !failed && (
        <img
          src={faculty.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}
