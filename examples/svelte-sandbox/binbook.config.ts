import { defineConfig } from '@bgunnarsson/binbook-core'
import svelte from '@bgunnarsson/binbook-adapter-svelte'

export default defineConfig({
  stories: ['src/**/*.binbook.json'],
  adapters: [svelte()],
  background: '#ffffff',
  styles: ['./src/styles/app.css'],
  // Overridable via env so the e2e suite can run this sandbox on its own port.
  port: process.env.BINBOOK_PORT ? Number(process.env.BINBOOK_PORT) : undefined,
})
