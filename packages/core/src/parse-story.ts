import type { ArgSchema, Story } from "@bgunnarsson/binbook-types";
import { storyFileSchema } from "./story-schema";

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// zod's `z.unknown()` marks the inferred `default` property as optional
// (since `undefined` extends `unknown`), which does not structurally match
// `ArgSpec.default: unknown` (a required key). Rebuild each entry explicitly
// so `default` is always a present key, without loosening `ArgSchema`.
function toArgSchema(args: ReturnType<typeof storyFileSchema.parse>["args"]): ArgSchema {
  const result: ArgSchema = {};
  for (const [key, spec] of Object.entries(args)) {
    result[key] = {
      type: spec.type,
      default: spec.default,
      options: spec.options,
      label: spec.label,
    };
  }
  return result;
}

export function parseStoryFile(json: unknown, file: string): Story {
  const parsed = storyFileSchema.parse(json);
  return {
    id: slugify(parsed.title),
    title: parsed.title,
    description: parsed.description,
    component: parsed.component,
    args: toArgSchema(parsed.args),
    variants: parsed.stories,
    file,
  };
}
