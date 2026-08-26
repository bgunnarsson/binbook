import { render, screen } from "@testing-library/react";
import { act } from "react";
import { test, expect, vi, beforeEach } from "vitest";

vi.mock("../api", () => ({
  fetchDocs: vi.fn(async () => ({ source: "" })),
}));

import { BottomPanel } from "./BottomPanel";
import { useStore } from "../store";

beforeEach(() => {
  useStore.setState({ dock: "bottom", bottomTab: "controls", selected: null, stories: [] });
  localStorage.clear();
});

test("the dock toggle flips the dock between bottom and right and persists it", async () => {
  render(<BottomPanel />);

  // Starts bottom → the button offers to dock right.
  const toRight = screen.getByRole("button", { name: "Dock panel to the right" });
  await act(async () => toRight.click());

  expect(useStore.getState().dock).toBe("right");
  expect(localStorage.getItem("binbook:dock")).toBe("right");

  // Now it offers to dock back to the bottom.
  const toBottom = screen.getByRole("button", { name: "Dock panel to the bottom" });
  await act(async () => toBottom.click());

  expect(useStore.getState().dock).toBe("bottom");
  expect(localStorage.getItem("binbook:dock")).toBe("bottom");
});
