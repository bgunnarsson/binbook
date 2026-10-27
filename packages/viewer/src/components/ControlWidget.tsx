import type { ArgSpec } from '@bgunnarsson/binbook-types'

const INPUT_CLS = 'bg-inset rounded-md text-text px-3 py-2 text-[13px] focus:ring-1 focus:ring-accent outline-none'

export function ControlWidget({
  name,
  spec,
  value,
  onChange,
}: {
  name: string
  spec: ArgSpec
  value: unknown
  onChange: (key: string, value: unknown) => void
}) {
  if (spec.type === 'boolean') {
    const on = Boolean(value)
    return (
      <>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={name}
          onClick={() => onChange(name, !on)}
          className={`relative h-[18px] w-[34px] shrink-0 rounded-full transition ${on ? 'bg-accent' : 'bg-inset'}`}
        >
          <span
            className={`absolute top-[3px] h-3 w-3 rounded-full transition-all ${
              on ? 'left-[19px] bg-accent-ink' : 'left-[3px] bg-dim'
            }`}
          />
        </button>
        <span className={`text-[12px] ${on ? 'text-text' : 'text-dim'}`}>{on ? 'true' : 'false'}</span>
      </>
    )
  }

  if (spec.type === 'select') {
    const options = spec.options ?? []
    if (options.length <= 4) {
      return (
        <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-1.5">
          {options.map((o) => {
            const selected = o === value
            return (
              <button
                key={o}
                type="button"
                onClick={() => onChange(name, o)}
                className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition ${
                  selected ? 'bg-accent text-accent-ink' : 'bg-inset text-muted hover:text-text'
                }`}
              >
                {o}
              </button>
            )
          })}
        </div>
      )
    }
    return (
      <select
        aria-label={name}
        value={String(value ?? '')}
        onChange={(e) => onChange(name, e.target.value)}
        className={`${INPUT_CLS} cursor-pointer`}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    )
  }

  if (spec.type === 'number') {
    const num = Number(value) || 0
    const max = Math.max(100, num * 2 || 100)
    return (
      <>
        <input
          type="range"
          aria-label={name}
          min={0}
          max={max}
          step={1}
          value={num}
          onChange={(e) => onChange(name, Number(e.target.value))}
          className="flex-1"
        />
        <span className="min-w-[34px] text-right text-[12px] text-accent-text">{num}</span>
      </>
    )
  }

  if (spec.type === 'color') {
    const hex = String(value ?? '#000000')
    return (
      <>
        <input
          type="color"
          aria-label={name}
          value={hex}
          onChange={(e) => onChange(name, e.target.value)}
          className="h-[30px] w-[38px] cursor-pointer rounded-md border-0 bg-inset"
        />
        <span className="text-[12px] text-accent-text">{hex}</span>
      </>
    )
  }

  // text
  return (
    <input
      type="text"
      aria-label={name}
      value={String(value ?? '')}
      onChange={(e) => onChange(name, e.target.value)}
      className={`${INPUT_CLS} flex-1`}
    />
  )
}
