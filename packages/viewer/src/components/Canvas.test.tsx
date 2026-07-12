import { render, waitFor } from "@testing-library/react";
import { test, expect, vi, beforeEach } from "vitest";

vi.mock("../api", () => ({
  renderStory: vi.fn(async () => ({ html: "<button>Hi</button>" })),
  fetchStories: vi.fn(async () => ({ tree: [], stories: [] })),
}));

import { Canvas } from "./Canvas";
import { useStore } from "../store";

beforeEach(() => {
  useStore.setState({
    selected: { storyId: "components-button", variant: "Default" },
    liveArgs: {},
    background: "#ffffff",
  });
});

test("renders the selected story html into the iframe srcdoc", async () => {
  const { container } = render(<Canvas />);
  await waitFor(() => {
    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("srcdoc") ?? "").toContain("<button>Hi</button>");
  });
});

test("applies the chosen canvas background to the iframe", async () => {
  useStore.setState({ background: "rgb(10, 10, 10)" });
  const { container } = render(<Canvas />);
  const iframe = container.querySelector("iframe") as HTMLIFrameElement;
  await waitFor(() => expect(iframe.style.background).toBe("rgb(10, 10, 10)"));
});
