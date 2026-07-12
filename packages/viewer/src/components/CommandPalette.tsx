import { useEffect, useMemo, useState } from "react";
import { useStore } from "../store";
import { fuzzyMatch } from "../fuzzy";
import type { TreeNode } from "@bgunnarsson/binbook-types";

function leaves(nodes: TreeNode[]): { path: string; storyId: string; variant: string }[] {
  const out: { path: string; storyId: string; variant: string }[] = [];
  const walk = (ns: TreeNode[]) => {
    for (const n of ns) {
      if (n.leaf) out.push({ path: n.path, storyId: n.leaf.storyId, variant: n.leaf.variant });
      else walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

export function CommandPalette() {
  const open = useStore((s) => s.paletteOpen);
  const setOpen = useStore((s) => s.setPaletteOpen);
  const tree = useStore((s) => s.tree);
  const select = useStore((s) => s.select);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const all = useMemo(() => leaves(tree), [tree]);
  const results = query ? all.filter((l) => fuzzyMatch(query, l.path)) : all;

  if (!open) return null;

  const choose = (l: { storyId: string; variant: string }) => {
    select({ storyId: l.storyId, variant: l.variant });
    setOpen(false);
    setQuery("");
  };

  return (
    <div
      className="fixed inset-0 grid place-items-start justify-center pt-24 z-50"
      style={{ background: "rgba(0,0,0,0.3)" }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-[32rem] max-w-full rounded shadow-lg overflow-hidden bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          aria-label="Command palette"
          placeholder="Jump to story…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) choose(results[0]);
          }}
          className="w-full px-3 py-2 border-b outline-none"
          style={{ borderColor: "var(--bb-border)" }}
        />
        <ul className="max-h-72 overflow-auto">
          {results.map((l) => (
            <li key={l.path}>
              <button type="button" className="block w-full text-left px-3 py-2 text-sm" onClick={() => choose(l)}>
                {l.path}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
