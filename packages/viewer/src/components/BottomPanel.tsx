import { useEffect, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useStore } from "../store";
import type { BottomTab } from "../store";
import { ControlWidget } from "./ControlWidget";
import { fetchDocs } from "../api";

const MIN_HEIGHT = 120;
const DEFAULT_HEIGHT = 272;
const HEIGHT_KEY = "binbook:bottomPanelHeight";

function loadHeight(): number {
  if (typeof localStorage === "undefined") return DEFAULT_HEIGHT;
  const v = Number(localStorage.getItem(HEIGHT_KEY));
  return Number.isFinite(v) && v >= MIN_HEIGHT ? v : DEFAULT_HEIGHT;
}

function maxHeight(): number {
  // Leave room for the sidebar's siblings (toolbar + a slice of canvas).
  return typeof window === "undefined" ? 640 : Math.max(MIN_HEIGHT, window.innerHeight - 160);
}

const TABS: { key: BottomTab; label: string }[] = [
  { key: "controls", label: "Controls" },
  { key: "actions", label: "Actions" },
  { key: "a11y", label: "Accessibility" },
  { key: "code", label: "Code" },
];

function TabBar() {
  const bottomTab = useStore((s) => s.bottomTab);
  const setBottomTab = useStore((s) => s.setBottomTab);
  const actions = useStore((s) => s.actions);
  const a11y = useStore((s) => s.a11y);

  const counts: Partial<Record<BottomTab, number>> = {
    actions: actions.length,
    a11y: a11y?.violations.length ?? 0,
  };

  return (
    <div role="tablist" className="flex h-[42px] flex-none items-stretch gap-4 overflow-x-auto border-b border-line-soft px-3 sm:gap-5 sm:px-5">
      {TABS.map((t) => {
        const active = bottomTab === t.key;
        const count = counts[t.key];
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setBottomTab(t.key)}
            className={`inline-flex flex-none items-center whitespace-nowrap border-b-2 text-[13px] font-semibold transition ${
              active ? "border-accent text-text" : "border-transparent text-muted hover:text-text"
            }`}
          >
            {t.label}
            {count ? ` (${count})` : ""}
          </button>
        );
      })}
    </div>
  );
}

function ControlsPanel() {
  const selected = useStore((s) => s.selected);
  const stories = useStore((s) => s.stories);
  const liveArgs = useStore((s) => s.liveArgs);
  const setArg = useStore((s) => s.setArg);
  const resetArgs = useStore((s) => s.resetArgs);

  const story = selected ? stories.find((s) => s.id === selected.storyId) : undefined;
  const entries = Object.entries(story?.args ?? {});

  if (entries.length === 0) {
    return <p className="py-6 text-center text-dim text-[12.5px]">No controls for this story.</p>;
  }

  return (
    <div>
      {entries.map(([name, spec]) => (
        <div key={name} className="flex items-start gap-4 border-b border-row-line py-2.5">
          <div className="w-[88px] shrink-0 pt-1.5 text-[12.5px] text-muted">{spec.label ?? name}</div>
          <div className="flex flex-1 items-center gap-2.5">
            <ControlWidget
              name={name}
              spec={spec}
              value={name in liveArgs ? liveArgs[name] : spec.default}
              onChange={setArg}
            />
          </div>
        </div>
      ))}
      <div className="pt-4">
        <button
          type="button"
          onClick={resetArgs}
          className="rounded-md border border-line-input px-3 py-1.5 text-[12px] font-semibold text-muted hover:border-line-hover hover:text-text"
        >
          Reset controls
        </button>
      </div>
    </div>
  );
}

function ActionsPanel() {
  const actions = useStore((s) => s.actions);
  const clearActions = useStore((s) => s.clearActions);

  if (actions.length === 0) {
    return (
      <div className="py-8 text-center text-[12.5px] text-dimmer">
        Interact with the story in the canvas to log emitted events.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1.5 flex justify-end">
        <button
          type="button"
          onClick={clearActions}
          className="rounded-md border border-line-input px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-text"
        >
          Clear
        </button>
      </div>
      {actions.map((a) => (
        <div key={a.id} className="flex items-baseline gap-3.5 border-b border-row-line py-2 text-[12px]">
          <span className="text-dimmer">{new Date(a.t).toLocaleTimeString()}</span>
          <span className="font-semibold text-accent-bright">{a.name}</span>
          <span className="truncate text-muted">{JSON.stringify(a.detail)}</span>
        </div>
      ))}
    </div>
  );
}

function A11yPanel() {
  const a11y = useStore((s) => s.a11y);

  if (!a11y) {
    return (
      <div className="py-8 text-center text-[12.5px] text-dimmer">
        Switch to the Accessibility tab after a story renders to run checks.
      </div>
    );
  }

  const count = a11y.violations.length;

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <span
          className={`rounded-md border px-3 py-1 text-[12px] font-semibold ${
            count === 0
              ? "border-success/40 bg-success/10 text-success"
              : "border-danger/40 bg-danger/10 text-danger"
          }`}
        >
          {count === 0 ? "All checks pass" : `${count} violation${count > 1 ? "s" : ""}`}
        </span>
      </div>
      {a11y.violations.map((v) => (
        <div key={v.id} className="flex items-start gap-3 border-b border-row-line py-2.5">
          <span
            className={`mt-1.5 h-[9px] w-[9px] shrink-0 rounded-full ${
              v.impact === "critical" || v.impact === "serious"
                ? "bg-danger"
                : v.impact === "moderate"
                  ? "bg-warn"
                  : "bg-dim"
            }`}
          />
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold text-text">{v.help}</div>
            <div className="mt-0.5 text-[12px] text-muted">
              {v.nodes} node{v.nodes === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CodePanel() {
  const selected = useStore((s) => s.selected);
  const [source, setSource] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!selected) {
      setSource("");
      return;
    }
    let cancelled = false;
    fetchDocs(selected.storyId)
      .then((d) => {
        if (!cancelled) setSource(d.source ?? "");
      })
      .catch(() => {
        if (!cancelled) setSource("");
      });
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const onCopy = () => {
    navigator.clipboard?.writeText(source);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-dim">
          Story source · framework-agnostic HTML
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md border border-line-input px-3 py-1 text-accent-bright hover:border-accent"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="rounded-lg border border-line-soft bg-inset p-4 text-[12.5px] leading-relaxed text-[#cfd3e4] overflow-auto">
        {source}
      </pre>
    </div>
  );
}

function ResizeHandle({ onResize }: { onResize: (deltaFromStart: number, startHeight: number) => number }) {
  const onPointerDown = (e: ReactPointerEvent) => {
    // Only the primary button starts a drag.
    if (e.button !== 0) return;
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = onResize(0, NaN); // returns the current height (see BottomPanel)

    const onMove = (ev: PointerEvent) => onResize(ev.clientY - startY, startHeight);
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.userSelect = "";
    };
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      onPointerDown={onPointerDown}
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize panel"
      title="Drag to resize"
      className="group relative h-2 flex-none cursor-ns-resize"
    >
      {/* the panel's top edge, brightening to accent on hover/drag */}
      <div className="absolute inset-x-0 top-0 h-px bg-line transition-colors group-hover:bg-accent" />
      {/* a small centered grip */}
      <div className="pointer-events-none absolute left-1/2 top-[3px] h-[3px] w-9 -translate-x-1/2 rounded-full bg-line-input transition-colors group-hover:bg-accent" />
    </div>
  );
}

export function BottomPanel() {
  const bottomTab = useStore((s) => s.bottomTab);
  const [height, setHeight] = useState(loadHeight);

  // Called by the handle: with NaN it reports the current height (drag start);
  // otherwise it applies delta (dragging up = negative delta = taller) and persists.
  const resize = (deltaFromStart: number, startHeight: number): number => {
    if (Number.isNaN(startHeight)) return height;
    const next = Math.min(maxHeight(), Math.max(MIN_HEIGHT, Math.round(startHeight - deltaFromStart)));
    setHeight(next);
    try {
      localStorage.setItem(HEIGHT_KEY, String(next));
    } catch {
      /* ignore */
    }
    return next;
  };

  return (
    <div className="flex flex-none flex-col bg-panel" style={{ height }}>
      <ResizeHandle onResize={resize} />
      <TabBar />
      <div className="flex-1 min-h-0 overflow-auto px-3 py-3 sm:px-5 sm:py-3.5">
        {bottomTab === "controls" && <ControlsPanel />}
        {bottomTab === "actions" && <ActionsPanel />}
        {bottomTab === "a11y" && <A11yPanel />}
        {bottomTab === "code" && <CodePanel />}
      </div>
    </div>
  );
}
