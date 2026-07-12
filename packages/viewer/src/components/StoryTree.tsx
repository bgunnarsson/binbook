import { useState } from "react";
import type { TreeNode } from "@bgunnarsson/binbook-types";
import { useStore } from "../store";

function countLeaves(node: TreeNode): number {
  if (node.leaf) return 1;
  return node.children.reduce((sum, c) => sum + countLeaves(c), 0);
}

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
        className={`block w-full truncate rounded-r-md border-l-2 py-1.5 pr-2 text-left text-[12.5px] transition-colors ${
          isActive ? "border-accent bg-accent/10 text-accent" : "border-line text-muted hover:text-text"
        }`}
        style={{ paddingLeft: depth * 15 + 10 }}
      >
        {node.name}
      </button>
    );
  }

  const count = countLeaves(node);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-[13px] font-semibold text-muted hover:bg-row-hover"
        style={{ paddingLeft: depth * 15 + 8 }}
      >
        <span className="w-[10px] flex-none text-[10px] text-dim">{open ? "▾" : "▸"}</span>
        <span className="truncate">{node.name}</span>
        <span className="ml-auto shrink-0 text-[10px] font-normal text-dimmer">{count}</span>
      </button>
      {open && node.children.map((c) => <Node key={c.path} node={c} depth={depth + 1} />)}
    </div>
  );
}

export function StoryTree({ nodes }: { nodes: TreeNode[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      {nodes.map((n) => (
        <Node key={n.path} node={n} depth={0} />
      ))}
    </div>
  );
}
