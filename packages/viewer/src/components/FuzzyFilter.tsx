import { useEffect, useRef } from 'react'

export function FuzzyFilter({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      if (e.key === '/' && !typing) {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div className="relative flex items-center">
      <input
        ref={ref}
        type="search"
        aria-label="Filter stories"
        placeholder="Search components…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md bg-inset py-2.5 pl-3.5 pr-9 text-[13px] text-text outline-none placeholder:text-dim focus:ring-1 focus:ring-accent"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-2 rounded-sm bg-chip px-[7px] py-px text-[11px] font-medium text-muted"
      >
        /
      </span>
    </div>
  )
}
