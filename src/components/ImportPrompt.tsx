import { useEffect, useRef } from 'react'
import type { WheelOption } from '../lib/types'

interface Props {
  shared: WheelOption[]
  currentCount: number
  onLoad: () => void
  onKeep: () => void
}

export function ImportPrompt({ shared, currentCount, onLoad, onKeep }: Props) {
  const primary = useRef<HTMLButtonElement>(null)
  const active = shared.filter((o) => o.enabled !== false).length

  useEffect(() => {
    primary.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onKeep()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onKeep])

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <div className="modal__card modal__card--plain">
        <p className="modal__eyebrow">Shared wheel</p>
        <h2 id="import-title" className="modal__heading">
          Load {shared.length} option{shared.length === 1 ? '' : 's'}?
        </h2>
        <ul className="import__preview">
          {shared.slice(0, 12).map((o) => (
            <li key={o.id} className={o.enabled === false ? 'is-standby' : ''}>
              {o.label}
            </li>
          ))}
          {shared.length > 12 && <li className="is-more">+{shared.length - 12} more</li>}
        </ul>
        <p className="modal__note">
          {active} on the wheel{shared.length > active ? `, ${shared.length - active} on standby` : ''}. This replaces your
          current {currentCount} option{currentCount === 1 ? '' : 's'}.
        </p>
        <div className="modal__actions">
          <button ref={primary} className="btn btn--primary" onClick={onLoad}>
            Load shared wheel
          </button>
          <button className="btn btn--ghost" onClick={onKeep}>
            Keep mine
          </button>
        </div>
      </div>
    </div>
  )
}
