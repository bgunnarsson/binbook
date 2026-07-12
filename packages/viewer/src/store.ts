import { create } from "zustand";
import type { Story, TreeNode } from "@bgunnarsson/binbook-types";

export type Dock = "bottom" | "right";
export type Tab = "canvas" | "docs";
export type BottomTab = "controls" | "actions" | "a11y" | "code";

export interface Selected {
  storyId: string;
  variant: string;
}

/** An event captured from the story iframe (Actions panel). */
export interface ActionEvent {
  id: number;
  t: number;
  name: string;
  detail: unknown;
}

export interface A11yViolation {
  id: string;
  impact: string | null;
  help: string;
  description: string;
  nodes: number;
}

export interface A11yResult {
  violations: A11yViolation[];
  passes: number;
}

export interface ChatMsg {
  role: "user" | "assistant";
  text: string;
}

interface ViewerState {
  // catalog + selection
  tree: TreeNode[];
  stories: Story[];
  selected: Selected | null;
  liveArgs: Record<string, unknown>;

  // chrome
  viewport: string; // a Viewport `key` (see viewports.ts)
  background: string; // canvas backdrop from config: any CSS color, or "transparent"
  canvasStyles: string[]; // project stylesheet URLs injected into the canvas iframe
  tab: Tab;
  bottomTab: BottomTab;
  sidebarCollapsed: boolean;
  paletteOpen: boolean;
  dock: Dock; // legacy; the Atelier bottom panel is fixed-bottom

  // bottom-panel data
  actions: ActionEvent[];
  a11y: A11yResult | null;

  // AI assistant
  chatOpen: boolean;
  chatMsgs: ChatMsg[];
  chatInput: string;
  chatBusy: boolean;

  // mutators
  setCatalog: (tree: TreeNode[], stories: Story[]) => void;
  select: (selected: Selected) => void;
  setArg: (key: string, value: unknown) => void;
  resetArgs: () => void;
  setViewport: (key: string) => void;
  setCanvasConfig: (config: { background: string; styles: string[] }) => void;
  setTab: (tab: Tab) => void;
  setBottomTab: (tab: BottomTab) => void;
  toggleSidebar: () => void;
  setPaletteOpen: (open: boolean) => void;
  setDock: (dock: Dock) => void;
  addAction: (name: string, detail: unknown) => void;
  clearActions: () => void;
  setA11y: (result: A11yResult | null) => void;
  setChatOpen: (open: boolean) => void;
  setChatInput: (value: string) => void;
  pushChat: (msg: ChatMsg) => void;
  setChatBusy: (busy: boolean) => void;
}

let actionSeq = 0;

export const useStore = create<ViewerState>((set) => ({
  tree: [],
  stories: [],
  selected: null,
  liveArgs: {},

  viewport: "responsive",
  background: "#ffffff",
  canvasStyles: [],
  tab: "canvas",
  bottomTab: "controls",
  sidebarCollapsed: false,
  paletteOpen: false,
  dock: "bottom",

  actions: [],
  a11y: null,

  chatOpen: false,
  chatMsgs: [],
  chatInput: "",
  chatBusy: false,

  setCatalog: (tree, stories) => set({ tree, stories }),
  // Selecting a story starts a fresh context: clear live edits, captured
  // actions and a11y results, and return to the Canvas tab.
  select: (selected) => set({ selected, liveArgs: {}, tab: "canvas", actions: [], a11y: null }),
  setArg: (key, value) => set((s) => ({ liveArgs: { ...s.liveArgs, [key]: value } })),
  resetArgs: () => set({ liveArgs: {} }),
  setViewport: (key) => set({ viewport: key }),
  setCanvasConfig: ({ background, styles }) => set({ background, canvasStyles: styles }),
  setTab: (tab) => set({ tab }),
  setBottomTab: (bottomTab) => set({ bottomTab }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setPaletteOpen: (open) => set({ paletteOpen: open }),
  setDock: (dock) => set({ dock }),
  addAction: (name, detail) =>
    set((s) => ({
      actions: [{ id: ++actionSeq, t: Date.now(), name, detail }, ...s.actions].slice(0, 60),
    })),
  clearActions: () => set({ actions: [] }),
  setA11y: (a11y) => set({ a11y }),
  setChatOpen: (chatOpen) => set({ chatOpen }),
  setChatInput: (chatInput) => set({ chatInput }),
  pushChat: (msg) => set((s) => ({ chatMsgs: [...s.chatMsgs, msg] })),
  setChatBusy: (chatBusy) => set({ chatBusy }),
}));
