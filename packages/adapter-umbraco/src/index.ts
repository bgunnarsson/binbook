import { readFile } from 'node:fs/promises'
import { watch } from 'node:fs'
import path from 'node:path'
import type {
  Adapter,
  DocsMeta,
  UmbracoContentRef,
  RenderContext,
  RenderResult,
  Story,
} from '@bgunnarsson/binbook-types'
import { sharedHost } from './host-client'
import { listUmbracoBlocks, renderUmbraco, umbracoSource } from './umbraco-client'
import { inlineSprites } from './sprite-inline'

/** Slug for a story id — mirrors core's `slugify` so ids match its convention. */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Umbraco's built-in Block List view convention, used when a story sets no
 * `viewPath` of its own. */
const DEFAULT_BLOCK_VIEW = '~/Views/Partials/blocklist/Components/{alias}.cshtml'

/** Resolve a block-view path template against a content-type alias. Supports
 * `{alias}` (verbatim, "heroBlock") and `{Alias}` (PascalCase, "HeroBlock") so a
 * project's view-file casing can differ from the element alias. */
function resolveBlockView(template: string, alias: string): string {
  const pascal = alias.charAt(0).toUpperCase() + alias.slice(1)
  return template.replaceAll('{alias}', alias).replaceAll('{Alias}', pascal)
}

// Fetch a sprite's raw SVG text server-side (TLS verification is governed by the
// process env, e.g. NODE_TLS_REJECT_UNAUTHORIZED=0 for a self-signed dev cert).
async function fetchSprite(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    return res.ok ? await res.text() : null
  } catch {
    return null
  }
}

// Cache fetched sprites for the dev-server lifetime — they rarely change and are
// shared across every render.
const spriteCache = new Map<string, string | null>()

export interface UmbracoOptions {
  /**
   * Base URL of the consumer site's dev render endpoint (see the sample
   * `BinbookRenderController`), e.g. `"https://localhost:44300/binbook/render"`.
   * Required for any story that sets `umbraco.mode: "live"`.
   */
  umbracoEndpoint?: string
  /**
   * Extra HTTP headers sent with every request to the render endpoint, for
   * endpoints that require the Node adapter to authenticate itself. The common
   * case is a shared dev secret — `{ "X-Binbook-Secret": process.env.BINBOOK_UMBRACO_SECRET }`
   * — matching a value in the site's dev config; but any header works (e.g.
   * `Authorization` for a bearer token). See the osar `binbook.config.ts`.
   */
  headers?: Record<string, string>
  /**
   * Absolute paths to compiled assemblies that expose Tag Helpers used by
   * `offline`-mode `.cshtml` templates (e.g. the `vv-*` TagHelper library). They
   * are added to the embedded engine's compilation references and loaded at
   * startup so `@addTagHelper` directives resolve. Ignored in `live` mode, where
   * the live site already has its own tag helpers registered.
   */
  tagHelperAssemblies?: string[]
}

function resolveTemplate(story: Story, ref: string): string {
  // In `offline` mode `component` is a .cshtml path relative to the story file's dir.
  return path.resolve(path.dirname(story.file), ref)
}

function mode(story: Story): 'live' | 'offline' {
  return story.umbraco?.mode ?? 'offline'
}

function content(story: Story): UmbracoContentRef {
  return story.umbraco?.content ?? {}
}

/** The origin (scheme + host + port) of the render endpoint, e.g.
 * "https://localhost:44317/webapi/binbook/render" → "https://localhost:44317".
 * Undefined when no endpoint is configured or the URL can't be parsed. */
function endpointOrigin(endpoint: string | undefined): string | undefined {
  if (!endpoint) {
    return undefined
  }
  try {
    return new URL(endpoint).origin
  } catch {
    return undefined
  }
}

export function umbraco(options: UmbracoOptions = {}): Adapter {
  return {
    name: 'umbraco',
    storyGlob: '**/*.binbook.json',

    async render(ctx: RenderContext): Promise<RenderResult> {
      if (mode(ctx.story) === 'live') {
        // `component` is the site-relative view path, e.g. "~/Views/Partials/Hero.cshtml".
        // A `block` selector switches the endpoint to Block List rendering: one
        // block (by content-type alias) or the whole list against `content`.
        const html = await renderUmbraco(
          options.umbracoEndpoint,
          {
            view: ctx.component,
            content: content(ctx.story),
            args: ctx.args,
            block: ctx.story.umbraco?.block,
          },
          options.headers
        )
        // The markup references the live site's assets by root-relative path
        // (`/media/…`, `/build-…/…`). Resolve them against the site's origin so
        // they load inside the sandboxed canvas (opaque origin, no base of its own).
        const origin = endpointOrigin(options.umbracoEndpoint)
        // Sprite `<use href="….svg#id">` can't load cross-origin into the opaque
        // canvas — inline the referenced symbols so icons actually render.
        const inlined = origin ? await inlineSprites(html, { origin, fetch: fetchSprite, cache: spriteCache }) : html
        return { html: inlined, baseHref: origin }
      }
      const template = resolveTemplate(ctx.story, ctx.component)
      const html = await sharedHost(options.tagHelperAssemblies).render(template, ctx.args)
      return { html }
    },

    async expand(story: Story): Promise<Story[]> {
      // Only Block List showcase manifests expand; everything else passes through.
      const list = story.umbraco?.blockList
      if (!list) {
        return [story]
      }

      const blocks = await listUmbracoBlocks(options.umbracoEndpoint, list.content, list.property, options.headers)
      const viewPath = list.viewPath ?? DEFAULT_BLOCK_VIEW
      const base = {
        args: {},
        variants: [{ name: 'Default', args: {} }],
        file: story.file,
      }
      // One story per block type, addressed by content-type alias so it survives
      // the showcase list being reordered. The view path is resolved from the
      // (project-configurable) `viewPath` template so the sidebar/docs show it,
      // and passed to the endpoint for rendering.
      const perBlock: Story[] = blocks.map((b) => ({
        ...base,
        id: slugify(`${story.title}/${b.name}`),
        title: `${story.title}/${b.name}`,
        component: resolveBlockView(viewPath, b.alias),
        umbraco: {
          mode: 'live' as const,
          content: list.content,
          block: { property: list.property, type: b.alias, viewPath },
        },
      }))
      // Plus a full-list story rendering every block in order (block with no
      // `type`); `component` is unused in whole-list mode, but the endpoint still
      // needs `viewPath` to resolve each item's view.
      const fullPage: Story = {
        ...base,
        id: slugify(`${story.title}/Full page`),
        title: `${story.title}/Full page`,
        component: '',
        umbraco: {
          mode: 'live' as const,
          content: list.content,
          block: { property: list.property, viewPath },
        },
      }
      return [...perBlock, fullPage]
    },

    watch(story: Story, onChange: () => void) {
      // In live mode the view lives in the remote site; we can only watch the
      // story file itself (its content ref / args changing forces a re-render).
      if (mode(story) === 'live') {
        const storyWatcher = watch(story.file, () => onChange())
        return () => storyWatcher.close()
      }
      const template = resolveTemplate(story, story.component)
      const templateWatcher = watch(template, () => onChange())
      const storyWatcher = watch(story.file, () => onChange())
      return () => {
        templateWatcher.close()
        storyWatcher.close()
      }
    },

    async docs(story: Story): Promise<DocsMeta> {
      if (mode(story) === 'live') {
        // Best-effort: ask the endpoint for the view source; omit it if unavailable.
        const source = await umbracoSource(options.umbracoEndpoint, story.component, options.headers).catch(
          () => undefined
        )
        return { source }
      }
      const template = resolveTemplate(story, story.component)
      return { source: await readFile(template, 'utf8') }
    },
  }
}

export default umbraco
