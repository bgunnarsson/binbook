/** The part of a Vite module node the walk reads. */
export interface GraphNode {
  url: string
  importedModules: Set<GraphNode>
  importers: Set<GraphNode>
}

export interface Graph {
  getModulesByFile(file: string): Set<GraphNode> | undefined
}

const CSS_RE = /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/
// `?raw`, `?url` and `?inline` imports are strings in the importing module, not stylesheets on the page.
const NOT_A_STYLESHEET_RE = /[?&](raw|url|inline)(?:&|=|$)/

/**
 * Every stylesheet the given files import, directly or through the components
 * they render, in import order. Astro collects a page's CSS from the page's
 * static imports, which a component the frame imports by path is not one of,
 * so the walk starts from the component and decorator files instead.
 */
export function collectStyles(graph: Graph, files: string[]): string[] {
  const styles = new Set<string>()
  const seen = new Set<GraphNode>()

  function visit(node: GraphNode): void {
    if (seen.has(node)) {
      return
    }
    seen.add(node)
    if (CSS_RE.test(node.url)) {
      if (!NOT_A_STYLESHEET_RE.test(node.url)) {
        styles.add(node.url)
      }
      return
    }
    for (const child of node.importedModules) {
      // `importedModules` also holds files a plugin only watches; a real import lists its importer.
      if (child.importers.has(node)) {
        visit(child)
      }
    }
  }

  for (const file of files) {
    for (const node of graph.getModulesByFile(file) ?? []) {
      visit(node)
    }
  }
  return [...styles]
}
