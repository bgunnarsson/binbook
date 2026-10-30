import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { TestProject } from 'vitest/node'
import { RENDER_PATH } from '../src/protocol'

export const fixtures = fileURLToPath(new URL('./fixtures', import.meta.url))

const astroBin = fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs', import.meta.url))

declare module 'vitest' {
  export interface ProvidedContext {
    astroUrl: string
  }
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, () => {
      const address = server.address()
      server.close(() => resolve(typeof address === 'object' && address ? address.port : 0))
    })
  })
}

// Vitest global setup: start one astro dev on the fixtures, whose config adds the
// integration, and give its URL to the tests. With `VITEST` set Astro never routes
// a request to its pages, so the server runs in its own process, without vitest's
// variables. `--ignore-lock` keeps it in the foreground: without it the CLI moves
// itself to the background when it detects a coding agent.
export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const port = await freePort()
  const url = `http://localhost:${port}`
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith('VITEST')))
  const child = spawn(
    process.execPath,
    [astroBin, 'dev', '--root', fixtures, '--port', String(port), '--ignore-lock'],
    {
      env,
      stdio: 'ignore',
    }
  )
  const stop = () =>
    new Promise<void>((resolve) => {
      if (child.exitCode !== null) {
        resolve()
        return
      }
      child.once('exit', () => resolve())
      child.kill()
    })

  // The port opens before Astro mounts its handler, so wait for a render to succeed.
  const body = JSON.stringify({ component: path.join(fixtures, 'Label.astro'), props: {}, decorators: [] })
  for (const started = Date.now(); Date.now() - started < 30_000 && child.exitCode === null; ) {
    const ready = await fetch(`${url}${RENDER_PATH}`, { method: 'POST', body })
      .then((res) => res.ok)
      .catch(() => false)
    if (ready) {
      project.provide('astroUrl', url)
      return stop
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  await stop()
  throw new Error(`astro dev did not start on ${url}`)
}
