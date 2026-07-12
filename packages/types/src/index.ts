export const ARG_TYPES = ["text", "select", "boolean", "number", "color"] as const;
export type ArgType = (typeof ARG_TYPES)[number];

export function isArgType(value: unknown): value is ArgType {
  return typeof value === "string" && (ARG_TYPES as readonly string[]).includes(value);
}

export interface ArgSpec {
  type: ArgType;
  default: unknown;
  options?: string[]; // for "select"
  label?: string;
}

export type ArgSchema = Record<string, ArgSpec>;

export interface Variant {
  name: string;
  args: Record<string, unknown>;
}

/** One parsed .binbook.json component. */
export interface Story {
  id: string;
  title: string;              // e.g. "Components/Button"
  description?: string;
  component: string;          // adapter-interpreted render target
  args: ArgSchema;
  variants: Variant[];
  file: string;               // absolute path to the source .binbook.json
}

export interface RenderContext {
  story: Story;
  component: string;
  args: Record<string, unknown>;
  root: string;
}

export interface RenderResult {
  html: string;
  assets?: string[];
}

export interface DocsMeta {
  source?: string;
}

export type Dispose = () => void;

export interface Adapter {
  name: string;
  storyGlob: string;
  render(ctx: RenderContext): Promise<RenderResult>;
  watch?(story: Story, onChange: () => void): Dispose;
  docs?(story: Story): Promise<DocsMeta>;
}

export interface BinbookConfig {
  stories: string[];
  adapters: Adapter[];
  port?: number;
  staticDirs?: string[];
  /** Canvas backdrop for every story (any CSS color, or "transparent"). */
  background?: string;
  /**
   * Project stylesheets injected into the (isolated) canvas iframe so stories
   * render with the real app's CSS. Paths are relative to the project root.
   */
  styles?: string[];
}

/** Viewer-facing canvas settings, resolved from BinbookConfig by core. */
export interface CanvasConfig {
  background: string;
  /** Absolute-from-origin URLs the viewer injects as <link> into the canvas. */
  styles: string[];
}

export interface TreeNode {
  name: string;
  path: string;               // full slash path
  children: TreeNode[];
  leaf?: { storyId: string; variant: string };
}
