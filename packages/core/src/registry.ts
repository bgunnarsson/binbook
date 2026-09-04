import { minimatch } from "minimatch";
import type { Adapter, Story } from "@bgunnarsson/binbook-types";

export class AdapterRegistry {
  constructor(private readonly adapters: Adapter[]) {
    if (adapters.length === 0) { throw new Error("No adapters registered"); }
  }

  /** v1: single adapter is the common case; match by storyGlob, else first. */
  forStory(story: Story): Adapter {
    const match = this.adapters.find((a) => minimatch(story.file, a.storyGlob, { matchBase: true }));
    return match ?? this.adapters[0];
  }
}
