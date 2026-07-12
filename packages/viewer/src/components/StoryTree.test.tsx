import { render, screen, fireEvent } from "@testing-library/react";
import { test, expect, beforeEach } from "vitest";
import { StoryTree } from "./StoryTree";
import { useStore } from "../store";
import type { TreeNode } from "@bgunnarsson/binbook-types";

const nodes: TreeNode[] = [
  {
    name: "Components",
    path: "Components",
    children: [
      {
        name: "Button",
        path: "Components/Button",
        children: [
          {
            name: "Default",
            path: "Components/Button/Default",
            children: [],
            leaf: { storyId: "components-button", variant: "Default" },
          },
        ],
      },
    ],
  },
];

beforeEach(() => {
  useStore.setState({ selected: null });
});

test("clicking a leaf selects the story", () => {
  render(<StoryTree nodes={nodes} forceOpen />);
  fireEvent.click(screen.getByText("Default"));
  expect(useStore.getState().selected).toEqual({ storyId: "components-button", variant: "Default" });
});

test("groups are collapsed by default and expand on click", () => {
  render(<StoryTree nodes={nodes} />);
  // Only the top group header shows; nested groups/leaves are hidden.
  expect(screen.queryByText("Button")).toBeNull();
  fireEvent.click(screen.getByText("Components"));
  expect(screen.queryByText("Default")).toBeNull();
  fireEvent.click(screen.getByText("Button"));
  expect(screen.getByText("Default")).toBeInTheDocument();
});
