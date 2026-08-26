import type { ArgSchema, Story } from "@bgunnarsson/binbook-types";
import { storyFileSchema } from "./story-schema";

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Normalize a story/variant `wrapper` (a raw CSS string or a property map) into
 * a single CSS declaration string. Object keys are kebab-cased so camelCase
 * (`maxWidth`) and CSS (`max-width`) both work. Returns undefined for an empty
 * or absent value so the canvas skips the wrapper entirely.
 */
function normalizeWrapper(
  wrapper: string | Record<string, string | number> | undefined,
): string | undefined {
  if (wrapper == null) return undefined;
  if (typeof wrapper === "string") {
    const trimmed = wrapper.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  const decls = Object.entries(wrapper).map(([prop, value]) => {
    const kebab = prop.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
    return `${kebab}: ${value}`;
  });
  return decls.length === 0 ? undefined : decls.join("; ");
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
  // Block List manifests carry no `component`/`stories` of their own — the
  // adapter's `expand` hook replaces them with per-block stories at discovery.
  // Give the placeholder a benign shape so it parses and can be expanded.
  const variants = (parsed.stories ?? [{ name: "Default", args: {} }]).map((v) => ({
    name: v.name,
    args: v.args,
    wrapper: normalizeWrapper(v.wrapper),
  }));
  return {
    id: slugify(parsed.title),
    title: parsed.title,
    description: parsed.description,
    component: parsed.component ?? "",
    umbraco: parsed.umbraco,
    decorators: parsed.decorators,
    wrapper: normalizeWrapper(parsed.wrapper),
    args: toArgSchema(parsed.args),
    variants,
    file,
  };
}
