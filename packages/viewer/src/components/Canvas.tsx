import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { renderStory } from "../api";
import { viewportByKey } from "../viewports";
import { CHECKERBOARD } from "../backgrounds";
import { buildSrcDoc, toAbsolute } from "../canvas-srcdoc";
import type { RenderResult, Story } from "@bgunnarsson/binbook-types";

const RENDER_ERROR = buildSrcDoc('<p style="font-family:monospace;color:#9a9fb5">Render error</p>');

/** Resolve the canvas wrapper style for a selection: the variant's `wrapper`
 * wins over the story's. Undefined when neither is set. */
function wrapperFor(
  stories: Story[],
  sel: { storyId: string; variant: string } | null,
): string | undefined {
  if (!sel) return undefined;
  const story = stories.find((s) => s.id === sel.storyId);
  const variant = story?.variants.find((v) => v.name === sel.variant);
  return variant?.wrapper ?? story?.wrapper;
}

export function Canvas() {
  const selected = useStore((s) => s.selected);
  const liveArgs = useStore((s) => s.liveArgs);
  const viewportName = useStore((s) => s.viewport);
  const background = useStore((s) => s.background);
  const canvasStyles = useStore((s) => s.canvasStyles);
  const bottomTab = useStore((s) => s.bottomTab);
  const [srcDoc, setSrcDoc] = useState("");
  const [axeSource, setAxeSource] = useState<string | null>(null);
  const axeLoading = useRef(false);

  const vp = viewportByKey(viewportName);
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
              assets: [...toAbsolute(canvasStyles), ...(result.assets ?? [])],
              baseHref: result.baseHref,
              wrapperStyle: wrapperFor(useStore.getState().stories, selected),
              clientScript: result.clientScript,
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
  }, [selected, liveArgs, canvasStyles, a11yActive, axeSource]);

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
              assets: [...toAbsolute(s.canvasStyles), ...(r.assets ?? [])],
              baseHref: r.baseHref,
              wrapperStyle: wrapperFor(s.stories, s.selected),
              clientScript: r.clientScript,
              axeSource: a11yActive && axeSource ? axeSource : undefined,
            })
          )
        )
        .catch(() => {});
    };
    return () => ws.close();
  }, [a11yActive, axeSource]);

  return (
    <div className="at-grid flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-6">
      {/* The frame fills the available height; in responsive mode it also fills
          the full width, while fixed presets stay centered at their px width. */}
      <div className="flex min-h-0 flex-1 justify-center">
        <div
          data-testid="canvas-frame"
          className="h-full overflow-hidden rounded-lg border border-line transition-[width] duration-300 ease-in-out"
          // Checkerboard base shows through wherever the backdrop is transparent.
          style={{ width: vp.width == null ? "100%" : `${vp.width}px`, maxWidth: "100%", ...CHECKERBOARD }}
        >
          <iframe
            title="Story canvas"
            sandbox="allow-scripts"
            srcDoc={srcDoc}
            className="h-full w-full border-0"
            style={{ background }}
          />
        </div>
      </div>
    </div>
  );
}
