import { useEffect, useRef } from 'react'

interface Props {
  label: string
  color: { from: string; to: string }
  canRemove: boolean
  onClose: () => void
  onRemove: () => void
  onSpinAgain: () => void
}

export function WinnerModal({ label, color, canRemove, onClose, onRemove, onSpinAgain }: Props) {
  const primary = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    primary.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="winner-title" onClick={onClose}>
      <div
        className="modal__card"
        style={{ ['--from' as string]: color.from, ['--to' as string]: color.to }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="modal__eyebrow">The wheel has spoken</p>
        <h2 id="winner-title" className="modal__winner">
          {label}
        </h2>
        <div className="modal__actions">
          <button ref={primary} className="btn btn--primary" onClick={onSpinAgain}>
            Spin again
          </button>
          {canRemove && (
            <button className="btn btn--ghost" onClick={onRemove}>
              Remove &amp; close
            </button>
          )}
          <button className="btn btn--ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
