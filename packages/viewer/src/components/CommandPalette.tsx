import { useEffect, useMemo, useState } from "react";
import { useStore } from "../store";
import { fuzzyMatch } from "../fuzzy";
import type { TreeNode } from "@bgunnarsson/binbook-types";

function leaves(nodes: TreeNode[]): { path: string; storyId: string; variant: string }[] {
  const out: { path: string; storyId: string; variant: string }[] = [];
  const walk = (ns: TreeNode[]) => {
    for (const n of ns) {
      if (n.leaf) { out.push({ path: n.path, storyId: n.leaf.storyId, variant: n.leaf.variant }); }
      else { walk(n.children); }
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

  if (!open) { return null; }

  const choose = (l: { storyId: string; variant: string }) => {
    select({ storyId: l.storyId, variant: l.variant });
    setOpen(false);
    setQuery("");
  };

  return (
    // The backdrop closes on a click outside the panel, which the target check
    // decides — so the panel below needs no handler of its own and does not
    // become an interactive element just to block one.
    // biome-ignore lint/a11y/noStaticElementInteractions: click-to-dismiss only, Escape is the keyboard route
    <div
      className="fixed inset-0 z-50 grid place-items-start justify-center bg-black/50 px-4 pt-24"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) { setOpen(false); }
      }}
    >
      <div className="w-[32rem] max-w-full overflow-hidden rounded-xl border border-line bg-panel shadow-2xl">
        <input
          // The palette exists to be typed into and has just been opened on
          // purpose. The rule is about focus moving on page load.
          // biome-ignore lint/a11y/noAutofocus: focus follows a palette the user opened
          autoFocus
          aria-label="Command palette"
          placeholder="Jump to story…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) { choose(results[0]); }
          }}
          className="w-full border-b border-line-soft bg-inset px-3.5 py-2.5 text-text outline-none placeholder:text-dim"
        />
        <ul className="max-h-72 overflow-auto">
          {results.length === 0 && (
            <li className="px-3.5 py-2 text-[13px] text-dim">No matching stories.</li>
          )}
          {results.map((l, i) => (
            <li key={l.path}>
              <button
                type="button"
                onClick={() => choose(l)}
                className={`block w-full text-left px-3.5 py-2 text-[13px] ${
                  i === 0
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:bg-row-hover hover:text-text"
                }`}
              >
                {l.path}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
