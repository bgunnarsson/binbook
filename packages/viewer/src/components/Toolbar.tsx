import { useStore } from "../store";
import { VIEWPORTS, viewportByKey } from "../viewports";

export function Toolbar() {
  const tab = useStore((s) => s.tab);
  const setTab = useStore((s) => s.setTab);
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);
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
      className="flex h-[52px] flex-none items-center gap-5 border-b border-line bg-panel px-5"
    >
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
        <div className="flex items-center gap-0.5 rounded-lg border border-line-input bg-inset p-[3px]">
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
        <span className="min-w-[78px] text-right text-[11px] text-dim">{widthLabel}</span>
        <button
          type="button"
          aria-label="Search stories"
          onClick={() => setPaletteOpen(true)}
          className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-md text-muted transition-colors hover:text-text"
        >
          ⌕
        </button>
      </div>
    </div>
  );
}
