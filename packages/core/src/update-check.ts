import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import type { UpdateInfo } from '@bgunnarsson/binbook-types'

export type PackageManager = 'pnpm' | 'yarn' | 'npm' | 'bun'

const SCOPE = '@bgunnarsson/binbook-'
const CORE = `${SCOPE}core`
const LATEST_URL = `https://registry.npmjs.org/${CORE}/latest`

/** Lockfiles in the order a project that somehow has several is most likely using. */
const LOCKFILES: [string, PackageManager][] = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
  ['yarn.lock', 'yarn'],
  ['package-lock.json', 'npm'],
]

/**
 * Asks npm once whether a newer binbook is out. Anything that goes wrong —
 * offline, a slow registry, a malformed manifest — means no notice rather than
 * an error, since the dev server has no use for the answer beyond the viewer.
 */
export async function checkForUpdate(root: string): Promise<UpdateInfo | null> {
  try {
    const own = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
    const res = await fetch(LATEST_URL, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) {
      return null
    }
    const { version } = (await res.json()) as { version?: string }
    if (typeof version !== 'string' || !isNewer(version, own.version)) {
      return null
    }
    const manager = await detectPackageManager(root)
    return { current: own.version, latest: version, command: updateCommand(manager, await binbookPackages(root)) }
  } catch {
    return null
  }
}

/** Compares the numeric `major.minor.patch` of two versions; a prerelease is never newer. */
export function isNewer(latest: string, current: string): boolean {
  const parse = (v: string) => /^(\d+)\.(\d+)\.(\d+)$/.exec(v)?.slice(1).map(Number)
  const a = parse(latest)
  const b = parse(current.replace(/-.*$/, ''))
  if (!a || !b) {
    return false
  }
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) {
      return a[i] > b[i]
    }
  }
  return false
}

/** The lockfile nearest the project root decides; a workspace keeps it above the package. */
export async function detectPackageManager(root: string): Promise<PackageManager> {
  let dir = path.resolve(root)
  for (;;) {
    for (const [file, manager] of LOCKFILES) {
      try {
        await access(path.join(dir, file))
        return manager
      } catch {
        // not this one
      }
    }
    const parent = path.dirname(dir)
    if (parent === dir) {
      return 'npm'
    }
    dir = parent
  }
}

/** The binbook packages the project's own package.json depends on. */
export async function binbookPackages(root: string): Promise<string[]> {
  try {
    const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((n) => n.startsWith(SCOPE))
    return names.length ? names.sort() : [CORE]
  } catch {
    return [CORE]
  }
}

/**
 * pnpm takes a wildcard and keeps each package where it was declared. The
 * others are given the list: npm and Bun have no wildcard, and `yarn up` does
 * not exist in Yarn 1, while `yarn add` works in every version.
 */
export function updateCommand(manager: PackageManager, packages: string[]): string {
  if (manager === 'pnpm') {
    return `pnpm up "${SCOPE}*" --latest`
  }
  const list = packages.map((p) => `${p}@latest`).join(' ')
  if (manager === 'yarn') {
    return `yarn add -D ${list}`
  }
  if (manager === 'bun') {
    return `bun add -d ${list}`
  }
  return `npm i -D ${list}`
}
