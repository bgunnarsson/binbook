import { useStore } from "../store";
import { ControlWidget } from "./ControlWidget";

export function Controls() {
  const selected = useStore((s) => s.selected);
  const stories = useStore((s) => s.stories);
  const liveArgs = useStore((s) => s.liveArgs);
  const setArg = useStore((s) => s.setArg);
  const resetArgs = useStore((s) => s.resetArgs);
  const dock = useStore((s) => s.dock);
  const setDock = useStore((s) => s.setDock);

  const story = selected ? stories.find((s) => s.id === selected.storyId) : undefined;
  const entries = Object.entries(story?.args ?? {});
  const variantArgs = story?.variants.find((v) => v.name === selected?.variant)?.args ?? {};

  const shell =
    dock === "right"
      ? "w-80 shrink-0 border-l overflow-auto"
      : "h-56 shrink-0 border-t overflow-auto";

  return (
    <section aria-label="Controls" className={shell} style={{ borderColor: "var(--bb-border)" }}>
      <div className="flex items-center justify-between p-2 border-b" style={{ borderColor: "var(--bb-border)" }}>
        <span className="font-medium">Controls</span>
        <div className="flex gap-2">
          <button type="button" onClick={resetArgs}>Reset</button>
          <button type="button" aria-label="Toggle dock position" onClick={() => setDock(dock === "right" ? "bottom" : "right")}>
            Dock: {dock}
          </button>
        </div>
      </div>
      <div className="p-2 grid gap-2">
        {entries.length === 0 && (
          <p className="text-xs" style={{ color: "var(--bb-muted)" }}>No controls</p>
        )}
        {entries.map(([name, spec]) => (
          <ControlWidget
            key={name}
            name={name}
            spec={spec}
            value={name in liveArgs ? liveArgs[name] : name in variantArgs ? variantArgs[name] : spec.default}
            onChange={setArg}
          />
        ))}
      </div>
    </section>
  );
}
