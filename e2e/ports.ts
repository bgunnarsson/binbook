// Single source of truth for the e2e sandbox servers. playwright.config.ts
// spins one dev server up per entry (passing the port via BINBOOK_PORT), and
// each spec targets its sandbox with `baseURL(<key>)`.
export const SANDBOXES = {
  html: { port: 6006, pkg: '@bgunnarsson/html-sandbox' },
  react: { port: 6099, pkg: '@bgunnarsson/react-sandbox' },
  templates: { port: 6098, pkg: '@bgunnarsson/templates-sandbox' },
  svelte: { port: 6097, pkg: '@bgunnarsson/svelte-sandbox' },
  wc: { port: 6096, pkg: '@bgunnarsson/wc-sandbox' },
  vue: { port: 6095, pkg: '@bgunnarsson/vue-sandbox' },
  umbraco: { port: 6094, pkg: '@bgunnarsson/umbraco-sandbox' },
} as const

export type SandboxKey = keyof typeof SANDBOXES

export function baseURL(key: SandboxKey): string {
  return `http://localhost:${SANDBOXES[key].port}`
}
