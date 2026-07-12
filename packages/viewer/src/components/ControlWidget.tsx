import type { ArgSpec } from "@bgunnarsson/binbook-types";

const INPUT_CLS =
  "bg-inset border border-line-input rounded-md text-text px-2.5 py-1.5 text-[12.5px] focus:border-accent outline-none";

export function ControlWidget({
  name,
  spec,
  value,
  onChange,
}: {
  name: string;
  spec: ArgSpec;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
}) {
  if (spec.type === "boolean") {
    const on = Boolean(value);
    return (
      <>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={name}
          onClick={() => onChange(name, !on)}
          className={`relative h-[22px] w-10 shrink-0 rounded-full border transition ${
            on ? "border-accent bg-accent/20" : "border-line-input bg-line-soft"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
              on ? "left-5 bg-accent" : "left-0.5 bg-dim"
            }`}
          />
        </button>
        <span className="text-dim text-[12px]">{on ? "true" : "false"}</span>
      </>
    );
  }

  if (spec.type === "select") {
    const options = spec.options ?? [];
    if (options.length <= 4) {
      return (
        <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-1.5">
          {options.map((o) => {
            const selected = o === value;
            return (
              <button
                key={o}
                type="button"
                onClick={() => onChange(name, o)}
                className={`rounded-md border px-3 py-1.5 text-[12px] font-semibold transition ${
                  selected
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-line-input text-muted hover:text-text"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
      );
    }
    return (
      <select
        aria-label={name}
        value={String(value ?? "")}
        onChange={(e) => onChange(name, e.target.value)}
        className={`${INPUT_CLS} cursor-pointer`}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  if (spec.type === "number") {
    const num = Number(value) || 0;
    const max = Math.max(100, num * 2 || 100);
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
        <span className="min-w-[34px] text-right text-[12px] text-accent-bright">{num}</span>
      </>
    );
  }

  if (spec.type === "color") {
    const hex = String(value ?? "#000000");
    return (
      <>
        <input
          type="color"
          aria-label={name}
          value={hex}
          onChange={(e) => onChange(name, e.target.value)}
          className="h-[30px] w-[38px] cursor-pointer rounded-md border border-line-input bg-inset"
        />
        <span className="text-[12px] text-accent-bright">{hex}</span>
      </>
    );
  }

  // text
  return (
    <input
      type="text"
      aria-label={name}
      value={String(value ?? "")}
      onChange={(e) => onChange(name, e.target.value)}
      className={`${INPUT_CLS} flex-1`}
    />
  );
}
