import { defineConfig } from '@bgunnarsson/binbook-core'
import react from '@bgunnarsson/binbook-adapter-react'

export default defineConfig({
  stories: ['src/**/*.binbook.json'],
  adapters: [react()],
  // Default port is 6006; overridable via env (used by the e2e suite to run
  // this sandbox alongside the HTML one).
  port: process.env.BINBOOK_PORT ? Number(process.env.BINBOOK_PORT) : undefined,
  // Canvas appearance for this project: a white backdrop and the app's own CSS,
  // injected into the isolated story iframe.
  background: '#ffffff',
  styles: ['./src/styles/app.css'],
})
