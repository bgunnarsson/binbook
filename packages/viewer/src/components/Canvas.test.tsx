import { render, waitFor } from "@testing-library/react";
import { test, expect, vi, beforeEach } from "vitest";

vi.mock("../api", () => ({
  renderStory: vi.fn(async () => ({ html: "<button>Hi</button>" })),
  fetchStories: vi.fn(async () => ({ tree: [], stories: [] })),
}));

import { Canvas } from "./Canvas";
import { useStore } from "../store";

beforeEach(() => {
  useStore.setState({ selected: { storyId: "components-button", variant: "Default" }, liveArgs: {} });
});

test("renders the selected story html into the iframe srcdoc", async () => {
  const { container } = render(<Canvas />);
  await waitFor(() => {
    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("srcdoc") ?? "").toContain("<button>Hi</button>");
  });
});
