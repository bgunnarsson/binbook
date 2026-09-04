import type { Config } from 'tailwindcss'

export default {
  // Resolve content globs relative to this config file rather than
  // process.cwd(): binbook's CLI runs Vite with root = the viewer package,
  // but process.cwd() is the consuming project (e.g. examples/html-sandbox),
  // so cwd-relative globs would never match any viewer source files.
  content: {
    relative: true,
    files: ['./index.html', './src/**/*.{ts,tsx}'],
  },
  theme: {
    extend: {
      // Named after the Atelier tokens in styles.css. Use these instead of
      // hard-coded hex so the whole viewer reads from one palette.
      colors: {
        bg: 'var(--at-bg)',
        panel: 'var(--at-panel)',
        inset: 'var(--at-inset)',
        line: 'var(--at-border)',
        'line-soft': 'var(--at-border-soft)',
        'line-input': 'var(--at-border-input)',
        'line-hover': 'var(--at-border-hover)',
        'row-line': 'var(--at-row-line)',
        'row-hover': 'var(--at-row-hover)',
        text: 'var(--at-text)',
        muted: 'var(--at-muted)',
        dim: 'var(--at-dim)',
        dimmer: 'var(--at-dimmer)',
        // accent carries RGB channels so alpha modifiers (bg-accent/10) work
        accent: 'rgb(var(--at-accent-rgb) / <alpha-value>)',
        'accent-bright': 'var(--at-accent-bright)',
        'accent-ink': 'var(--at-accent-ink)',
        danger: 'var(--at-danger)',
        warn: 'var(--at-warn)',
        success: 'var(--at-success)',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--at-r-sm)',
        md: 'var(--at-r-md)',
        lg: 'var(--at-r-lg)',
        xl: 'var(--at-r-xl)',
      },
      // Hover/interaction transitions should feel smooth: any `transition*`
      // utility without an explicit `duration-*` now runs at 300ms (was 150ms).
      transitionDuration: {
        DEFAULT: '300ms',
      },
    },
  },
  plugins: [],
} satisfies Config
