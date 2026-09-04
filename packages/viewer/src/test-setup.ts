/// <reference types="@testing-library/jest-dom" />
import "@testing-library/jest-dom";

/*
 * jsdom 25 gives this project a window and a document but no `localStorage` —
 * `window.localStorage` is undefined even with a proper `http://localhost:3000`
 * origin. The viewer works around that at runtime: `store.ts` and
 * `BottomPanel.tsx` both guard `typeof localStorage === "undefined"` before
 * touching it, so the dock preference simply stops persisting rather than
 * throwing. The tests do not guard, and should not have to.
 *
 * So the environment gets a real one. Not a stub that swallows calls: a Map that
 * stores and returns what it was given, so an assertion that the dock was
 * persisted still fails when the persisting is removed.
 */
if (typeof globalThis.localStorage === "undefined") {
  const entries = new Map<string, string>();

  const storage: Storage = {
    get length() {
      return entries.size;
    },
    key: (index) => [...entries.keys()][index] ?? null,
    getItem: (key) => entries.get(String(key)) ?? null,
    setItem: (key, value) => void entries.set(String(key), String(value)),
    removeItem: (key) => void entries.delete(String(key)),
    clear: () => entries.clear(),
  };

  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
  if (typeof window !== "undefined") {
    Object.defineProperty(window, "localStorage", { value: storage, configurable: true });
  }
}
