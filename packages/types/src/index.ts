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
  /**
   * Inline CSS for the preview wrapper around the component in the canvas,
   * normalized to a declaration string (e.g. `"width: 400px"`). Overrides the
   * story-level `wrapper` when present. Set via the `wrapper` field on a story
   * variant (string or object form); see `Story.wrapper`.
   */
  wrapper?: string;
}

/**
 * A reference to a published content node in the consumer's live Umbraco site,
 * used by Razor `umbraco`-mode stories so the endpoint renders the partial with
 * a real `IPublishedContent` model. Exactly one of the fields should be set;
 * the endpoint tries `key`, then `id`, then `route`.
 */
export interface RazorContentRef {
  /** GUID key of the content node. */
  key?: string;
  /** Integer node id. */
  id?: number;
  /** Route/path, e.g. "/en/home". */
  route?: string;
}

/** Razor-adapter-specific story options (ignored by other adapters). */
export interface RazorStoryOptions {
  /**
   * `mvc` (default): render the `component` .cshtml offline via the embedded
   * ASP.NET Core Razor engine — tag helpers work, no Umbraco content context.
   * `umbraco`: POST to the consumer site's dev render endpoint so the partial
   * renders inside the real Umbraco runtime against a live content node.
   */
  mode: "mvc" | "umbraco";
  /** For `umbraco` mode: the content node the partial renders against. */
  content?: RazorContentRef;
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
  /** Razor-adapter options; present only on Razor stories that set a `razor` block. */
  razor?: RazorStoryOptions;
  /**
   * Inline CSS for the preview wrapper the canvas puts around the component,
   * normalized to a declaration string (e.g. `"width: 400px"`). Lets a story
   * constrain how the component is framed in isolation — width, padding,
   * max-width, etc. Set via the `wrapper` field in the `.binbook.json`, as a CSS
   * string (`"width: 400px"`) or an object (`{ "maxWidth": "400px" }`); a
   * per-variant `wrapper` overrides this.
   */
  wrapper?: string;
  /**
   * Wrapper modules applied around the component before render, for stories that
   * need providers/context (router, theme, store, i18n, …). Each is a module ref
   * (`<file>` or `<file>#<export>`) resolved relative to the story file. Ordered
   * outermost → innermost; the adapter composes them and any global decorators.
   */
  decorators?: string[];
}

export interface RenderContext {
  story: Story;
  component: string;
  args: Record<string, unknown>;
  root: string;
  /**
   * Decorator module refs to wrap the component in, resolved by core to absolute
   * paths (each optionally `<abs>#<export>`) and ordered outermost → innermost
   * (global config decorators first, then the story's). Adapters that support
   * decorators compose them around the component for both SSR and hydration.
   */
  decorators?: string[];
}

export interface RenderResult {
  html: string;
  assets?: string[];
  /**
   * Base URL for resolving the markup's relative/root-relative asset references
   * (`<img src="/media/…">`, sprite `<use href="/…">`, etc.). Injected as a
   * `<base href>` into the sandboxed canvas document, whose opaque origin
   * otherwise has nothing to resolve those URLs against. Adapters that render
   * against a live site (e.g. Razor's `umbraco` mode) set this to that site's
   * origin so its assets load. Note: cross-origin SVG sprite `<use>` is still
   * blocked by the same-origin policy even with a base — that's a browser rule,
   * not a binbook limitation.
   */
  baseHref?: string;
  /**
   * Inline client JavaScript injected into the (sandboxed) canvas iframe after
   * the story markup — used to hydrate/mount interactive components. It runs as
   * a classic `<script>` in an opaque-origin document, so an adapter must bundle
   * everything it needs (framework runtime + component + the hydrate call) into
   * one self-contained IIFE. Per-render arguments are exposed to it on
   * `window.__BINBOOK_ARGS__`, keeping the bundle itself arg-independent.
   */
  clientScript?: string;
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
  /**
   * Decorator modules wrapped around every story (outermost), for app-wide
   * providers (theme, i18n, store). Module refs (`<file>` or `<file>#<export>`)
   * resolved relative to the project root. Per-story `decorators` nest inside.
   */
  decorators?: string[];
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
