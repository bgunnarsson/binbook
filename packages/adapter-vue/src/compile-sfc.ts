import { createHash } from 'node:crypto'
import { parse, compileScript, compileStyle } from 'vue/compiler-sfc'

export interface CompiledSfc {
  /** ESM module code exporting the component as default. */
  code: string
  /** Concatenated compiled `<style>` output (scoped styles carry their attr selector). */
  css: string
}

/**
 * Compiles a Vue SFC to an ESM module + its CSS. `<script setup>`, plain
 * `<script>`, and template-only components are all handled; the template is
 * compiled inline into the component (SSR or client render, per `ssr`). Scoped
 * styles get a stable per-file scope id shared by markup and styles.
 */
export function compileSfc(source: string, filename: string, opts: { ssr: boolean }): CompiledSfc {
  // compileScript throws on template-only SFCs ("no <script> tags"); give them a
  // synthetic <script setup> so simple/decorator components just work. It needs
  // a non-empty body — parse discards a truly-empty block — hence the comment.
  const probe = parse(source, { filename }).descriptor
  const src = probe.script || probe.scriptSetup ? source : `${source}\n<script setup>/* binbook */</script>\n`
  const { descriptor } = parse(src, { filename })
  const id = createHash('sha1').update(filename).digest('hex').slice(0, 8)
  const scopeId = `data-v-${id}`
  const hasScoped = descriptor.styles.some((s) => s.scoped)

  const script = compileScript(descriptor, {
    id,
    inlineTemplate: true,
    templateOptions: { ssr: opts.ssr, compilerOptions: hasScoped ? { scopeId } : {} },
    genDefaultAs: '__sfc__',
  })

  let code = script.content
  code += `\n__sfc__.__file = ${JSON.stringify(filename)};`
  if (hasScoped) {
    code += `\n__sfc__.__scopeId = ${JSON.stringify(scopeId)};`
  }
  code += `\nexport default __sfc__;\n`

  let css = ''
  for (const style of descriptor.styles) {
    const res = compileStyle({ source: style.content, filename, id: scopeId, scoped: style.scoped })
    css += res.code
  }

  return { code, css }
}
