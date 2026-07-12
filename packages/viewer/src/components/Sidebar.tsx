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
  const filtered = filterTree(tree, query);
  return (
    <aside className="w-64 shrink-0 border-r overflow-y-auto" style={{ borderColor: "var(--bb-border)" }}>
      <div className="p-2 border-b" style={{ borderColor: "var(--bb-border)" }}>
        <FuzzyFilter value={query} onChange={setQuery} />
      </div>
      <nav aria-label="Stories">
        <StoryTree nodes={filtered} />
      </nav>
    </aside>
  );
}
