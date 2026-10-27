import { buildHost, dotnetAvailable } from '../src/host-client'

// Vitest global setup: build the Razor host once, before any worker starts.
// Each test file runs in its own worker, and two of them render through the
// host; left to build it themselves, they run `dotnet build` in the same
// directory at once, and one fails on the shared obj/ files.
export default async function setup(): Promise<void> {
  if (dotnetAvailable()) {
    await buildHost()
  }
}
