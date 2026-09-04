import { describe, test, expect, vi } from 'vitest'
import { inlineSprites } from './sprite-inline'

const SPRITE = `<svg xmlns="http://www.w3.org/2000/svg">
  <symbol id="cart" viewBox="0 0 24 24"><path d="M1 1h22"/></symbol>
  <symbol id="add" viewBox="0 0 24 24"><path d="M12 5v14"/></symbol>
  <symbol id="heart" viewBox="0 0 24 24"><path d="M12 21s-9-6-9-12"/></symbol>
</svg>`

const origin = 'https://localhost:44317'
const okFetch = vi.fn(async () => SPRITE)

describe('inlineSprites', () => {
  test('inlines referenced symbols and rewrites external <use> to fragments', async () => {
    const html =
      '<button class="button"><svg viewBox="0 0 24 24"><use href="/build-hverslun/icons.svg#cart"></use></svg>Add to cart</button>'
    const out = await inlineSprites(html, { origin, fetch: okFetch })

    // The referenced symbol is inlined once, in a hidden defs <svg>.
    expect(out).toContain('<symbol id="cart"')
    // The external ref is rewritten to a same-document fragment.
    expect(out).toContain('href="#cart"')
    expect(out).not.toContain('icons.svg#cart')
    // Unrelated symbols are not dragged in.
    expect(out).not.toContain('<symbol id="heart"')
  })

  test('handles multiple ids from one sprite with a single fetch', async () => {
    const fetch = vi.fn(async () => SPRITE)
    const html =
      '<use href="/build-hverslun/icons.svg#cart"></use><use xlink:href="/build-hverslun/icons.svg#add"></use>'
    const out = await inlineSprites(html, { origin, fetch })

    expect(out).toContain('<symbol id="cart"')
    expect(out).toContain('<symbol id="add"')
    expect(out).toContain('href="#cart"')
    expect(out).toContain('xlink:href="#add"')
    expect(fetch).toHaveBeenCalledTimes(1) // deduped by URL
  })

  test('uses the cache across calls instead of re-fetching', async () => {
    const fetch = vi.fn(async () => SPRITE)
    const cache = new Map<string, string | null>()
    const html = '<use href="/build-hverslun/icons.svg#cart"></use>'

    await inlineSprites(html, { origin, fetch, cache })
    await inlineSprites(html, { origin, fetch, cache })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  test('leaves markup untouched when there are no sprite refs', async () => {
    const html = '<button>Plain</button>'
    const fetch = vi.fn(async () => SPRITE)
    expect(await inlineSprites(html, { origin, fetch })).toBe(html)
    expect(fetch).not.toHaveBeenCalled()
  })

  test("leaves refs as-is when the sprite can't be fetched", async () => {
    const html = '<use href="/build-hverslun/icons.svg#cart"></use>'
    const out = await inlineSprites(html, { origin, fetch: async () => null })
    expect(out).toBe(html) // best-effort: unchanged, no throw
  })

  test('skips a missing symbol but still inlines the ones that exist', async () => {
    const html = '<use href="/build-hverslun/icons.svg#cart"></use><use href="/build-hverslun/icons.svg#ghost"></use>'
    const out = await inlineSprites(html, { origin, fetch: async () => SPRITE })
    expect(out).toContain('href="#cart"') // inlined
    expect(out).toContain('icons.svg#ghost') // untouched — not in the sprite
  })
})
