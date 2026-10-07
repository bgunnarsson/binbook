import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { frameRequest, ResponseDecoder } from './protocol'

const HOST_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../host')
const TFM = 'net8.0'
const HOST_DLL = path.join(HOST_DIR, 'bin', 'Release', TFM, 'RazorHost.dll')

/** True if a `dotnet` CLI is on PATH. */
export function dotnetAvailable(): boolean {
  try {
    return spawnSync('dotnet', ['--version'], { stdio: 'ignore' }).status === 0
  } catch {
    return false
  }
}

/** Build the render host (restore + compile) if its DLL is not present yet. */
export function buildHost(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (existsSync(HOST_DLL)) {
      return resolve()
    }
    const proc = spawn('dotnet', ['build', '-c', 'Release', '--nologo'], { cwd: HOST_DIR })
    let stderr = ''
    proc.stderr.on('data', (d) => {
      stderr += d
    })
    proc.on('error', reject)
    proc.on('exit', (code) => {
      if (code === 0 && existsSync(HOST_DLL)) {
        resolve()
      } else {
        reject(new Error(`razor host build failed (exit ${code})\n${stderr}`))
      }
    })
  })
}

/**
 * A single long-lived `dotnet RazorHost.dll` process, proxied over stdio.
 * Requests are matched to responses by an incrementing id.
 */
export class RazorHost {
  private proc?: ChildProcessWithoutNullStreams
  private starting?: Promise<void>
  private readonly decoder = new ResponseDecoder()
  private readonly pending = new Map<number, { resolve: (html: string) => void; reject: (err: Error) => void }>()
  private nextId = 1

  /** @param refs absolute paths to Tag Helper assemblies made available to the embedded engine. */
  constructor(private readonly refs: string[] = []) {}

  private async start(): Promise<void> {
    await buildHost()
    const env = { ...process.env }
    if (this.refs.length) {
      env.BINBOOK_RAZOR_REFS = this.refs.join(path.delimiter)
    }
    const proc = spawn('dotnet', [HOST_DLL], { cwd: HOST_DIR, env })
    proc.stdout.setEncoding('utf8')
    proc.stdout.on('data', (chunk: string) => this.onData(chunk))
    proc.stderr.resume() // drain to avoid backpressure; host logs nothing on stdout
    proc.on('exit', () => {
      this.proc = undefined
      this.starting = undefined
      this.failAll(new Error('razor host exited'))
    })
    this.proc = proc
  }

  private onData(chunk: string): void {
    for (const res of this.decoder.push(chunk)) {
      const waiter = this.pending.get(res.id)
      if (!waiter) {
        continue
      }
      this.pending.delete(res.id)
      if (res.error) {
        waiter.reject(new Error(res.error))
      } else {
        waiter.resolve(res.html ?? '')
      }
    }
  }

  private failAll(err: Error): void {
    for (const { reject } of this.pending.values()) {
      reject(err)
    }
    this.pending.clear()
  }

  async render(templatePath: string, args: Record<string, unknown>): Promise<string> {
    if (!this.proc) {
      if (!this.starting) {
        this.starting = this.start()
      }
      await this.starting
    }
    const proc = this.proc
    if (!proc) {
      throw new Error('RazorHost is not running')
    }
    const id = this.nextId++
    return new Promise<string>((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      proc.stdin.write(frameRequest({ id, templatePath, args }))
    })
  }

  dispose(): void {
    this.proc?.kill()
    this.proc = undefined
  }
}

/**
 * Process-wide singleton so every story shares one render host. `refs` (Tag
 * Helper assembly paths) are honored only on first construction; later calls
 * reuse the existing host.
 */
let shared: RazorHost | undefined
export function sharedHost(refs?: string[]): RazorHost {
  shared ??= new RazorHost(refs)
  return shared
}
