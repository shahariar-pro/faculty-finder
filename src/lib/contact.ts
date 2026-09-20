import type { Faculty } from '../types/faculty'

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/** Keeps digits and a leading + so the number works in a tel: link. */
export function telHref(phone: string): string {
  const first = phone.trim()
  const plus = first.startsWith('+') ? '+' : ''
  return `tel:${plus}${first.replace(/\D/g, '')}`
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')

export function buildVCard(f: Faculty, org: string): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${esc(f.name)}`]
  const parts = f.name.split(' ')
  lines.push(`N:${esc(parts.slice(-1).join(' '))};${esc(parts.slice(0, -1).join(' '))};;;`)
  const orgLine = [org, f.department].filter(Boolean).join(';')
  if (orgLine) lines.push(`ORG:${orgLine.split(';').map(esc).join(';')}`)
  if (f.designation) lines.push(`TITLE:${esc(f.designation)}`)
  if (f.email) lines.push(`EMAIL;TYPE=WORK:${f.email}`)
  f.phones.forEach((p) => lines.push(`TEL;TYPE=WORK:${p}`))
  if (f.profileUrl) lines.push(`URL:${f.profileUrl}`)
  lines.push('END:VCARD')
  return lines.join('\r\n')
}

export function downloadVCard(f: Faculty, org: string) {
  const blob = new Blob([buildVCard(f, org)], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${f.slug}.vcf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
