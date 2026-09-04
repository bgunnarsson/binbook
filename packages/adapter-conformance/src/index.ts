import { describe, expect, test } from 'vitest'
import type { Adapter, Story } from '@bgunnarsson/binbook-types'

export interface ConformanceFixture {
  /** A ready-to-render story whose component exists on disk. */
  story: Story
  root: string
  /** Args to feed render(). */
  args: Record<string, unknown>
  /** A substring that MUST appear in the rendered html. */
  expectedHtmlIncludes: string
}

export function runAdapterConformance(makeAdapter: () => Adapter, fixture: ConformanceFixture): void {
  describe(`adapter conformance: ${makeAdapter().name}`, () => {
    test('declares a name and storyGlob', () => {
      const a = makeAdapter()
      expect(a.name).toBeTruthy()
      expect(a.storyGlob).toContain('*')
    })

    test('render returns an html string', async () => {
      const a = makeAdapter()
      const result = await a.render({
        story: fixture.story,
        component: fixture.story.component,
        args: fixture.args,
        root: fixture.root,
      })
      expect(typeof result.html).toBe('string')
      expect(result.html).toContain(fixture.expectedHtmlIncludes)
    })

    test('render is deterministic and args affect output', async () => {
      const a = makeAdapter()
      const base = { story: fixture.story, component: fixture.story.component, root: fixture.root }
      const first = await a.render({ ...base, args: fixture.args })
      const empty = await a.render({ ...base, args: {} })
      const again = await a.render({ ...base, args: fixture.args })
      expect(first.html).toBe(again.html) // deterministic for identical args
      expect(first.html).not.toBe(empty.html) // args change the output
    })
  })
}
