import { useStore } from "../store";
import { VIEWPORTS, viewportByKey } from "../viewports";

export function Toolbar() {
  const tab = useStore((s) => s.tab);
  const setTab = useStore((s) => s.setTab);
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
  const setMobileNav = useStore((s) => s.setMobileNav);
  const selected = useStore((s) => s.selected);
  const stories = useStore((s) => s.stories);
  const viewport = useStore((s) => s.viewport);
  const setViewport = useStore((s) => s.setViewport);

  const story = selected ? stories.find((s) => s.id === selected.storyId) : undefined;
  const crumb = story && selected ? `${story.title} / ${selected.variant}` : "";
  const vp = viewportByKey(viewport);
  const widthLabel = viewport === "responsive" ? "Responsive" : `${vp.width}px`;

  return (
    <div
      role="toolbar"
      aria-label="Canvas toolbar"
      className="flex h-[52px] flex-none items-center gap-3 border-b border-line bg-panel px-3 sm:gap-5 sm:px-5"
    >
      <button
        type="button"
        aria-label="Open navigation"
        title="Open navigation"
        onClick={() => setMobileNav(true)}
        className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-lg border border-line-input bg-inset text-muted transition-colors hover:bg-line-input/40 hover:text-text lg:hidden"
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

      <div role="tablist" aria-label="View" className="flex h-full items-stretch gap-[18px]">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "canvas"}
          onClick={() => setTab("canvas")}
          className={`inline-flex h-full items-center border-b-2 px-0.5 text-[13px] font-semibold transition-colors ${
            tab === "canvas" ? "border-accent text-text" : "border-transparent text-muted hover:text-text"
          }`}
        >
          Canvas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "docs"}
          onClick={() => setTab("docs")}
          className={`inline-flex h-full items-center border-b-2 px-0.5 text-[13px] font-semibold transition-colors ${
            tab === "docs" ? "border-accent text-text" : "border-transparent text-muted hover:text-text"
          }`}
        >
          Docs
        </button>
      </div>

      <div className="h-[22px] w-px flex-none bg-line" />

      <div className="min-w-0 flex-1 truncate text-[12.5px] text-muted">{crumb}</div>

      <div className="ml-auto flex flex-none items-center gap-3.5">
        <div className="hidden items-center gap-0.5 rounded-lg border border-line-input bg-inset p-[3px] sm:flex">
          {VIEWPORTS.map((v) => (
            <button
              key={v.key}
              type="button"
              title={v.title}
              onClick={() => setViewport(v.key)}
              className={`min-w-[34px] rounded-md px-2.5 py-1 text-[12px] font-semibold transition-colors ${
                viewport === v.key ? "bg-accent text-accent-ink" : "text-muted hover:text-text"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <span className="hidden min-w-[78px] text-right text-[11px] text-dim sm:inline">{widthLabel}</span>
        <button
          type="button"
          aria-label="Search stories"
          title="Search stories"
          onClick={() => setPaletteOpen(true)}
          className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-lg border border-line-input bg-inset text-muted transition-colors hover:bg-line-input/40 hover:text-text"
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
  );
}
