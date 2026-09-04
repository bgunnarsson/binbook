import { readFile } from 'node:fs/promises'
import fg from 'fast-glob'
import type { BinbookConfig, Story } from '@bgunnarsson/binbook-types'
import { parseStoryFile } from './parse-story'

export async function discoverStories(config: Pick<BinbookConfig, 'stories'>, cwd?: string): Promise<Story[]> {
  const files = await fg(config.stories, { absolute: true, ...(cwd ? { cwd } : {}) })
  const stories: Story[] = []
  for (const file of files.sort()) {
    try {
      const json = JSON.parse(await readFile(file, 'utf8'))
      stories.push(parseStoryFile(json, file))
    } catch (err) {
      console.warn(`[binbook] skipping invalid story ${file}: ${(err as Error).message}`)
    }
  }
  return stories
}
