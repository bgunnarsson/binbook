import { useEffect, useRef } from "react";

export function FuzzyFilter({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        (el instanceof HTMLElement && el.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="relative flex items-center">
      <span aria-hidden="true" className="pointer-events-none absolute left-[11px] text-[13px] text-dim">
        /
      </span>
      <input
        ref={ref}
        type="search"
        aria-label="Filter stories"
        placeholder="search components"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-line-input bg-inset py-2 pl-6 pr-2.5 text-[12.5px] text-text outline-none placeholder:text-dim focus:border-accent"
      />
    </div>
  );
}
