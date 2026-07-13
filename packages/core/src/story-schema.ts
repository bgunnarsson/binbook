import { z } from "zod";

const argSpec = z
  .object({
    type: z.enum(["text", "select", "boolean", "number", "color"]),
    default: z.unknown(),
    options: z.array(z.string()).optional(),
    label: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "select" && (!val.options || val.options.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "select arg requires non-empty `options`" });
    }
  });

const razorOptions = z.object({
  mode: z.enum(["mvc", "umbraco"]).default("mvc"),
  content: z
    .object({
      key: z.string().min(1).optional(),
      id: z.number().int().optional(),
      route: z.string().min(1).optional(),
    })
    .optional(),
});

// Inline styles for the canvas preview wrapper: either a raw CSS declaration
// string ("width: 400px; margin: 0 auto") or a property map ({ maxWidth: "400px" }).
const wrapperSpec = z.union([z.string(), z.record(z.union([z.string(), z.number()]))]);

export const storyFileSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  component: z.string().min(1),
  razor: razorOptions.optional(),
  decorators: z.array(z.string().min(1)).optional(),
  wrapper: wrapperSpec.optional(),
  args: z.record(argSpec).default({}),
  stories: z
    .array(
      z.object({
        name: z.string().min(1),
        args: z.record(z.unknown()).default({}),
        wrapper: wrapperSpec.optional(),
      }),
    )
    .min(1),
});

export type StoryFile = z.infer<typeof storyFileSchema>;
