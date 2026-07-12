import type { DocsMeta, RenderResult, Story, TreeNode } from "@bgunnarsson/binbook-types";

export async function fetchStories(): Promise<{ tree: TreeNode[]; stories: Story[] }> {
  const res = await fetch("/api/stories");
  if (!res.ok) throw new Error("Failed to load stories");
  return res.json();
}

export async function renderStory(body: {
  storyId: string;
  variant: string;
  args: Record<string, unknown>;
}): Promise<RenderResult> {
  const res = await fetch("/api/render", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Render failed");
  return res.json();
}

export async function fetchDocs(storyId: string): Promise<DocsMeta> {
  const res = await fetch("/api/docs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ storyId }),
  });
  if (!res.ok) throw new Error("Docs failed");
  return res.json();
}
