import { useState, type FormEvent } from 'react'
import { isEnabled, MAX_LABEL, MAX_OPTIONS, type WheelOption } from '../lib/types'
import { segmentColor } from '../lib/colors'

interface Props {
  options: WheelOption[]
  disabled: boolean
  onAdd: (labels: string[]) => void
  onUpdate: (id: string, label: string) => void
  onRemove: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
  onSetAll: (enabled: boolean) => void
  onShuffle: () => void
  onSort: () => void
  onClear: () => void
}

export { MAX_LABEL, MAX_OPTIONS } from '../lib/types'

export function OptionsPanel({ options, disabled, onAdd, onUpdate, onRemove, onToggle, onSetAll, onShuffle, onSort, onClear }: Props) {
  const [draft, setDraft] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const full = options.length >= MAX_OPTIONS
  const activeCount = options.filter(isEnabled).length
  // Swatch colours must match the wheel, which only contains ticked options.
  const wheelIndex = new Map<string, number>()
  options.filter(isEnabled).forEach((o, i) => wheelIndex.set(o.id, i))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    // Allow pasting "a, b, c" or multiple lines to add several at once.
    const labels = draft
      .split(/[\n,]/)
      .map((s) => s.trim().slice(0, MAX_LABEL))
      .filter(Boolean)
    if (labels.length === 0) return
    onAdd(labels)
    setDraft('')
  }

  return (
    <section className="panel" aria-label="Wheel options">
      <header className="panel__head">
        <h2>Options</h2>
        <span className="badge" title={`${activeCount} on the wheel, ${options.length - activeCount} on standby`}>
          {activeCount}/{options.length}
        </span>
        {options.length > 0 && (
          <div className="panel__bulk">
            <button className="link-btn" onClick={() => onSetAll(true)} disabled={disabled || activeCount === options.length}>
              All
            </button>
            <button className="link-btn" onClick={() => onSetAll(false)} disabled={disabled || activeCount === 0}>
              None
            </button>
          </div>
        )}
      </header>

      <form className="adder" onSubmit={submit}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={full ? 'Wheel is full' : 'Add an option… (comma separates many)'}
          aria-label="New option"
          disabled={disabled || full}
          autoComplete="off"
        />
        <button type="submit" className="btn btn--primary" disabled={disabled || full || !draft.trim()}>
          Add
        </button>
      </form>

      {options.length === 0 ? (
        <p className="panel__empty">Your wheel is empty. Add at least two options to spin.</p>
      ) : (
        <ul className="option-list">
          {options.map((opt, i) => {
            const on = isEnabled(opt)
            const wi = wheelIndex.get(opt.id)
            const c = wi === undefined ? null : segmentColor(wi, activeCount)
            return (
              <li key={opt.id} className={`option ${on ? '' : 'option--standby'}`}>
                <label className="check" title={on ? 'On the wheel — untick to put on standby' : 'On standby — tick to add to the wheel'}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => onToggle(opt.id, e.target.checked)}
                    disabled={disabled}
                    aria-label={`Show ${opt.label} on the wheel`}
                  />
                  <span
                    className="check__box"
                    style={c ? { background: `linear-gradient(135deg, ${c.from}, ${c.to})` } : undefined}
                    aria-hidden
                  >
                    <svg viewBox="0 0 16 16" width="12" height="12">
                      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </label>
                <input
                  className="option__input"
                  value={opt.label}
                  maxLength={MAX_LABEL}
                  onChange={(e) => onUpdate(opt.id, e.target.value)}
                  onBlur={(e) => {
                    if (!e.target.value.trim()) onRemove(opt.id)
                  }}
                  disabled={disabled}
                  aria-label={`Option ${i + 1}`}
                />
                <button
                  className="icon-btn"
                  onClick={() => onRemove(opt.id)}
                  disabled={disabled}
                  aria-label={`Remove ${opt.label}`}
                  title="Remove"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <footer className="panel__actions">
        <button className="btn btn--ghost" onClick={onShuffle} disabled={disabled || options.length < 2}>
          Shuffle
        </button>
        <button className="btn btn--ghost" onClick={onSort} disabled={disabled || options.length < 2}>
          Sort A–Z
        </button>
        {confirmClear ? (
          <button
            className="btn btn--danger"
            onClick={() => {
              onClear()
              setConfirmClear(false)
            }}
            onBlur={() => setConfirmClear(false)}
            autoFocus
          >
            Really clear?
          </button>
        ) : (
          <button className="btn btn--ghost" onClick={() => setConfirmClear(true)} disabled={disabled || options.length === 0}>
            Clear all
          </button>
        )}
      </footer>
    </section>
  )
}
