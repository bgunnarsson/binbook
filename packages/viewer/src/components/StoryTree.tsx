import { useState } from "react";
import type { TreeNode } from "@bgunnarsson/binbook-types";
import { useStore } from "../store";

function Node({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = useState(true);
  const select = useStore((s) => s.select);
  const selected = useStore((s) => s.selected);

  if (node.leaf) {
    const leaf = node.leaf;
    const isActive = selected?.storyId === leaf.storyId && selected?.variant === leaf.variant;
    return (
      <button
        type="button"
        onClick={() => select(leaf)}
        aria-current={isActive ? "true" : undefined}
        className="block w-full text-left px-2 py-1 text-sm"
        style={{ paddingLeft: depth * 12 + 8 }}
      >
        {node.name}
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="block w-full text-left px-2 py-1 text-sm font-medium"
        style={{ paddingLeft: depth * 12 + 8 }}
      >
        {open ? "▾" : "▸"} {node.name}
      </button>
      {open && node.children.map((c) => <Node key={c.path} node={c} depth={depth + 1} />)}
    </div>
  );
}

export function StoryTree({ nodes }: { nodes: TreeNode[] }) {
  return (
    <div>
      {nodes.map((n) => (
        <Node key={n.path} node={n} depth={0} />
      ))}
    </div>
  );
}
