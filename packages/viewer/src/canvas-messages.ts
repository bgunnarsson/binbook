import { useEffect } from "react";
import { CANVAS_SOURCE } from "./canvas-srcdoc";
import { useStore } from "./store";

/**
 * Listens for `postMessage` events from the sandboxed story iframe (see
 * `canvas-srcdoc.ts`) and forwards them into the store: DOM interactions
 * become Actions-panel entries, axe-core results populate the
 * Accessibility panel.
 */
export function useCanvasMessages() {
  const addAction = useStore((s) => s.addAction);
  const setA11y = useStore((s) => s.setA11y);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.source !== CANVAS_SOURCE) { return; }
      if (e.data.kind === "action") {
        addAction(e.data.name, e.data.detail);
      } else if (e.data.kind === "a11y") {
        setA11y({ violations: e.data.violations, passes: e.data.passes });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [addAction, setA11y]);
}
