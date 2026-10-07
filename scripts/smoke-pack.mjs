#!/usr/bin/env node
// Installs the packages the way a user would: pack every publishable package,
// install the tarballs into a fresh project outside the workspace, start
// `binbook dev` on the README's HTML example and render a story. The workspace
// links packages with `workspace:*`, so it never sees what the tarballs leave out.
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const work = mkdtempSync(path.join(tmpdir(), 'binbook-smoke-'))
const tarballs = path.join(work, 'tarballs')
const app = path.join(work, 'app')
let dev

function run(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] })
}

function assert(ok, message) {
  if (!ok) {
    throw new Error(message)
  }
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer()
    srv.on('error', reject)
    srv.listen(0, () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

async function waitFor(url, ms) {
  const until = Date.now() + ms
  while (Date.now() < until) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        return
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`${url} did not answer within ${ms}ms`)
}

try {
  // Pack.
  mkdirSync(tarballs)
  const packed = {}
  for (const dir of readdirSync(path.join(repo, 'packages'))) {
    const pkgDir = path.join(repo, 'packages', dir)
    const pkg = JSON.parse(readFileSync(path.join(pkgDir, 'package.json'), 'utf8'))
    if (pkg.private) {
      continue
    }
    const out = run('pnpm', ['pack', '--json', '--pack-destination', tarballs], pkgDir)
    packed[pkg.name] = JSON.parse(out).filename
  }
  console.log(`packed ${Object.keys(packed).length} packages`)

  // Tarball contents.
  for (const [name, file] of Object.entries(packed)) {
    const entries = run('tar', ['tzf', file]).split('\n')
    assert(entries.includes('package/NOTICE'), `${name} tarball has no NOTICE`)
    if (name === '@bgunnarsson/binbook-adapter-umbraco') {
      for (const f of ['RazorHost.csproj', 'Program.cs', 'NuGet.config']) {
        assert(entries.includes(`package/host/${f}`), `umbraco tarball is missing host/${f}`)
      }
      assert(!entries.some((e) => /^package\/host\/(bin|obj)\//.test(e)), 'umbraco tarball carries host build output')
    }
  }

  // Install into a project that knows nothing of the workspace. `overrides`
  // points the packages' own dependencies on each other at the tarballs too.
  const files = Object.fromEntries(Object.entries(packed).map(([name, file]) => [name, `file:${file}`]))
  mkdirSync(path.join(app, 'src/button'), { recursive: true })
  writeFileSync(
    path.join(app, 'package.json'),
    JSON.stringify(
      {
        name: 'binbook-smoke',
        private: true,
        type: 'module',
        devDependencies: {
          '@bgunnarsson/binbook-core': files['@bgunnarsson/binbook-core'],
          '@bgunnarsson/binbook-adapter-html': files['@bgunnarsson/binbook-adapter-html'],
        },
        overrides: files,
      },
      null,
      2
    )
  )
  writeFileSync(
    path.join(app, 'binbook.config.ts'),
    `import { defineConfig } from '@bgunnarsson/binbook-core'
import html from '@bgunnarsson/binbook-adapter-html'

export default defineConfig({
  stories: ['src/**/*.binbook.json'],
  adapters: [html()],
  port: Number(process.env.BINBOOK_PORT),
})
`
  )
  writeFileSync(
    path.join(app, 'src/button/button.html'),
    '<button class="btn btn--{{variant}}" {{disabled}}>{{label}}</button>\n'
  )
  writeFileSync(
    path.join(app, 'src/button/button.binbook.json'),
    JSON.stringify({
      title: 'Components/Button',
      component: './button.html',
      args: {
        label: { type: 'text', default: 'Click me' },
        variant: { type: 'select', options: ['primary', 'secondary', 'ghost'], default: 'primary' },
        disabled: { type: 'boolean', default: false },
      },
      stories: [{ name: 'Default', args: {} }],
    })
  )
  run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], app)
  console.log('installed into a clean project')

  // Run and render.
  const port = await freePort()
  dev = spawn(path.join(app, 'node_modules/.bin/binbook'), ['dev'], {
    cwd: app,
    env: { ...process.env, BINBOOK_PORT: String(port) },
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  const base = `http://localhost:${port}`
  await waitFor(`${base}/api/stories`, 30_000)
  const res = await fetch(`${base}/api/render`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ storyId: 'components-button', variant: 'Default', args: { label: 'Smoke' } }),
  })
  const body = await res.text()
  assert(res.ok, `/api/render answered ${res.status}: ${body}`)
  const { html } = JSON.parse(body)
  assert(html?.includes('btn--primary') && html.includes('Smoke'), `/api/render returned unexpected markup: ${html}`)
  console.log('smoke ok: the installed packages render the HTML story')
} catch (err) {
  console.error(`smoke failed: ${err.message}`)
  process.exitCode = 1
} finally {
  dev?.kill()
  rmSync(work, { recursive: true, force: true })
}
