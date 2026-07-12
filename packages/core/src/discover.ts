import { readFile } from "node:fs/promises";
import fg from "fast-glob";
import type { BinbookConfig, Story } from "@bgunnarsson/binbook-types";
import { parseStoryFile } from "./parse-story";

export async function discoverStories(config: BinbookConfig): Promise<Story[]> {
  const files = await fg(config.stories, { absolute: true });
  const stories: Story[] = [];
  for (const file of files.sort()) {
    const json = JSON.parse(await readFile(file, "utf8"));
    stories.push(parseStoryFile(json, file));
  }
  return stories;
}
