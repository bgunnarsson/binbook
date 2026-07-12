import type { ArgSpec } from "@bgunnarsson/binbook-types";
import { widgetFor } from "../widget-for";

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
  const kind = widgetFor(spec);
  const id = `control-${name}`;
  const label = spec.label ?? name;
  const row = "flex items-center justify-between gap-2";

  if (kind === "dropdown") {
    return (
      <label htmlFor={id} className={row}>
        <span>{label}</span>
        <select id={id} aria-label={name} value={String(value ?? "")} onChange={(e) => onChange(name, e.target.value)}>
          {(spec.options ?? []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </label>
    );
  }
  if (kind === "checkbox") {
    return (
      <label htmlFor={id} className={row}>
        <span>{label}</span>
        <input id={id} aria-label={name} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(name, e.target.checked)} />
      </label>
    );
  }
  if (kind === "stepper") {
    return (
      <label htmlFor={id} className={row}>
        <span>{label}</span>
        <input id={id} aria-label={name} type="number" value={Number(value ?? 0)} onChange={(e) => onChange(name, e.target.valueAsNumber)} />
      </label>
    );
  }
  if (kind === "swatch") {
    return (
      <label htmlFor={id} className={row}>
        <span>{label}</span>
        <input id={id} aria-label={name} type="color" value={String(value ?? "#000000")} onChange={(e) => onChange(name, e.target.value)} />
      </label>
    );
  }
  return (
    <label htmlFor={id} className={row}>
      <span>{label}</span>
      <input id={id} aria-label={name} type="text" value={String(value ?? "")} onChange={(e) => onChange(name, e.target.value)} />
    </label>
  );
}
