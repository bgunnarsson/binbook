import { useEffect, useState } from "react";
import { useStore } from "../store";
import { renderStory } from "../api";
import type { RenderResult } from "@bgunnarsson/binbook-types";

function buildSrcDoc(html: string, assets: string[] = []): string {
  const tags = assets
    .map((a) =>
      a.endsWith(".css")
        ? `<link rel="stylesheet" href="${a}">`
        : `<script type="module" src="${a}"></script>`,
    )
    .join("\n");
  return `<!doctype html><html><head><meta charset="utf-8">${tags}</head><body>${html}</body></html>`;
}

export function Canvas() {
  const selected = useStore((s) => s.selected);
  const liveArgs = useStore((s) => s.liveArgs);
  const [srcDoc, setSrcDoc] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!selected) {
      setSrcDoc("");
      return;
    }
    renderStory({ storyId: selected.storyId, variant: selected.variant, args: liveArgs })
      .then((result: RenderResult) => {
        if (!cancelled) setSrcDoc(buildSrcDoc(result.html, result.assets));
      })
      .catch(() => {
        if (!cancelled) setSrcDoc("<!doctype html><meta charset=utf-8><body>Render error</body>");
      });
    return () => {
      cancelled = true;
    };
  }, [selected, liveArgs]);

  useEffect(() => {
    if (typeof WebSocket === "undefined") return;
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/__binbook_ws`);
    ws.onmessage = (e) => {
      if (e.data !== "reload") return;
      const s = useStore.getState();
      if (!s.selected) return;
      renderStory({ storyId: s.selected.storyId, variant: s.selected.variant, args: s.liveArgs })
        .then((r) => setSrcDoc(buildSrcDoc(r.html, r.assets)))
        .catch(() => {});
    };
    return () => ws.close();
  }, []);

  return (
    <div className="flex-1 overflow-auto grid place-items-center" style={{ background: "#fafafa" }}>
      <iframe
        title="Story canvas"
        sandbox="allow-scripts"
        srcDoc={srcDoc}
        className="w-full h-full border-0 bg-white"
      />
    </div>
  );
}
