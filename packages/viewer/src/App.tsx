import { useEffect } from "react";
import { useStore } from "./store";
import { fetchStories } from "./api";
import { Sidebar } from "./components/Sidebar";
import { Canvas } from "./components/Canvas";
import { Controls } from "./components/Controls";
import { Toolbar } from "./components/Toolbar";

export function App() {
  const setCatalog = useStore((s) => s.setCatalog);
  const dock = useStore((s) => s.dock);
  useEffect(() => {
    fetchStories()
      .then((data) => setCatalog(data.tree, data.stories))
      .catch(() => {});
  }, [setCatalog]);

  return (
    <div className="flex h-screen text-sm" style={{ color: "var(--bb-fg)", background: "var(--bb-bg)" }}>
      <Sidebar />
      <main className="flex flex-1 min-w-0" style={{ flexDirection: dock === "right" ? "row" : "column" }}>
        <div className="flex flex-col flex-1 min-w-0">
          <Toolbar />
          <Canvas />
        </div>
        <Controls />
      </main>
    </div>
  );
}
