import type { ArgSchema } from '@bgunnarsson/binbook-types'

export function resolveArgs(
  schema: ArgSchema,
  variantArgs: Record<string, unknown>,
  liveArgs: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, spec] of Object.entries(schema)) {
    if (key in liveArgs) {
      out[key] = liveArgs[key]
    } else if (key in variantArgs) {
      out[key] = variantArgs[key]
    } else {
      out[key] = spec.default
    }
  }
  return out
}
