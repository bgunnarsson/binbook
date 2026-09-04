import { escapeHtml } from './escape'

const TOKEN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g

export function interpolate(template: string, args: Record<string, unknown>): string {
  return template.replace(TOKEN, (_match, name: string) => {
    const value = args[name]
    if (value === undefined || value === null) {
      return ''
    }
    if (typeof value === 'boolean') {
      // boolean attribute semantics: the attribute NAME is the arg key
      return value ? name : ''
    }
    return escapeHtml(String(value))
  })
}
