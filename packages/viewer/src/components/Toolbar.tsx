import { useStore } from '../store'
import { VIEWPORTS, viewportByKey } from '../viewports'

export function Toolbar() {
  const tab = useStore((s) => s.tab)
  const setTab = useStore((s) => s.setTab)
  const setPaletteOpen = useStore((s) => s.setPaletteOpen)
  const setMobileNav = useStore((s) => s.setMobileNav)
  const selected = useStore((s) => s.selected)
  const stories = useStore((s) => s.stories)
  const viewport = useStore((s) => s.viewport)
  const setViewport = useStore((s) => s.setViewport)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)

  const story = selected ? stories.find((s) => s.id === selected.storyId) : undefined
  const crumb = story && selected ? [...story.title.split('/'), selected.variant] : []
  const vp = viewportByKey(viewport)
  const widthLabel = viewport === 'responsive' ? 'Responsive' : `${vp.width}px`
  // With no pinned theme the OS decides, so the toggle flips whatever is showing.
  const dark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches

  return (
    <div
      role="toolbar"
      aria-label="Canvas toolbar"
      className="flex h-[60px] flex-none items-center gap-3 border-b border-line bg-panel px-3 sm:gap-6 sm:px-6"
    >
      <button
        type="button"
        aria-label="Open navigation"
        title="Open navigation"
        onClick={() => setMobileNav(true)}
        className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-inset text-muted transition-colors hover:bg-chip hover:text-text lg:hidden"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div role="tablist" aria-label="View" className="flex flex-none gap-0.5 rounded-md bg-inset p-[3px]">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'canvas'}
          onClick={() => setTab('canvas')}
          className={`rounded-sm px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
            tab === 'canvas' ? 'bg-accent text-accent-ink' : 'text-muted hover:text-text'
          }`}
        >
          Canvas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'docs'}
          onClick={() => setTab('docs')}
          className={`rounded-sm px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
            tab === 'docs' ? 'bg-accent text-accent-ink' : 'text-muted hover:text-text'
          }`}
        >
          Docs
        </button>
      </div>

      <div className="min-w-0 flex-1 truncate text-[13px] text-muted">
        {crumb.map((part, i) => (
          <span key={`${i}-${part}`}>
            {i > 0 && <span className="px-2 text-dim">/</span>}
            <span className={i === crumb.length - 1 ? 'font-medium text-text' : undefined}>{part}</span>
          </span>
        ))}
      </div>

      <div className="ml-auto flex flex-none items-center gap-3">
        <div className="hidden items-center gap-0.5 rounded-md bg-inset p-[3px] sm:flex">
          {VIEWPORTS.map((v) => (
            <button
              key={v.key}
              type="button"
              title={v.title}
              onClick={() => setViewport(v.key)}
              className={`min-w-[34px] rounded-sm px-3 py-1.5 text-[13px] font-medium transition-colors ${
                viewport === v.key ? 'bg-accent text-accent-ink' : 'text-muted hover:text-text'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <span className="hidden min-w-[78px] text-right text-[12px] text-dim sm:inline">{widthLabel}</span>
        <button
          type="button"
          aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={() => setTheme(dark ? 'light' : 'dark')}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-inset text-muted transition-colors hover:bg-chip hover:text-text"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {dark ? (
              <>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </>
            ) : (
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            )}
          </svg>
        </button>
        <button
          type="button"
          aria-label="Search stories"
          title="Search stories"
          onClick={() => setPaletteOpen(true)}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-inset text-muted transition-colors hover:bg-chip hover:text-text"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
