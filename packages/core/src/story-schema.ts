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

export const storyFileSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  component: z.string().min(1),
  decorators: z.array(z.string().min(1)).optional(),
  args: z.record(argSpec).default({}),
  stories: z
    .array(z.object({ name: z.string().min(1), args: z.record(z.unknown()).default({}) }))
    .min(1),
});

export type StoryFile = z.infer<typeof storyFileSchema>;
