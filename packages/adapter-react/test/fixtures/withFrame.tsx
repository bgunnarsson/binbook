import { createElement } from "react";
import type { ReactNode } from "react";

// A trivial decorator: wraps children in a marked <div> so tests can assert
// the wrapper is present around the story markup.
export default function withFrame({ children }: { children?: ReactNode }) {
  return createElement("div", { "data-decorator": "frame" }, children);
}
