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
      // Named after the theme tokens in styles.css. Use these instead of
      // hard-coded hex so the whole viewer reads from one palette.
      colors: {
        bg: 'var(--at-bg)',
        panel: 'var(--at-panel)',
        inset: 'var(--at-inset)',
        chip: 'var(--at-chip)',
        line: 'var(--at-border)',
        'row-hover': 'var(--at-row-hover)',
        text: 'var(--at-text)',
        muted: 'var(--at-muted)',
        dim: 'var(--at-dim)',
        // accent carries RGB channels so alpha modifiers (bg-accent/10) work
        accent: 'rgb(var(--at-accent-rgb) / <alpha-value>)',
        'accent-ink': 'var(--at-accent-ink)',
        'accent-soft': 'var(--at-accent-soft)',
        'accent-text': 'var(--at-accent-text)',
        danger: 'var(--at-danger)',
        warn: 'var(--at-warn)',
        success: 'var(--at-success)',
        'success-soft': 'var(--at-success-soft)',
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
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
