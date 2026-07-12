import { useEffect } from "react";
import { useStore } from "./store";
import { fetchStories } from "./api";
import { Sidebar } from "./components/Sidebar";
import { Canvas } from "./components/Canvas";

export function App() {
  const setCatalog = useStore((s) => s.setCatalog);
  useEffect(() => {
    fetchStories()
      .then((data) => setCatalog(data.tree, data.stories))
      .catch(() => {});
  }, [setCatalog]);

  return (
    <div className="flex h-screen text-sm" style={{ color: "var(--bb-fg)", background: "var(--bb-bg)" }}>
      <Sidebar />
      <main className="flex flex-col flex-1 min-w-0">
        <Canvas />
      </main>
    </div>
  );
}
