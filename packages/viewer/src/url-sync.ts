import { useEffect } from "react";
import { useStore } from "./store";
import { decodeUrlState, encodeUrlState, resolveSelection } from "./url-state";

/**
 * Two-way bind viewer state <-> the URL query string, so story links are
 * shareable, survive a refresh, and browser back/forward walks between them.
 *
 * - Once the catalog loads, the URL's story / variant / args / viewport are
 *   applied to the store.
 * - Selecting a *different* story pushes a history entry (so Back returns to the
 *   previous one); tweaking args or the viewport replaces the current entry, so
 *   fiddling controls doesn't flood the history stack.
 * - `popstate` re-applies whatever the URL now says.
 *
 * A single hook owns the subscription for the app's lifetime; call it once from
 * the root component.
 */
export function useUrlSync(): void {
  useEffect(() => {
    // Guards store writes made *by us* (initial apply / popstate) from echoing
    // straight back out to the URL.
    let applying = false;
    // storyId|variant of the entry currently reflected in the URL — lets us tell
    // a story change (push) from an in-story tweak (replace).
    let lastKey = "";

    const apply = (search: string): void => {
      const s = useStore.getState();
      const decoded = decodeUrlState(search);
      const sel = resolveSelection(s.stories, decoded.storyId, decoded.variant);
      applying = true;
      try {
        if (sel) {
          const changed =
            !s.selected || s.selected.storyId !== sel.storyId || s.selected.variant !== sel.variant;
          // `select` resets per-story context (incl. liveArgs), so only call it
          // when the story actually changed; then layer the URL's args on top.
          if (changed) { s.select(sel); }
          useStore.setState({ liveArgs: decoded.args ?? {} });
        }
        if (decoded.viewport) { s.setViewport(decoded.viewport); }
      } finally {
        applying = false;
      }
      lastKey = sel ? `${sel.storyId}|${sel.variant}` : "";
    };

    const writeUrl = (): void => {
      const s = useStore.getState();
      if (!s.selected) { return; }
      const search = encodeUrlState({
        storyId: s.selected.storyId,
        variant: s.selected.variant,
        viewport: s.viewport,
        args: s.liveArgs,
      });
      const url = `${window.location.pathname}${search}${window.location.hash}`;
      // The store notifies on every change (action-log events, a11y results, …);
      // skip the write when nothing that lives in the URL actually moved.
      if (url === `${window.location.pathname}${window.location.search}${window.location.hash}`) { return; }
      const key = `${s.selected.storyId}|${s.selected.variant}`;
      if (key !== lastKey) {
        lastKey = key;
        window.history.pushState(null, "", url);
      } else {
        window.history.replaceState(null, "", url);
      }
    };

    // Apply the initial URL as soon as the catalog is available (it usually
    // arrives just after mount, but may already be here on a fast fetch).
    if (useStore.getState().stories.length > 0) {
      apply(window.location.search);
    }

    const unsub = useStore.subscribe((state, prev) => {
      // Catalog just loaded → apply the initial URL now that stories exist.
      if (prev.stories.length === 0 && state.stories.length > 0) {
        apply(window.location.search);
        return;
      }
      if (!applying) { writeUrl(); }
    });

    const onPop = (): void => apply(window.location.search);
    window.addEventListener("popstate", onPop);

    return () => {
      unsub();
      window.removeEventListener("popstate", onPop);
    };
  }, []);
}
