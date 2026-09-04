/**
 * Builds the sandboxed-iframe document for a rendered story.
 *
 * The iframe stays isolated (`sandbox="allow-scripts"`, opaque origin). To
 * power the Actions and Accessibility panels without weakening that boundary,
 * we inject small scripts INTO the frame that `postMessage` results back out to
 * the viewer — the parent never reaches into the frame's DOM.
 */
export interface SrcDocOptions {
  /** URLs of stylesheets/scripts the story needs (RenderResult.assets). */
  assets?: string[]
  /**
   * Base URL (RenderResult.baseHref) emitted as `<base href>` so the markup's
   * relative/root-relative asset URLs resolve — the canvas's opaque origin has
   * no base of its own.
   */
  baseHref?: string
  /**
   * Inline CSS (Story/Variant `wrapper`) for a `<div>` wrapped around the
   * component, so a story can frame its preview — width, padding, etc.
   */
  wrapperStyle?: string
  /**
   * Inline client JS (RenderResult.clientScript) that hydrates/mounts the story.
   * Injected after the markup and before the interaction bridge.
   */
  clientScript?: string
  /** Inline source of axe-core; when present, an a11y scan runs in the frame. */
  axeSource?: string
}

/**
 * Make configured `/__binbook_style/...` style URLs absolute. The preview
 * iframes are sandboxed (opaque origin), so relative/root-relative hrefs can't
 * resolve — only absolute cross-origin `<link>`s load into them.
 */
export function toAbsolute(urls: string[]): string[] {
  return urls.map((u) => (/^https?:/.test(u) ? u : location.origin + u))
}

/** Neutralize any literal `</script>` so inline JS can't close its own tag. */
function inlineScript(js: string): string {
  return `<script>${js.replace(/<\/script>/gi, '<\\/script>')}</script>`
}

/** Marker the viewer matches on `message` events from the canvas iframe. */
export const CANVAS_SOURCE = 'binbook-canvas'

// Captures DOM interactions and forwards them to the viewer (Actions panel).
const BRIDGE = `
(function () {
  function post(name, detail) {
    try {
      parent.postMessage(
        { source: "${CANVAS_SOURCE}", kind: "action", name: name, detail: detail, t: Date.now() },
        "*"
      );
    } catch (e) {}
  }
  function label(t) {
    if (!t || !t.tagName) return "";
    return (t.getAttribute && (t.getAttribute("aria-label") || t.getAttribute("name"))) ||
      (t.textContent || "").trim().slice(0, 48) || t.tagName.toLowerCase();
  }
  document.addEventListener("click", function (e) {
    var t = e.target;
    post("click", { tag: (t.tagName || "").toLowerCase(), label: label(t) });
  }, true);
  document.addEventListener("input", function (e) {
    post("input", { label: label(e.target), value: e.target && e.target.value });
  }, true);
  document.addEventListener("change", function (e) {
    post("change", { label: label(e.target), value: e.target && e.target.value });
  }, true);
  document.addEventListener("submit", function (e) {
    post("submit", { label: label(e.target) });
  }, true);
})();
`

// Runs axe-core (already loaded) and posts a compact violation summary out.
const AXE_RUNNER = `
(function () {
  function run() {
    if (!window.axe) return;
    window.axe
      .run(document.body)
      .then(function (r) {
        parent.postMessage(
          {
            source: "${CANVAS_SOURCE}",
            kind: "a11y",
            passes: r.passes.length,
            violations: r.violations.map(function (v) {
              return {
                id: v.id,
                impact: v.impact || null,
                help: v.help,
                description: v.description,
                nodes: v.nodes.length,
              };
            }),
          },
          "*"
        );
      })
      .catch(function () {});
  }
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run);
})();
`

function assetTag(url: string): string {
  return url.endsWith('.css') ? `<link rel="stylesheet" href="${url}">` : `<script type="module" src="${url}"></script>`
}

/** Escape a URL for safe use inside a double-quoted HTML attribute. */
function attr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

export function buildSrcDoc(html: string, opts: SrcDocOptions = {}): string {
  // `<base>` must precede any asset tag so their hrefs resolve against it.
  const base = opts.baseHref ? `<base href="${attr(opts.baseHref)}">` : ''
  const head = base + (opts.assets ?? []).map(assetTag).join('\n')
  // The client script mounts/hydrates the story, so it runs before the bridge
  // (which only attaches capture-phase listeners and is order-independent).
  const client = opts.clientScript ? inlineScript(opts.clientScript) : ''
  const axe = opts.axeSource ? `<script>${opts.axeSource}</script><script>${AXE_RUNNER}</script>` : ''
  // A story's `wrapper` frames the component (width, padding, …) in isolation.
  const framed = opts.wrapperStyle
    ? `<div class="binbook-wrapper" style="${attr(opts.wrapperStyle)}">${html}</div>`
    : html
  // Contain the preview in a `<main>` landmark. In isolation the component has
  // no page layout around it, so axe-core's `region` rule would otherwise flag
  // all of it as content outside any landmark.
  const body = `<main class="binbook-main">${framed}</main>`
  return (
    `<!doctype html><html><head><meta charset="utf-8">${head}</head>` +
    `<body>${body}${client}<script>${BRIDGE}</script>${axe}</body></html>`
  )
}
