import { useState } from "react";
import { useStore } from "../store";
import { VIEWPORTS } from "../viewports";

function ViewportMenu() {
  const viewport = useStore((s) => s.viewport);
  const setViewport = useStore((s) => s.setViewport);
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Viewport"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {viewport} ▾
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-1 border rounded shadow bg-white z-10" style={{ borderColor: "var(--bb-border)" }}>
          {VIEWPORTS.map((v) => (
            <button
              key={v.key}
              type="button"
              role="menuitem"
              className="block w-full text-left px-3 py-1"
              onClick={() => {
                setViewport(v.key);
                setOpen(false);
              }}
            >
              {v.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Toolbar() {
  const tab = useStore((s) => s.tab);
  const setTab = useStore((s) => s.setTab);
  const setPaletteOpen = useStore((s) => s.setPaletteOpen);

  return (
    <div
      role="toolbar"
      aria-label="Canvas toolbar"
      className="flex items-center gap-2 p-2 border-b"
      style={{ borderColor: "var(--bb-border)" }}
    >
      <div role="tablist" aria-label="View" className="flex gap-1">
        <button type="button" role="tab" aria-selected={tab === "canvas"} onClick={() => setTab("canvas")}>
          Canvas
        </button>
        <button type="button" role="tab" aria-selected={tab === "docs"} onClick={() => setTab("docs")}>
          Docs
        </button>
      </div>
      <div className="flex-1" />
      <ViewportMenu />
      <button type="button" aria-label="Search stories" onClick={() => setPaletteOpen(true)}>
        ⌕
      </button>
    </div>
  );
}
