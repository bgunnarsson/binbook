import { readFile } from 'node:fs/promises'
import { watch } from 'node:fs'
import path from 'node:path'
import type { Adapter, DocsMeta, RenderContext, RenderResult, Story } from '@bgunnarsson/binbook-types'
import { interpolate } from './interpolate'

function componentPath(story: Story, component: string): string {
  // component is relative to the story file's directory
  return path.resolve(path.dirname(story.file), component)
}

export function html(): Adapter {
  return {
    name: 'html',
    storyGlob: '**/*.binbook.json',

    async render(ctx: RenderContext): Promise<RenderResult> {
      const file = componentPath(ctx.story, ctx.component)
      const template = await readFile(file, 'utf8')
      return { html: interpolate(template, ctx.args) }
    },

    watch(story: Story, onChange: () => void) {
      const file = componentPath(story, story.component)
      const watcher = watch(file, () => onChange())
      const storyWatcher = watch(story.file, () => onChange())
      return () => {
        watcher.close()
        storyWatcher.close()
      }
    },

    async docs(story: Story): Promise<DocsMeta> {
      const file = componentPath(story, story.component)
      return { source: await readFile(file, 'utf8') }
    },
  }
}

export default html
