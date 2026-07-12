import { create } from "zustand";
import type { Story, TreeNode } from "@bgunnarsson/binbook-types";

export type Dock = "bottom" | "right";
export type Tab = "canvas" | "docs";

export interface Selected {
  storyId: string;
  variant: string;
}

interface ViewerState {
  tree: TreeNode[];
  stories: Story[];
  selected: Selected | null;
  liveArgs: Record<string, unknown>;
  dock: Dock;
  viewport: string;
  tab: Tab;
  paletteOpen: boolean;
  setCatalog: (tree: TreeNode[], stories: Story[]) => void;
  select: (selected: Selected) => void;
  setArg: (key: string, value: unknown) => void;
  resetArgs: () => void;
  setDock: (dock: Dock) => void;
  setViewport: (name: string) => void;
  setTab: (tab: Tab) => void;
  setPaletteOpen: (open: boolean) => void;
}

const DOCK_KEY = "binbook:dock";

function loadDock(): Dock {
  if (typeof localStorage === "undefined") return "bottom";
  return localStorage.getItem(DOCK_KEY) === "right" ? "right" : "bottom";
}

export const useStore = create<ViewerState>((set) => ({
  tree: [],
  stories: [],
  selected: null,
  liveArgs: {},
  dock: loadDock(),
  viewport: "Full",
  tab: "canvas",
  paletteOpen: false,
  setCatalog: (tree, stories) => set({ tree, stories }),
  select: (selected) => set({ selected, liveArgs: {}, tab: "canvas" }),
  setArg: (key, value) => set((s) => ({ liveArgs: { ...s.liveArgs, [key]: value } })),
  resetArgs: () => set({ liveArgs: {} }),
  setDock: (dock) => {
    if (typeof localStorage !== "undefined") localStorage.setItem(DOCK_KEY, dock);
    set({ dock });
  },
  setViewport: (name) => set({ viewport: name }),
  setTab: (tab) => set({ tab }),
  setPaletteOpen: (open) => set({ paletteOpen: open }),
}));
