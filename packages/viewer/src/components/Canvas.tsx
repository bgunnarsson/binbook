import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { renderStory } from "../api";
import { viewportByKey } from "../viewports";
import { buildSrcDoc } from "../canvas-srcdoc";
import type { RenderResult } from "@bgunnarsson/binbook-types";

const RENDER_ERROR = buildSrcDoc('<p style="font-family:monospace;color:#9a9fb5">Render error</p>');

export function Canvas() {
  const selected = useStore((s) => s.selected);
  const liveArgs = useStore((s) => s.liveArgs);
  const viewportName = useStore((s) => s.viewport);
  const bottomTab = useStore((s) => s.bottomTab);
  const [srcDoc, setSrcDoc] = useState("");
  const [axeSource, setAxeSource] = useState<string | null>(null);
  const axeLoading = useRef(false);

  const vp = viewportByKey(viewportName);
  const frameLabel = vp.width == null ? "story iframe · fluid" : `story iframe · ${vp.width}px`;
  const a11yActive = bottomTab === "a11y";

  // Lazily load axe-core's source the first time the Accessibility tab is
  // opened, so the ~550kb payload never loads on the default render path.
  useEffect(() => {
    if (!a11yActive || axeSource || axeLoading.current) return;
    axeLoading.current = true;
    import("axe-core/axe.min.js?raw")
      .then((mod) => setAxeSource(mod.default))
      .catch(() => {
        axeLoading.current = false;
      });
  }, [a11yActive, axeSource]);

  useEffect(() => {
    let cancelled = false;
    if (!selected) {
      setSrcDoc("");
      return;
    }
    renderStory({ storyId: selected.storyId, variant: selected.variant, args: liveArgs })
      .then((result: RenderResult) => {
        if (!cancelled) {
          setSrcDoc(
            buildSrcDoc(result.html, {
              assets: result.assets,
              axeSource: a11yActive && axeSource ? axeSource : undefined,
            })
          );
        }
      })
      .catch(() => {
        if (!cancelled) setSrcDoc(RENDER_ERROR);
      });
    return () => {
      cancelled = true;
    };
  }, [selected, liveArgs, a11yActive, axeSource]);

  useEffect(() => {
    if (typeof WebSocket === "undefined") return;
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/__binbook_ws`);
    ws.onmessage = (e) => {
      if (e.data !== "reload") return;
      const s = useStore.getState();
      if (!s.selected) return;
      renderStory({ storyId: s.selected.storyId, variant: s.selected.variant, args: s.liveArgs })
        .then((r) =>
          setSrcDoc(
            buildSrcDoc(r.html, {
              assets: r.assets,
              axeSource: a11yActive && axeSource ? axeSource : undefined,
            })
          )
        )
        .catch(() => {});
    };
    return () => ws.close();
  }, [a11yActive, axeSource]);

  return (
    <div className="at-grid flex-1 min-h-0 overflow-auto p-10">
      <div className="grid h-full min-h-[280px] place-items-center">
        <div className="at-fade flex w-full flex-col items-center gap-3.5">
          <div className="text-[11px] uppercase tracking-[0.1em] text-dim">{frameLabel}</div>
          <div
            className="flex min-h-[280px] items-center justify-center overflow-hidden rounded-lg border border-line bg-panel p-2 transition-[width] duration-300 ease-in-out"
            style={{ width: vp.width == null ? "100%" : `${vp.width}px`, maxWidth: "100%" }}
          >
            <iframe
              title="Story canvas"
              sandbox="allow-scripts"
              srcDoc={srcDoc}
              className="h-full min-h-[264px] w-full border-0 bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
