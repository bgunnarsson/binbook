import type { IncomingHttpHeaders } from 'node:http'

// Kinds of request whose response the requesting page cannot read, or that hold nothing the
// site does not publish anyway.
const CANVAS_DESTINATIONS = new Set(['style', 'image', 'font'])

/**
 * Whether a cross-site request may pass `astro dev`'s guard against cross-site
 * subresources. The canvas is a sandboxed srcdoc iframe with an opaque origin, so
 * its requests are cross-site and carry neither `Origin` nor `Referer`: nothing in
 * them tells the canvas from any other page. What the guard keeps from other pages
 * is the dev server's transformed source, which a page reads through a module
 * script. A page cannot read a stylesheet or image it loads from another origin,
 * and fonts are files the site serves to everyone, so those pass and scripts do not.
 * `Sec-Fetch-Dest` is set by the browser, never by the page.
 */
export function canvasMayLoad(headers: IncomingHttpHeaders): boolean {
  const site = headers['sec-fetch-site']
  if (site !== 'cross-site' && site !== 'cross-origin') {
    return false
  }
  return CANVAS_DESTINATIONS.has(headers['sec-fetch-dest'] ?? '')
}
