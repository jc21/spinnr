import { useEffect, useRef, useState } from 'react'

interface Props {
  url: string
  optionCount: number
  onClose: () => void
}

type CopyState = 'idle' | 'copied' | 'failed'

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false // insecure context or permission denied — user can copy from the field
  }
}

export function SharePopover({ url, optionCount, onClose }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLInputElement>(null)
  const [copy, setCopy] = useState<CopyState>('idle')
  const canNativeShare = typeof navigator.share === 'function'

  const doCopy = async () => {
    const ok = await copyText(url)
    setCopy(ok ? 'copied' : 'failed')
    if (!ok) field.current?.select()
  }

  // Copy straight away on open — that's what the user almost always wants.
  useEffect(() => {
    void doCopy()
  }, [url])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node) && !(e.target as Element).closest?.('[data-share-trigger]')) onClose()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [onClose])

  return (
    <div className="share" ref={root} role="dialog" aria-label="Share this wheel">
      <p className="share__title">Share this wheel</p>
      <p className="share__desc">
        Anyone with this link gets your {optionCount} option{optionCount === 1 ? '' : 's'}, including which are ticked.
      </p>
      <div className="share__row">
        <input
          ref={field}
          className="share__field"
          value={url}
          readOnly
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Share link"
        />
        <button className="btn btn--primary" onClick={doCopy}>
          {copy === 'copied' ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className={`share__status share__status--${copy}`} aria-live="polite">
        {copy === 'copied' && 'Link copied to your clipboard.'}
        {copy === 'failed' && 'Couldn’t copy automatically — select the link and copy it.'}
      </p>
      {canNativeShare && (
        <button
          className="btn btn--ghost share__native"
          onClick={() => navigator.share({ title: 'Spin the Wheel', url }).catch(() => {})}
        >
          Share via…
        </button>
      )}
    </div>
  )
}
