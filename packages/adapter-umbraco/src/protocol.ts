/**
 * Newline-delimited JSON framing shared with the .NET render host.
 * One request per line on stdin, one response per line on stdout.
 */

export interface HostRequest {
  id: number
  templatePath: string
  args: Record<string, unknown>
}

export interface HostResponse {
  id: number
  html?: string
  error?: string
}

/** Serialize a request as a single newline-terminated frame. */
export function frameRequest(req: HostRequest): string {
  return JSON.stringify(req) + '\n'
}

/**
 * Incremental decoder: feed it raw stdout chunks, get back complete responses.
 * Partial lines are buffered until their terminating newline arrives.
 */
export class ResponseDecoder {
  private buffer = ''

  push(chunk: string): HostResponse[] {
    this.buffer += chunk
    const out: HostResponse[] = []
    // Each pass takes one complete line off the front of the buffer; a
    // partial tail stays for the next chunk.
    for (let idx = this.buffer.indexOf('\n'); idx >= 0; idx = this.buffer.indexOf('\n')) {
      const line = this.buffer.slice(0, idx)
      this.buffer = this.buffer.slice(idx + 1)
      if (!line.trim()) {
        continue
      }
      try {
        out.push(JSON.parse(line) as HostResponse)
      } catch {
        // Ignore non-JSON noise on the stream (defensive; host writes only frames).
      }
    }
    return out
  }
}
