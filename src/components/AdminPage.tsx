import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { SITE } from '../config'
import { clearOverrideDataset, parseAny, setOverrideDataset } from '../data/loadFaculty'
import { navigate } from '../hooks/useRoute'
import type { Dataset } from '../types/faculty'
import { Icon } from './Icons'
import { useToast } from './Toast'

/* ── password gate ──────────────────────────────────────────────────────── */

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState('')
  const [wrong, setWrong] = useState(false)

  const attempt = () => {
    if (pw === SITE.adminPassword) {
      sessionStorage.setItem('ff-admin-unlocked', '1')
      onUnlock()
    } else {
      setWrong(true)
      setPw('')
    }
  }

  return (
    <div className="admin-gate">
      <div className="admin-gate-box">
        <div className="admin-icon-wrap">
          <Icon.Sliders size={22} />
        </div>
        <h1>Admin</h1>
        <p>Enter the admin password to manage faculty data.</p>
        <form onSubmit={(e) => { e.preventDefault(); attempt() }}>
          <input
            type="password"
            className="admin-pw-input"
            placeholder="Password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setWrong(false) }}
            autoFocus
            aria-label="Admin password"
            aria-invalid={wrong}
          />
          {wrong && <p className="admin-error">Wrong password. Try again.</p>}
          <button className="btn btn-primary btn-lg" type="submit" style={{ width: '100%' }}>
            Unlock
          </button>
        </form>
        <button className="link-btn" style={{ marginTop: 16, display: 'block', textAlign: 'center', width: '100%' }} onClick={() => navigate('/')}>
          Back to directory
        </button>
      </div>
    </div>
  )
}

/* ── file drop zone ─────────────────────────────────────────────────────── */

interface DropZoneProps {
  onFile: (text: string, name: string) => void
  loading: boolean
}

function DropZone({ onFile, loading }: DropZoneProps) {
  const [over, setOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const read = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => onFile(e.target!.result as string, file.name)
    reader.readAsText(file, 'utf-8')
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault(); setOver(false)
    const file = e.dataTransfer.files[0]
    if (file) read(file)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) read(file)
    e.target.value = ''
  }

  return (
    <div
      className={`drop-zone${over ? ' drop-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      aria-label="Upload faculty CSV or JSON file"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept=".csv,.json,.tsv" onChange={onChange} style={{ display: 'none' }} />
      {loading ? (
        <>
          <div className="skel skel-avatar" style={{ margin: '0 auto 12px' }} />
          <p>Parsing file…</p>
        </>
      ) : (
        <>
          <Icon.Download size={28} />
          <p><strong>Drop your CSV or JSON here</strong></p>
          <p className="drop-hint">or click to browse &nbsp;·&nbsp; .csv and .json accepted</p>
        </>
      )}
    </div>
  )
}

/* ── preview table ──────────────────────────────────────────────────────── */

function Preview({ dataset, onApply, onDownload, onDiscard }: {
  dataset: Dataset
  onApply: () => void
  onDownload: () => void
  onDiscard: () => void
}) {
  const r = dataset.report
  const sample = dataset.faculty.slice(0, 8)

  return (
    <div className="admin-preview">
      <div className="admin-stats">
        <div className="stat-box">
          <span className="stat-num">{dataset.faculty.length}</span>
          <span className="stat-label">Faculty loaded</span>
        </div>
        <div className="stat-box">
          <span className="stat-num">{r.skipped}</span>
          <span className="stat-label">Rows skipped (no name)</span>
        </div>
        <div className="stat-box">
          <span className="stat-num">{r.duplicates}</span>
          <span className="stat-label">Duplicates merged</span>
        </div>
        <div className="stat-box">
          <span className="stat-num">{r.unknownColumns.length}</span>
          <span className="stat-label">Unknown columns</span>
        </div>
      </div>

      <div className="admin-section">
        <h3>Matched columns</h3>
        <div className="col-tags">
          {Object.entries(r.matchedColumns).map(([field, col]) => (
            <span key={field} className="col-tag">
              <span className="col-field">{field}</span> ← <code>{col}</code>
            </span>
          ))}
        </div>
        {r.unknownColumns.length > 0 && (
          <p className="admin-note">
            ⚠ Unrecognised columns (kept as extra info in profiles):{' '}
            {r.unknownColumns.map((c) => <code key={c}>{c}</code>).reduce<React.ReactNode[]>((a, el) => a.length ? [...a, ', ', el] : [el], [])}
          </p>
        )}
      </div>

      <div className="admin-section">
        <h3>Preview — first {sample.length} records</h3>
        <div className="preview-scroll">
          <table className="preview-table">
            <thead>
              <tr>
                <th>Name</th><th>Department</th><th>Designation</th><th>Email</th><th>Research (count)</th>
              </tr>
            </thead>
            <tbody>
              {sample.map((f) => (
                <tr key={f.slug}>
                  <td>{f.name}</td>
                  <td>{f.department ?? <em>—</em>}</td>
                  <td>{f.designation ?? <em>—</em>}</td>
                  <td>{f.email ?? <em>—</em>}</td>
                  <td>{f.research.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-actions-row">
        <button className="btn" onClick={onDiscard}>
          <Icon.X size={17} /> Discard
        </button>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onDownload} title="Download the processed data as faculty.json to replace the file in your repo">
            <Icon.Download size={17} /> Download as faculty.json
          </button>
          <button className="btn btn-primary" onClick={onApply}>
            <Icon.Check size={17} /> Apply to this device
          </button>
        </div>
      </div>

      <div className="admin-note-box">
        <strong>Apply to this device</strong> — the processed data is stored in this browser. The directory will use it on this device until you clear it or close private mode. Great for previewing before deploying.
        <br /><br />
        <strong>Download as faculty.json</strong> — saves the processed file. Replace <code>public/faculty.json</code> in your repo, commit and push. Vercel redeploys in ~60 seconds and everyone gets the new data.
      </div>
    </div>
  )
}

/* ── active override banner ─────────────────────────────────────────────── */

function ActiveOverrideBanner({ dataset, onClear }: { dataset: Dataset; onClear: () => void }) {
  return (
    <div className="override-banner">
      <Icon.Alert size={18} />
      <div>
        <strong>Override active on this device</strong> — you uploaded a dataset with{' '}
        {dataset.faculty.length} faculty (source: <code>{dataset.report.source}</code>). The directory is showing this data instead of the server file.
      </div>
      <button className="btn" onClick={onClear}>
        <Icon.X size={16} /> Clear override
      </button>
    </div>
  )
}

/* ── main admin page ────────────────────────────────────────────────────── */

function isUnlocked() {
  try { return sessionStorage.getItem('ff-admin-unlocked') === '1' } catch { return false }
}

export function AdminPage({ currentOverride }: { currentOverride: Dataset | null }) {
  const toast = useToast()
  const [unlocked, setUnlocked] = useState(isUnlocked)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<Dataset | null>(null)
  const [override, setOverride] = useState<Dataset | null>(currentOverride)

  const handleFile = useCallback((text: string, name: string) => {
    setParsing(true); setError(null); setPreview(null)
    setTimeout(() => {
      try {
        const ds = parseAny(text, name)
        setPreview(ds)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to parse the file.')
      } finally { setParsing(false) }
    }, 30) // yield to render so "Parsing…" shows
  }, [])

  const handleApply = () => {
    if (!preview) return
    setOverrideDataset(preview)
    setOverride(preview)
    setPreview(null)
    toast('Override applied — directory now uses the uploaded data on this device')
  }

  const handleDownload = () => {
    if (!preview) return
    const blob = new Blob([JSON.stringify(preview.faculty, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'faculty.json'
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const handleClearOverride = () => {
    clearOverrideDataset()
    setOverride(null)
    toast('Override cleared — directory will load from the server file on next visit')
  }

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <button className="icon-btn" onClick={() => navigate('/')} aria-label="Back to directory">
          <span style={{ display: "inline-grid", transform: "rotate(180deg)" }}><Icon.Chevron size={20} /></span>
        </button>
        <h1>Admin — Faculty Data</h1>
      </div>

      {override && <ActiveOverrideBanner dataset={override} onClear={handleClearOverride} />}

      <div className="admin-section">
        <h2>Upload new faculty data</h2>
        <p className="admin-desc">
          Drop the CSV or JSON you scraped from the AIUB website. The app will parse, clean and deduplicate it instantly.
          You can then preview it, apply it to this device, or download it ready to commit.
        </p>
        <DropZone onFile={handleFile} loading={parsing} />
        {error && (
          <div className="admin-error-box" role="alert">
            <Icon.Alert size={18} /> {error}
          </div>
        )}
      </div>

      {preview && (
        <Preview dataset={preview} onApply={handleApply} onDownload={handleDownload} onDiscard={() => setPreview(null)} />
      )}

      <div className="admin-section">
        <h2>How to update the live site</h2>
        <ol className="admin-steps">
          <li>Scrape the new faculty list from the AIUB website (save as CSV or JSON).</li>
          <li>Come here → drop the file → Preview looks good? → click <strong>Download as faculty.json</strong>.</li>
          <li>Replace <code>public/faculty.json</code> in your project folder with the downloaded file.</li>
          <li>Open VS Code terminal: <code>git add . &amp;&amp; git commit -m "Update faculty data" &amp;&amp; git push</code></li>
          <li>Vercel redeploys automatically. Everyone sees the new data in ~60 seconds.</li>
        </ol>
        <p className="admin-note">
          Alternatively, <strong>Apply to this device</strong> stores the data in this browser only — useful for previewing before committing.
          The override is cleared if you clear browser storage or use another device.
        </p>
      </div>

      <div className="admin-section">
        <h2>Accepted file formats</h2>
        <table className="preview-table" style={{ maxWidth: 540 }}>
          <thead><tr><th>Format</th><th>Requirements</th></tr></thead>
          <tbody>
            <tr><td>CSV (.csv)</td><td>UTF-8, first row is the header, comma / semicolon / tab separated</td></tr>
            <tr><td>JSON (.json)</td><td>Array of objects, or an object with a "data"/"faculty" key containing the array</td></tr>
          </tbody>
        </table>
        <p className="admin-note">
          Column names are matched loosely — case, spaces and punctuation are ignored.
          For the full list of recognised column names, see <code>src/lib/columns.ts</code>.
        </p>
      </div>
    </div>
  )
}
