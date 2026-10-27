import { useEffect } from 'react'
import { useStore } from './store'
import { fetchStories, fetchCanvasConfig } from './api'
import { useCanvasMessages } from './canvas-messages'
import { useUrlSync } from './url-sync'
import { THEME_KEY, applyTheme, themeByKey } from './themes'
import { Sidebar } from './components/Sidebar'
import { Canvas } from './components/Canvas'
import { BottomPanel } from './components/BottomPanel'
import { Toolbar } from './components/Toolbar'
import { DocsView } from './components/DocsView'
import { CommandPalette } from './components/CommandPalette'
import { ChatPanel } from './components/ChatPanel'

export function App() {
  useCanvasMessages()
  useUrlSync()
  const setCatalog = useStore((s) => s.setCatalog)
  const setCanvasConfig = useStore((s) => s.setCanvasConfig)
  const tab = useStore((s) => s.tab)
  const dock = useStore((s) => s.dock)
  useEffect(() => {
    fetchStories()
      .then((data) => setCatalog(data.tree, data.stories))
      .catch(() => {})
    fetchCanvasConfig()
      .then(setCanvasConfig)
      .catch(() => {})
  }, [setCatalog, setCanvasConfig])

  // index.html stamped whatever was stored; settle on a theme that exists, then
  // follow a change made in another tab.
  useEffect(() => {
    applyTheme(useStore.getState().theme)
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY) {
        const theme = themeByKey(e.newValue)
        applyTheme(theme)
        useStore.setState({ theme })
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <div className="flex h-screen bg-bg text-text">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <Toolbar />
        {tab === 'docs' ? (
          <DocsView />
        ) : (
          // The work panel docks below the canvas (column) or beside it (row).
          <div className={`flex min-h-0 min-w-0 flex-1 ${dock === 'right' ? 'flex-row' : 'flex-col'}`}>
            <Canvas />
            <BottomPanel />
          </div>
        )}
      </main>
      <CommandPalette />
      <ChatPanel />
    </div>
  )
}
