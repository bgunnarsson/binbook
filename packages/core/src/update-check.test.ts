import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { binbookPackages, detectPackageManager, isNewer, updateCommand } from './update-check'

let dir: string

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'binbook-update-'))
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

test('isNewer compares major, minor and patch numerically', () => {
  expect(isNewer('1.0.10', '1.0.9')).toBe(true)
  expect(isNewer('1.1.0', '1.0.9')).toBe(true)
  expect(isNewer('2.0.0', '1.9.9')).toBe(true)
  expect(isNewer('1.0.1', '1.0.1')).toBe(false)
  expect(isNewer('1.0.0', '1.0.1')).toBe(false)
})

test('isNewer never offers a prerelease, and treats a running prerelease as its release', () => {
  expect(isNewer('1.1.0-beta.1', '1.0.0')).toBe(false)
  expect(isNewer('1.1.0', '1.1.0-beta.1')).toBe(false)
  expect(isNewer('1.2.0', '1.1.0-beta.1')).toBe(true)
})

test('detectPackageManager finds the lockfile in a workspace root above the project', async () => {
  const project = path.join(dir, 'apps', 'site')
  await mkdir(project, { recursive: true })
  await writeFile(path.join(dir, 'pnpm-lock.yaml'), '')
  expect(await detectPackageManager(project)).toBe('pnpm')
})

test('detectPackageManager prefers the nearest lockfile', async () => {
  const project = path.join(dir, 'site')
  await mkdir(project)
  await writeFile(path.join(dir, 'pnpm-lock.yaml'), '')
  await writeFile(path.join(project, 'yarn.lock'), '')
  expect(await detectPackageManager(project)).toBe('yarn')
})

test('binbookPackages lists the project dependencies in the binbook scope', async () => {
  await writeFile(
    path.join(dir, 'package.json'),
    JSON.stringify({
      dependencies: { react: '18.3.1' },
      devDependencies: {
        '@bgunnarsson/binbook-core': '1.0.0',
        '@bgunnarsson/binbook-adapter-react': '1.0.0',
      },
    })
  )
  expect(await binbookPackages(dir)).toEqual(['@bgunnarsson/binbook-adapter-react', '@bgunnarsson/binbook-core'])
})

test('binbookPackages falls back to core without a package.json', async () => {
  expect(await binbookPackages(dir)).toEqual(['@bgunnarsson/binbook-core'])
})

test('updateCommand uses a wildcard for pnpm and the package list elsewhere', () => {
  const packages = ['@bgunnarsson/binbook-adapter-react', '@bgunnarsson/binbook-core']
  expect(updateCommand('pnpm', packages)).toBe('pnpm up "@bgunnarsson/binbook-*" --latest')
  expect(updateCommand('npm', packages)).toBe(
    'npm i -D @bgunnarsson/binbook-adapter-react@latest @bgunnarsson/binbook-core@latest'
  )
  expect(updateCommand('yarn', ['@bgunnarsson/binbook-core'])).toBe('yarn add -D @bgunnarsson/binbook-core@latest')
  expect(updateCommand('bun', ['@bgunnarsson/binbook-core'])).toBe('bun add -d @bgunnarsson/binbook-core@latest')
})
