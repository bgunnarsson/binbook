import { useEffect } from "react";
import { useStore } from "./store";
import { fetchStories } from "./api";
import { useCanvasMessages } from "./canvas-messages";
import { Sidebar } from "./components/Sidebar";
import { Canvas } from "./components/Canvas";
import { BottomPanel } from "./components/BottomPanel";
import { Toolbar } from "./components/Toolbar";
import { DocsView } from "./components/DocsView";
import { CommandPalette } from "./components/CommandPalette";

export function App() {
  useCanvasMessages();
  const setCatalog = useStore((s) => s.setCatalog);
  const tab = useStore((s) => s.tab);
  useEffect(() => {
    fetchStories()
      .then((data) => setCatalog(data.tree, data.stories))
      .catch(() => {});
  }, [setCatalog]);

  return (
    <div className="flex h-screen bg-bg text-text">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <Toolbar />
        {tab === "docs" ? (
          <DocsView />
        ) : (
          <>
            <Canvas />
            <BottomPanel />
          </>
        )}
      </main>
      <CommandPalette />
    </div>
  );
}
