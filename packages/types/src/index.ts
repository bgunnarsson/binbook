export const ARG_TYPES = ['text', 'select', 'boolean', 'number', 'color'] as const
export type ArgType = (typeof ARG_TYPES)[number]

export function isArgType(value: unknown): value is ArgType {
  return typeof value === 'string' && (ARG_TYPES as readonly string[]).includes(value)
}

export interface ArgSpec {
  type: ArgType
  default: unknown
  options?: string[] // for "select"
  label?: string
}

export type ArgSchema = Record<string, ArgSpec>

export interface Variant {
  name: string
  args: Record<string, unknown>
  /**
   * Inline CSS for the preview wrapper around the component in the canvas,
   * normalized to a declaration string (e.g. `"width: 400px"`). Overrides the
   * story-level `wrapper` when present. Set via the `wrapper` field on a story
   * variant (string or object form); see `Story.wrapper`.
   */
  wrapper?: string
}

/**
 * A reference to a published content node in the consumer's live Umbraco site,
 * used by `umbraco`-mode stories so the endpoint renders the partial with a real
 * `IPublishedContent` model. Exactly one of the fields should be set; the
 * endpoint tries `key`, then `id`, then `route`.
 */
export interface UmbracoContentRef {
  /** GUID key of the content node. */
  key?: string
  /** Integer node id. */
  id?: number
  /** Route/path, e.g. "/en/home". */
  route?: string
}

/**
 * Selects a single Block List block (or the whole list) out of a content node's
 * block-list property, for `umbraco`-mode stories that render block views. The
 * endpoint resolves the node, reads the `property`, and renders the block whose
 * content-type alias matches `type`; when `type` is omitted it renders every
 * block in order (the "full page" view).
 */
export interface UmbracoBlockRef {
  /** Alias of the block-list property on the content node, e.g. "blocks". */
  property: string
  /**
   * Content-type alias of the target block, e.g. "heroBlock". Chosen over index
   * so stories survive the showcase list being reordered. Omit to render the
   * entire block list.
   */
  type?: string
  /**
   * Template for the block view path, resolved per block from its content-type
   * alias. Supports `{alias}` (verbatim, e.g. "heroBlock") and `{Alias}`
   * (PascalCase, "HeroBlock"). Lets each project point at its own block-view
   * folder — the convention varies. Defaults to Umbraco's built-in
   * `~/Views/Partials/blocklist/Components/{alias}.cshtml`.
   */
  viewPath?: string
}

/**
 * Declares a Block List "showcase" node whose blocks binbook expands into one
 * story per block type (plus a full-list story) at discovery time. Set on a
 * manifest `.binbook.json` via `umbraco.blockList`; the adapter's `expand` hook
 * asks the endpoint to enumerate the node's blocks and synthesizes the stories.
 */
export interface UmbracoBlockListRef {
  /** The content node holding the block list (key | id | route). */
  content: UmbracoContentRef
  /** Alias of the block-list property to enumerate, e.g. "blocks". */
  property: string
  /**
   * Template for each block's view path (see {@link UmbracoBlockRef.viewPath}).
   * Applied to every story expanded from this manifest. Defaults to Umbraco's
   * `~/Views/Partials/blocklist/Components/{alias}.cshtml`.
   */
  viewPath?: string
}

/** Umbraco-adapter-specific story options (ignored by other adapters). */
export interface UmbracoStoryOptions {
  /**
   * Where the partial renders (default `offline`):
   * - `offline`: render the `component` .cshtml via the embedded ASP.NET Core
   *   Razor engine — tag helpers work, no Umbraco content context.
   * - `live`: POST to the consumer site's dev render endpoint so the partial
   *   renders inside the real running Umbraco process against real content.
   */
  mode: 'live' | 'offline'
  /** For `live` mode: the content node the partial renders against. */
  content?: UmbracoContentRef
  /**
   * For `live` mode: render a single Block List block (or the whole list) out of
   * `content`'s block-list property, rather than rendering `component` against
   * the node directly. Set on the per-block stories produced by expanding a
   * `blockList` manifest.
   */
  block?: UmbracoBlockRef
  /**
   * Marks this story as a Block List showcase manifest: the adapter expands it
   * at discovery into one story per block type plus a full-list story. Mutually
   * exclusive with `block` (which the expanded stories carry instead).
   */
  blockList?: UmbracoBlockListRef
}

/** One parsed .binbook.json component. */
export interface Story {
  id: string
  title: string // e.g. "Components/Button"
  description?: string
  component: string // adapter-interpreted render target
  args: ArgSchema
  variants: Variant[]
  file: string // absolute path to the source .binbook.json
  /** Umbraco-adapter options; present only on stories that set an `umbraco` block. */
  umbraco?: UmbracoStoryOptions
  /**
   * Inline CSS for the preview wrapper the canvas puts around the component,
   * normalized to a declaration string (e.g. `"width: 400px"`). Lets a story
   * constrain how the component is framed in isolation — width, padding,
   * max-width, etc. Set via the `wrapper` field in the `.binbook.json`, as a CSS
   * string (`"width: 400px"`) or an object (`{ "maxWidth": "400px" }`); a
   * per-variant `wrapper` overrides this.
   */
  wrapper?: string
  /**
   * Wrapper modules applied around the component before render, for stories that
   * need providers/context (router, theme, store, i18n, …). Each is a module ref
   * (`<file>` or `<file>#<export>`) resolved relative to the story file. Ordered
   * outermost → innermost; the adapter composes them and any global decorators.
   */
  decorators?: string[]
}

export interface RenderContext {
  story: Story
  component: string
  args: Record<string, unknown>
  root: string
  /**
   * Decorator module refs to wrap the component in, resolved by core to absolute
   * paths (each optionally `<abs>#<export>`) and ordered outermost → innermost
   * (global config decorators first, then the story's). Adapters that support
   * decorators compose them around the component for both SSR and hydration.
   */
  decorators?: string[]
}

export interface RenderResult {
  html: string
  assets?: string[]
  /**
   * Base URL for resolving the markup's relative/root-relative asset references
   * (`<img src="/media/…">`, sprite `<use href="/…">`, etc.). Injected as a
   * `<base href>` into the sandboxed canvas document, whose opaque origin
   * otherwise has nothing to resolve those URLs against. Adapters that render
   * against a live site (e.g. the Umbraco adapter's `umbraco` mode) set this to that site's
   * origin so its assets load. Note: cross-origin SVG sprite `<use>` is still
   * blocked by the same-origin policy even with a base — that's a browser rule,
   * not a binbook limitation.
   */
  baseHref?: string
  /**
   * Inline client JavaScript injected into the (sandboxed) canvas iframe after
   * the story markup — used to hydrate/mount interactive components. It runs as
   * a classic `<script>` in an opaque-origin document, so an adapter must bundle
   * everything it needs (framework runtime + component + the hydrate call) into
   * one self-contained IIFE. Per-render arguments are exposed to it on
   * `window.__BINBOOK_ARGS__`, keeping the bundle itself arg-independent.
   */
  clientScript?: string
}

export interface DocsMeta {
  source?: string
}

export type Dispose = () => void

export interface Adapter {
  name: string
  storyGlob: string
  render(ctx: RenderContext): Promise<RenderResult>
  watch?(story: Story, onChange: () => void): Dispose
  docs?(story: Story): Promise<DocsMeta>
  /**
   * Optionally replace a discovered story with a computed set of stories. Called
   * once per story after discovery; returning a list substitutes those stories
   * for the original (an empty list drops it). Used by the Umbraco adapter to
   * expand a Block List `blockList` manifest into one story per block type plus a
   * full-list story, by querying the live site. Stories without a `blockList`
   * (or adapters without this hook) pass through unchanged. Failures should be
   * non-fatal so a single unreachable endpoint can't take down discovery.
   */
  expand?(story: Story): Promise<Story[]>
}

export interface BinbookConfig {
  stories: string[]
  adapters: Adapter[]
  port?: number
  staticDirs?: string[]
  /**
   * Decorator modules wrapped around every story (outermost), for app-wide
   * providers (theme, i18n, store). Module refs (`<file>` or `<file>#<export>`)
   * resolved relative to the project root. Per-story `decorators` nest inside.
   */
  decorators?: string[]
  /** Canvas backdrop for every story (any CSS color, or "transparent"). */
  background?: string
  /**
   * Project stylesheets injected into the (isolated) canvas iframe so stories
   * render with the real app's CSS. Paths are relative to the project root.
   */
  styles?: string[]
  /**
   * Project client scripts injected into the (isolated) canvas iframe so stories
   * run the real app's JS — progressive enhancement like carousels/sliders that
   * hydrate server-rendered markup (e.g. Umbraco `live`-mode blocks). Each path
   * (relative to the project root) is a built ESM entry; binbook serves its whole
   * directory so the entry's relative chunk imports resolve, and injects it as a
   * `<script type="module">` after the markup. Point these at your build output
   * (the same files your site ships), not a dev server.
   */
  scripts?: string[]
}

/** Viewer-facing canvas settings, resolved from BinbookConfig by core. */
export interface CanvasConfig {
  background: string
  /** Absolute-from-origin URLs the viewer injects as <link> into the canvas. */
  styles: string[]
  /** Absolute-from-origin URLs the viewer injects as <script type="module"> into the canvas. */
  scripts: string[]
}

export interface TreeNode {
  name: string
  path: string // full slash path
  children: TreeNode[]
  leaf?: { storyId: string; variant: string }
}
