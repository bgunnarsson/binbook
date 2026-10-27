import { useState } from 'react'
import { useStore } from '../store'

const RELEASE_NOTES = 'https://github.com/bgunnarsson/binbook/blob/main/packages/core/CHANGELOG.md'

/** Sidebar-footer card shown when the dev server found a newer binbook on npm. */
export function UpdateNotice() {
  const update = useStore((s) => s.update)
  const setUpdate = useStore((s) => s.setUpdate)
  const [copied, setCopied] = useState(false)

  if (!update) {
    return null
  }

  const onCopy = () => {
    navigator.clipboard?.writeText(update.command)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <section aria-label="Update available" className="flex flex-col gap-1.5 rounded-md bg-accent-soft p-3">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="h-1.5 w-1.5 flex-none rounded-full bg-accent" />
        <span className="flex-1 text-[12.5px] font-medium text-text">Update available</span>
        <button
          type="button"
          title="Dismiss"
          aria-label="Dismiss update notice"
          onClick={() => setUpdate(null)}
          className="text-[11px] text-dim transition-colors hover:text-text"
        >
          ✕
        </button>
      </div>
      <p className="text-[12px] leading-[18px] text-dim">
        binbook {update.latest} is out. You're on {update.current}.
      </p>
      <div className="flex items-center gap-3 pt-1.5">
        <button
          type="button"
          title={update.command}
          onClick={onCopy}
          className="rounded-sm bg-accent px-2.5 py-[5px] text-[12px] font-medium text-accent-ink hover:bg-accent/90"
        >
          {copied ? 'Copied!' : 'Copy update'}
        </button>
        <a
          href={RELEASE_NOTES}
          target="_blank"
          rel="noreferrer"
          className="text-[12px] text-muted transition-colors hover:text-text"
        >
          Release notes
        </a>
      </div>
    </section>
  )
}
