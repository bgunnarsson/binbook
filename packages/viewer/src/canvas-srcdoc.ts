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
  assets?: string[];
  /** Inline source of axe-core; when present, an a11y scan runs in the frame. */
  axeSource?: string;
}

/** Marker the viewer matches on `message` events from the canvas iframe. */
export const CANVAS_SOURCE = "binbook-canvas";

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
`;

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
`;

function assetTag(url: string): string {
  return url.endsWith(".css")
    ? `<link rel="stylesheet" href="${url}">`
    : `<script type="module" src="${url}"></script>`;
}

export function buildSrcDoc(html: string, opts: SrcDocOptions = {}): string {
  const head = (opts.assets ?? []).map(assetTag).join("\n");
  const axe = opts.axeSource
    ? `<script>${opts.axeSource}</script><script>${AXE_RUNNER}</script>`
    : "";
  return (
    `<!doctype html><html><head><meta charset="utf-8">${head}</head>` +
    `<body>${html}<script>${BRIDGE}</script>${axe}</body></html>`
  );
}
