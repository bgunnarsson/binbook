import type { Story, TreeNode } from '@bgunnarsson/binbook-types'

export function buildTree(stories: Story[]): TreeNode[] {
  const roots: TreeNode[] = []

  const findOrCreate = (siblings: TreeNode[], name: string, path: string): TreeNode => {
    let node = siblings.find((n) => n.name === name && !n.leaf)
    if (!node) {
      node = { name, path, children: [] }
      siblings.push(node)
    }
    return node
  }

  for (const story of stories) {
    const segments = story.title.split('/').map((s) => s.trim())
    let cursor = roots
    let acc = ''
    for (const seg of segments) {
      acc = acc ? `${acc}/${seg}` : seg
      const node = findOrCreate(cursor, seg, acc)
      cursor = node.children
    }
    for (const variant of story.variants) {
      cursor.push({
        name: variant.name,
        path: `${story.title}/${variant.name}`,
        children: [],
        leaf: { storyId: story.id, variant: variant.name },
      })
    }
  }
  return roots
}
