import { useEffect, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import { useStore } from '../store'
import type { BottomTab, Dock } from '../store'
import { ControlWidget } from './ControlWidget'
import { fetchDocs } from '../api'

// Panel size is a height when docked to the bottom and a width when docked to
// the right; each dock remembers its own size under its own key.
const SIZING: Record<Dock, { min: number; default: number; key: string }> = {
  bottom: { min: 120, default: 272, key: 'binbook:bottomPanelHeight' },
  right: { min: 240, default: 380, key: 'binbook:rightPanelWidth' },
}

function loadSize(dock: Dock): number {
  const { min, default: def, key } = SIZING[dock]
  if (typeof localStorage === 'undefined') {
    return def
  }
  const v = Number(localStorage.getItem(key))
  return Number.isFinite(v) && v >= min ? v : def
}

function maxSize(dock: Dock): number {
  if (typeof window === 'undefined') {
    return SIZING[dock].default
  }
  return dock === 'right'
    ? // Leave room for the sidebar and a usable slice of canvas.
      Math.max(SIZING.right.min, window.innerWidth - 560)
    : // Leave room for the toolbar and a slice of canvas.
      Math.max(SIZING.bottom.min, window.innerHeight - 160)
}

const TABS: { key: BottomTab; label: string }[] = [
  { key: 'controls', label: 'Controls' },
  { key: 'actions', label: 'Actions' },
  { key: 'a11y', label: 'Accessibility' },
  { key: 'code', label: 'Code' },
]

function TabBar() {
  const bottomTab = useStore((s) => s.bottomTab)
  const setBottomTab = useStore((s) => s.setBottomTab)
  const actions = useStore((s) => s.actions)
  const a11y = useStore((s) => s.a11y)

  const counts: Partial<Record<BottomTab, number>> = {
    actions: actions.length,
    a11y: a11y?.violations.length ?? 0,
  }

  return (
    <div className="flex h-[52px] flex-none items-stretch border-b border-line">
      <div role="tablist" className="flex flex-1 items-stretch gap-5 overflow-x-auto px-3 sm:gap-7 sm:px-6">
        {TABS.map((t) => {
          const active = bottomTab === t.key
          const count = counts[t.key]
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setBottomTab(t.key)}
              className={`inline-flex flex-none items-center gap-2 whitespace-nowrap border-b-2 text-[13px] font-medium transition ${
                active ? 'border-accent text-text' : 'border-transparent text-muted hover:text-text'
              }`}
            >
              {t.label}
              {count ? (
                <span
                  className={`rounded-md px-[7px] py-px text-[11px] font-semibold ${
                    t.key === 'a11y' ? 'bg-danger/15 text-danger' : 'bg-accent-soft text-accent-text'
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      <DockToggle />
    </div>
  )
}

/** A small glyph of the app frame with the panel's target position highlighted. */
function DockGlyph({ target }: { target: Dock }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.3" />
      {target === 'right' ? (
        <rect x="9.5" y="1.5" width="5" height="13" fill="currentColor" opacity="0.85" />
      ) : (
        <rect x="1.5" y="9.5" width="13" height="5" fill="currentColor" opacity="0.85" />
      )}
    </svg>
  )
}

/** Toggles the work panel between docking below the canvas and beside it. */
function DockToggle() {
  const dock = useStore((s) => s.dock)
  const setDock = useStore((s) => s.setDock)
  const next: Dock = dock === 'bottom' ? 'right' : 'bottom'
  return (
    <button
      type="button"
      onClick={() => setDock(next)}
      title={`Dock panel to the ${next}`}
      aria-label={`Dock panel to the ${next}`}
      className="flex flex-none items-center px-4 text-muted transition-colors hover:text-text sm:px-6"
    >
      <DockGlyph target={next} />
    </button>
  )
}

function ControlsPanel() {
  const selected = useStore((s) => s.selected)
  const stories = useStore((s) => s.stories)
  const liveArgs = useStore((s) => s.liveArgs)
  const setArg = useStore((s) => s.setArg)
  const resetArgs = useStore((s) => s.resetArgs)

  const story = selected ? stories.find((s) => s.id === selected.storyId) : undefined
  const entries = Object.entries(story?.args ?? {})

  if (entries.length === 0) {
    return <p className="py-6 text-center text-dim text-[12.5px]">No controls for this story.</p>
  }

  return (
    <div>
      {entries.map(([name, spec]) => (
        <div key={name} className="flex items-center gap-6 border-b border-line py-2.5">
          <div className="w-[88px] shrink-0 text-[13px] text-muted sm:w-[140px]">{spec.label ?? name}</div>
          <div className="flex min-h-[36px] flex-1 items-center gap-2.5">
            <ControlWidget
              name={name}
              spec={spec}
              value={name in liveArgs ? liveArgs[name] : spec.default}
              onChange={setArg}
            />
          </div>
        </div>
      ))}
      <div className="pt-3">
        <button
          type="button"
          onClick={resetArgs}
          className="rounded-md bg-inset px-3.5 py-2 text-[13px] font-medium text-text hover:bg-chip"
        >
          Reset controls
        </button>
      </div>
    </div>
  )
}

function ActionsPanel() {
  const actions = useStore((s) => s.actions)
  const clearActions = useStore((s) => s.clearActions)

  if (actions.length === 0) {
    return (
      <div className="py-8 text-center text-[12.5px] text-dim">
        Interact with the story in the canvas to log emitted events.
      </div>
    )
  }

  return (
    <div>
      <div className="mb-1.5 flex justify-end">
        <button
          type="button"
          onClick={clearActions}
          className="rounded-md bg-inset px-2.5 py-1 text-[11px] font-medium text-muted hover:bg-chip hover:text-text"
        >
          Clear
        </button>
      </div>
      {actions.map((a) => (
        <div key={a.id} className="flex items-baseline gap-3.5 border-b border-line py-2 text-[12px]">
          <span className="text-dim">{new Date(a.t).toLocaleTimeString()}</span>
          <span className="font-medium text-text">{a.name}</span>
          <span className="truncate font-mono text-muted">{JSON.stringify(a.detail)}</span>
        </div>
      ))}
    </div>
  )
}

function A11yPanel() {
  const a11y = useStore((s) => s.a11y)

  if (!a11y) {
    return (
      <div className="py-8 text-center text-[12.5px] text-dim">
        Switch to the Accessibility tab after a story renders to run checks.
      </div>
    )
  }

  const count = a11y.violations.length

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <span
          className={`rounded-md px-3 py-1 text-[12px] font-semibold ${
            count === 0 ? 'bg-success-soft text-success' : 'bg-danger/15 text-danger'
          }`}
        >
          {count === 0 ? 'All checks pass' : `${count} violation${count > 1 ? 's' : ''}`}
        </span>
      </div>
      {a11y.violations.map((v) => (
        <div key={v.id} className="flex items-start gap-3 border-b border-line py-2.5">
          <span
            className={`mt-1.5 h-[9px] w-[9px] shrink-0 rounded-full ${
              v.impact === 'critical' || v.impact === 'serious'
                ? 'bg-danger'
                : v.impact === 'moderate'
                  ? 'bg-warn'
                  : 'bg-dim'
            }`}
          />
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold text-text">{v.help}</div>
            <div className="mt-0.5 text-[12px] text-muted">
              {v.nodes} node{v.nodes === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function CodePanel() {
  const selected = useStore((s) => s.selected)
  const [source, setSource] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!selected) {
      setSource('')
      return
    }
    let cancelled = false
    fetchDocs(selected.storyId)
      .then((d) => {
        if (!cancelled) {
          setSource(d.source ?? '')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSource('')
        }
      })
    return () => {
      cancelled = true
    }
  }, [selected])

  const onCopy = () => {
    navigator.clipboard?.writeText(source)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-dim">Story source · framework-agnostic HTML</span>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md bg-inset px-3 py-1 text-[12px] font-medium text-text hover:bg-chip"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-auto rounded-md bg-inset p-4 font-mono text-[12.5px] leading-relaxed text-muted">
        {source}
      </pre>
    </div>
  )
}

function ResizeHandle({
  dock,
  size,
  min,
  max,
  onResize,
}: {
  dock: Dock
  size: number
  min: number
  max: number
  onResize: (deltaFromStart: number, startSize: number) => number
}) {
  const isRight = dock === 'right'
  const onPointerDown = (e: ReactPointerEvent) => {
    // Only the primary button starts a drag.
    if (e.button !== 0) {
      return
    }
    e.preventDefault()
    const start = isRight ? e.clientX : e.clientY
    const startSize = onResize(0, NaN) // returns the current size (see BottomPanel)

    const onMove = (ev: PointerEvent) => onResize((isRight ? ev.clientX : ev.clientY) - start, startSize)
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.style.userSelect = ''
    }
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // The drag is a pointer gesture and was the only way to move this handle.
  // Arrow keys move it the same way — the sign matches the drag, where pulling
  // toward the canvas makes the panel larger. Shift is the coarse step.
  const onKeyDown = (e: ReactKeyboardEvent) => {
    const towardCanvas = isRight ? 'ArrowLeft' : 'ArrowUp'
    const awayFromCanvas = isRight ? 'ArrowRight' : 'ArrowDown'
    if (e.key !== towardCanvas && e.key !== awayFromCanvas) {
      return
    }
    e.preventDefault()
    const step = (e.shiftKey ? 48 : 8) * (e.key === towardCanvas ? -1 : 1)
    onResize(step, size)
  }

  return (
    // <hr> is the semantic separator and cannot hold the grip and the hover
    // edge this draws, nor take a pointer gesture.
    // biome-ignore lint/a11y/useSemanticElements: an <hr> cannot carry the handle
    <div
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      role="separator"
      tabIndex={0}
      aria-orientation={isRight ? 'vertical' : 'horizontal'}
      aria-label="Resize panel"
      aria-valuenow={size}
      aria-valuemin={min}
      aria-valuemax={max}
      title="Drag or use the arrow keys to resize"
      className={`group relative flex-none outline-none ring-accent focus-visible:ring-2 ${isRight ? 'h-full w-2 cursor-ew-resize' : 'h-2 w-full cursor-ns-resize'}`}
    >
      {/* the panel's leading edge, brightening to accent on hover/drag */}
      <div
        className={`absolute bg-line transition-colors group-hover:bg-accent ${
          isRight ? 'inset-y-0 left-0 w-px' : 'inset-x-0 top-0 h-px'
        }`}
      />
      {/* a small centered grip */}
      <div
        className={`pointer-events-none absolute rounded-full bg-chip transition-colors group-hover:bg-accent ${
          isRight
            ? 'left-[3px] top-1/2 h-9 w-[3px] -translate-y-1/2'
            : 'left-1/2 top-[3px] h-[3px] w-9 -translate-x-1/2'
        }`}
      />
    </div>
  )
}

export function BottomPanel() {
  const bottomTab = useStore((s) => s.bottomTab)
  const dock = useStore((s) => s.dock)
  const [size, setSize] = useState(() => loadSize(dock))

  // Re-read the remembered size when the dock flips (height ↔ width).
  useEffect(() => {
    setSize(loadSize(dock))
  }, [dock])

  const isRight = dock === 'right'

  // Called by the handle: with NaN it reports the current size (drag start);
  // otherwise it applies delta (dragging toward the canvas = larger) and persists.
  const resize = (deltaFromStart: number, startSize: number): number => {
    if (Number.isNaN(startSize)) {
      return size
    }
    const next = Math.min(maxSize(dock), Math.max(SIZING[dock].min, Math.round(startSize - deltaFromStart)))
    setSize(next)
    try {
      localStorage.setItem(SIZING[dock].key, String(next))
    } catch {
      /* ignore */
    }
    return next
  }

  return (
    <div
      className={`flex flex-none bg-panel ${isRight ? 'flex-row border-l border-line' : 'flex-col'}`}
      style={isRight ? { width: size } : { height: size }}
    >
      <ResizeHandle dock={dock} size={size} min={SIZING[dock].min} max={maxSize(dock)} onResize={resize} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TabBar />
        <div className="flex-1 min-h-0 overflow-auto px-3 py-1 sm:px-6">
          {bottomTab === 'controls' && <ControlsPanel />}
          {bottomTab === 'actions' && <ActionsPanel />}
          {bottomTab === 'a11y' && <A11yPanel />}
          {bottomTab === 'code' && <CodePanel />}
        </div>
      </div>
    </div>
  )
}
