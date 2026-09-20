import type { Facets } from '../lib/search'
import type { Filters } from '../types/faculty'

interface Props {
  facets: Facets
  filters: Filters
  onToggle: (group: keyof Filters, value: string) => void
}

interface GroupProps {
  legend: string
  group: keyof Filters
  options: { value: string; count: number }[]
  selected: string[]
  onToggle: Props['onToggle']
  scroll?: boolean
}

function Group({ legend, group, options, selected, onToggle, scroll }: GroupProps) {
  if (options.length < 2 && selected.length === 0) return null
  return (
    <fieldset className="fgroup">
      <legend>{legend}</legend>
      <div className={scroll ? 'fopts fopts-scroll' : 'fopts'}>
        {options.map((o) => {
          const checked = selected.includes(o.value)
          const disabled = o.count === 0 && !checked
          return (
            <label key={o.value} className="opt" data-disabled={disabled || undefined}>
              <input type="checkbox" checked={checked} disabled={disabled} onChange={() => onToggle(group, o.value)} />
              <span className="opt-label">{o.value}</span>
              <span className="opt-count">{o.count}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function FilterPanel({ facets, filters, onToggle }: Props) {
  return (
    <div className="fpanel">
      <Group legend="Faculty / School" group="schools" options={facets.schools} selected={filters.schools} onToggle={onToggle} />
      <Group legend="Department" group="departments" options={facets.departments} selected={filters.departments} onToggle={onToggle} scroll />
      <Group legend="Designation" group="designations" options={facets.designations} selected={filters.designations} onToggle={onToggle} />
      <Group legend="Role" group="types" options={facets.types} selected={filters.types} onToggle={onToggle} />
    </div>
  )
}
