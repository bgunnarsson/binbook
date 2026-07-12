import { useState } from "react";
import type { TreeNode } from "@bgunnarsson/binbook-types";
import { useStore } from "../store";
import { FuzzyFilter } from "./FuzzyFilter";
import { StoryTree } from "./StoryTree";
import { fuzzyMatch } from "../fuzzy";

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  if (!query) return nodes;
  const out: TreeNode[] = [];
  for (const node of nodes) {
    if (node.leaf) {
      if (fuzzyMatch(query, node.path)) out.push(node);
    } else {
      const children = filterTree(node.children, query);
      if (children.length) out.push({ ...node, children });
    }
  }
  return out;
}

export function Sidebar() {
  const [query, setQuery] = useState("");
  const tree = useStore((s) => s.tree);
  const stories = useStore((s) => s.stories);
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const filtered = filterTree(tree, query);

  if (collapsed) {
    return (
      <aside className="flex w-11 flex-none flex-col items-center border-r border-line bg-panel pt-[15px]">
        <button
          type="button"
          title="Toggle sidebar"
          aria-label="Expand sidebar"
          onClick={toggleSidebar}
          className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-md border border-line-input bg-panel text-[13px] text-muted transition-colors hover:border-line-hover hover:text-text"
        >
          »
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex w-[272px] flex-none flex-col border-r border-line bg-panel">
      <div className="relative flex items-center gap-2.5 border-b border-line-soft py-4 pl-4 pr-11">
        <div className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-md bg-accent text-[14px] font-bold text-accent-ink">
          B
        </div>
        <div className="leading-tight">
          <div className="text-[14px] font-bold tracking-wide">Binbook</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-dim">component workbench</div>
        </div>
        <button
          type="button"
          title="Toggle sidebar"
          aria-label="Collapse sidebar"
          onClick={toggleSidebar}
          className="absolute right-[11px] top-[15px] flex h-[26px] w-[26px] items-center justify-center rounded-md border border-line-input bg-panel text-[13px] text-muted transition-colors hover:border-line-hover hover:text-text"
        >
          «
        </button>
      </div>

      <div className="border-b border-line-soft p-3">
        <FuzzyFilter value={query} onChange={setQuery} />
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-2.5 py-3">
        {/* The first title segment becomes a non-collapsible section header
            (e.g. "Components"); everything below it is the collapsible tree. */}
        <nav aria-label="Stories" className="flex flex-col gap-4">
          {filtered.map((section) =>
            section.leaf ? (
              <StoryTree key={section.path} nodes={[section]} forceOpen={!!query} />
            ) : (
              <div key={section.path}>
                <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.16em] text-dim">
                  {section.name}
                </div>
                <StoryTree nodes={section.children} forceOpen={!!query} />
              </div>
            ),
          )}
        </nav>
      </div>

      <div className="flex justify-between border-t border-line-soft px-4 py-2.5 text-[11px] text-dimmer">
        <span>{stories.length} components</span>
        <span>v0.4.0</span>
      </div>
    </aside>
  );
}
