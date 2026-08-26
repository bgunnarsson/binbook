import { useEffect } from "react";
import { useStore } from "./store";
import { fetchStories, fetchCanvasConfig } from "./api";
import { useCanvasMessages } from "./canvas-messages";
import { useUrlSync } from "./url-sync";
import { Sidebar } from "./components/Sidebar";
import { Canvas } from "./components/Canvas";
import { BottomPanel } from "./components/BottomPanel";
import { Toolbar } from "./components/Toolbar";
import { DocsView } from "./components/DocsView";
import { CommandPalette } from "./components/CommandPalette";
import { ChatPanel } from "./components/ChatPanel";

export function App() {
  useCanvasMessages();
  useUrlSync();
  const setCatalog = useStore((s) => s.setCatalog);
  const setCanvasConfig = useStore((s) => s.setCanvasConfig);
  const tab = useStore((s) => s.tab);
  const dock = useStore((s) => s.dock);
  useEffect(() => {
    fetchStories()
      .then((data) => setCatalog(data.tree, data.stories))
      .catch(() => {});
    fetchCanvasConfig()
      .then(setCanvasConfig)
      .catch(() => {});
  }, [setCatalog, setCanvasConfig]);

  return (
    <div className="flex h-screen bg-bg text-text">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <Toolbar />
        {tab === "docs" ? (
          <DocsView />
        ) : (
          // The work panel docks below the canvas (column) or beside it (row).
          <div className={`flex min-h-0 min-w-0 flex-1 ${dock === "right" ? "flex-row" : "flex-col"}`}>
            <Canvas />
            <BottomPanel />
          </div>
        )}
      </main>
      <CommandPalette />
      <ChatPanel />
    </div>
  );
}
