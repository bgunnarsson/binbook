import { expect, test } from 'vitest'
import { type Graph, type GraphNode, collectStyles } from './styles'

function node(url: string): GraphNode {
  return { url, importedModules: new Set(), importers: new Set() }
}

function imports(parent: GraphNode, ...children: GraphNode[]): void {
  for (const child of children) {
    parent.importedModules.add(child)
    child.importers.add(parent)
  }
}

function graph(files: Record<string, GraphNode>): Graph {
  return { getModulesByFile: (file) => (files[file] ? new Set([files[file]]) : undefined) }
}

test('collects stylesheets depth-first, once each, from every file in order', () => {
  const frame = node('/Frame.astro')
  const global = node('/global.css')
  const card = node('/Card.astro')
  const cardStyle = node('/Card.astro?astro&type=style&index=0&lang.css')
  const tag = node('/Tag.astro')
  const tagStyle = node('/Tag.astro?astro&type=style&index=0&lang.css')
  imports(frame, global)
  imports(card, cardStyle, tag)
  imports(tag, tagStyle, global)

  expect(collectStyles(graph({ '/f': frame, '/c': card }), ['/f', '/c'])).toEqual([
    '/global.css',
    '/Card.astro?astro&type=style&index=0&lang.css',
    '/Tag.astro?astro&type=style&index=0&lang.css',
  ])
})

test('skips CSS imported as a string, watched-only files and unknown files', () => {
  const card = node('/Card.astro')
  const raw = node('/print.css?raw')
  const inline = node('/inline.css?inline')
  const watched = node('/other.css')
  imports(card, raw, inline)
  card.importedModules.add(watched)

  expect(collectStyles(graph({ '/c': card }), ['/c', '/missing'])).toEqual([])
})
