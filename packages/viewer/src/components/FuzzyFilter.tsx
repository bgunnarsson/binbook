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
    <input
      ref={ref}
      type="search"
      aria-label="Filter stories"
      placeholder="Filter…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1 text-sm border rounded"
    />
  );
}
