import { useEffect, useState } from 'react'
import type { TreeNode } from '@bgunnarsson/binbook-types'
import { useStore } from '../store'
import { FuzzyFilter } from './FuzzyFilter'
import { StoryTree } from './StoryTree'
import { fuzzyMatch } from '../fuzzy'

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  if (!query) {
    return nodes
  }
  const out: TreeNode[] = []
  for (const node of nodes) {
    if (node.leaf) {
      if (fuzzyMatch(query, node.path)) {
        out.push(node)
      }
    } else {
      const children = filterTree(node.children, query)
      if (children.length) {
        out.push({ ...node, children })
      }
    }
  }
  return out
}

/** Brand lockup shown at the top of the full sidebar / mobile drawer. */
function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-md bg-accent text-[14px] font-bold text-accent-ink">
        B
      </div>
      <div className="leading-tight">
        <div className="text-[14px] font-bold tracking-wide">Binbook</div>
        <div className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-dim">component workbench</div>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [query, setQuery] = useState('')
  const tree = useStore((s) => s.tree)
  const stories = useStore((s) => s.stories)
  const collapsed = useStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const mobileNavOpen = useStore((s) => s.mobileNavOpen)
  const setMobileNav = useStore((s) => s.setMobileNav)
  const filtered = filterTree(tree, query)

  // Escape closes the mobile drawer (mirrors the command palette).
  useEffect(() => {
    if (!mobileNavOpen) {
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileNav(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileNavOpen, setMobileNav])

  // Filter + tree + footer — shared between the desktop sidebar and the
  // mobile drawer (only one is visible at any breakpoint).
  const nav = (
    <>
      <div className="border-b border-line-soft p-3">
        <FuzzyFilter value={query} onChange={setQuery} />
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-2.5 py-3">
        {/* The first title segment becomes a non-collapsible section header
            (e.g. "Components"); everything below it is the collapsible tree. */}
        <nav aria-label="Stories" className="flex flex-col gap-4">
          {filtered.map((section) =>
            section.leaf ? (
              <StoryTree key={section.path} nodes={[section]} forceOpen={!!query} />
            ) : (
              <div key={section.path}>
                <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.16em] text-dim">{section.name}</div>
                <StoryTree nodes={section.children} forceOpen={!!query} />
              </div>
            )
          )}
        </nav>
      </div>

      <div className="flex justify-between border-t border-line-soft px-4 py-2.5 text-[11px] text-dimmer">
        <span>{stories.length} components</span>
        <span>v0.4.0</span>
      </div>
    </>
  )

  return (
    <>
      {/* ── Mobile: off-canvas drawer + backdrop (hidden from lg up) ── */}
      <div
        aria-hidden="true"
        onClick={() => setMobileNav(false)}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden ${
          mobileNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        aria-label="Stories"
        className={`fixed inset-y-0 left-0 z-50 flex w-[272px] max-w-[85vw] flex-col border-r border-line bg-panel transition-transform duration-200 lg:hidden ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-line-soft py-4 pl-4 pr-3">
          <Brand />
          <button
            type="button"
            title="Close navigation"
            aria-label="Close navigation"
            onClick={() => setMobileNav(false)}
            className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-md border border-line-input bg-panel text-[13px] text-muted transition-colors hover:border-line-hover hover:text-text"
          >
            ✕
          </button>
        </div>
        {/* Only mount the tree while the drawer is open: it keeps the story
            tree out of the DOM at desktop widths (where this aside is
            display:none) so there's a single, unambiguous copy of it. */}
        {mobileNavOpen && nav}
      </aside>

      {/* ── Desktop: in-flow sidebar (from lg up) ── */}
      {collapsed ? (
        <aside className="hidden w-11 flex-none flex-col items-center border-r border-line bg-panel pt-[15px] lg:flex">
          <button
            type="button"
            title="Toggle sidebar"
            aria-label="Expand sidebar"
            onClick={toggleSidebar}
            className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-md border border-line-input bg-panel text-[13px] text-muted transition-colors hover:border-line-hover hover:text-text"
          >
            »
          </button>
        </aside>
      ) : (
        <aside className="hidden w-[272px] flex-none flex-col border-r border-line bg-panel lg:flex">
          <div className="relative flex items-center gap-2.5 border-b border-line-soft py-4 pl-4 pr-11">
            <Brand />
            <button
              type="button"
              title="Toggle sidebar"
              aria-label="Collapse sidebar"
              onClick={toggleSidebar}
              className="absolute right-[11px] top-[15px] flex h-[26px] w-[26px] items-center justify-center rounded-md border border-line-input bg-panel text-[13px] text-muted transition-colors hover:border-line-hover hover:text-text"
            >
              «
            </button>
          </div>
          {nav}
        </aside>
      )}
    </>
  )
}
