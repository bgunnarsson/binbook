import { z } from 'zod'

const argSpec = z
  .object({
    type: z.enum(['text', 'select', 'boolean', 'number', 'color']),
    default: z.unknown(),
    options: z.array(z.string()).optional(),
    label: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === 'select' && (!val.options || val.options.length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'select arg requires non-empty `options`' })
    }
  })

const contentRef = z.object({
  key: z.string().min(1).optional(),
  id: z.number().int().optional(),
  route: z.string().min(1).optional(),
})

const umbracoOptions = z.object({
  mode: z.enum(['live', 'offline']).default('offline'),
  content: contentRef.optional(),
  block: z
    .object({
      property: z.string().min(1),
      type: z.string().min(1).optional(),
      viewPath: z.string().min(1).optional(),
    })
    .optional(),
  blockList: z
    .object({
      content: contentRef,
      property: z.string().min(1),
      viewPath: z.string().min(1).optional(),
    })
    .optional(),
})

// Inline styles for the canvas preview wrapper: either a raw CSS declaration
// string ("width: 400px; margin: 0 auto") or a property map ({ maxWidth: "400px" }).
const wrapperSpec = z.union([z.string(), z.record(z.union([z.string(), z.number()]))])

export const storyFileSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    // Optional only for Block List manifests (`umbraco.blockList`), whose blocks —
    // and thus component view paths — are discovered from the live site. Every
    // other story must set it; enforced in the superRefine below.
    component: z.string().min(1).optional(),
    umbraco: umbracoOptions.optional(),
    decorators: z.array(z.string().min(1)).optional(),
    wrapper: wrapperSpec.optional(),
    args: z.record(argSpec).default({}),
    // Likewise optional for manifests, which expand into their own stories.
    stories: z
      .array(
        z.object({
          name: z.string().min(1),
          args: z.record(z.unknown()).default({}),
          wrapper: wrapperSpec.optional(),
        })
      )
      .min(1)
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.umbraco?.blockList) {
      return
    } // manifest: component/stories are synthesized on expand
    if (!val.component) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: '`component` is required', path: ['component'] })
    }
    if (!val.stories) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'at least one story is required', path: ['stories'] })
    }
  })

export type StoryFile = z.infer<typeof storyFileSchema>
