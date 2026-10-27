export interface ThemeOption {
  /** Stamped on <html> as data-theme; styles.css keys each palette on it. */
  key: string
  label: string
}

/** 'system' stamps nothing: Cloud in a light OS, Geist in a dark one. */
export const THEMES: ThemeOption[] = [
  { key: 'system', label: 'Default' },
  { key: 'cloud', label: 'Cloud' },
  { key: 'geist', label: 'Geist' },
  { key: 'material', label: 'Material' },
  { key: 'mocha', label: 'Catppuccin Mocha' },
  { key: 'carbon', label: 'Carbon' },
  { key: 'primer', label: 'Primer' },
  { key: 'radix', label: 'Radix' },
  { key: 'atlassian', label: 'Atlassian' },
  { key: 'apple', label: 'Apple' },
  { key: 'polaris', label: 'Polaris' },
  { key: 'linear', label: 'Linear' },
  { key: 'tokyo-night', label: 'Tokyo Night' },
  { key: 'rose-pine', label: 'Rosé Pine' },
  { key: 'dracula', label: 'Dracula' },
  { key: 'gruvbox', label: 'Gruvbox' },
  { key: 'one-dark', label: 'One Dark' },
]

export const THEME_KEY = 'binbook:theme'

/** A stored value, or 'system' when it is missing or names no theme. */
export function themeByKey(key: string | null): string {
  return THEMES.some((t) => t.key === key) ? (key as string) : 'system'
}

export function applyTheme(key: string) {
  if (key === 'system') {
    delete document.documentElement.dataset.theme
  } else {
    document.documentElement.dataset.theme = key
  }
}
