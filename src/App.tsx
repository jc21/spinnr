import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Wheel, type WheelHandle } from './components/Wheel'
import { OptionsPanel, MAX_LABEL, MAX_OPTIONS } from './components/OptionsPanel'
import { WinnerModal } from './components/WinnerModal'
import { Confetti } from './components/Confetti'
import { SharePopover } from './components/SharePopover'
import { ImportPrompt } from './components/ImportPrompt'
import { buildShareUrl, clearShareParam, readSharedFromUrl, sameOptions } from './lib/share'
import { useLocalStorage } from './hooks/useLocalStorage'
import { createId, isBoolean, isEnabled, isOptionList, isStringList, type WheelOption } from './lib/types'
import { segmentColor } from './lib/colors'
import { shuffle } from './lib/random'
import { playWin, primeAudio } from './lib/sound'

const STORAGE = {
  options: 'spinner-wheel:options',
  sound: 'spinner-wheel:sound',
  history: 'spinner-wheel:history',
  noRepeat: 'spinner-wheel:no-repeat',
  lastWinner: 'spinner-wheel:last-winner',
}

const isNullableString = (v: unknown): v is string | null => v === null || typeof v === 'string'

const DEFAULT_OPTIONS: WheelOption[] = ['Pizza', 'Sushi', 'Tacos', 'Burgers', 'Pasta', 'Curry'].map((label) => ({
  id: createId(),
  label,
}))

interface Winner {
  id: string
  label: string
  index: number
  count: number
}

export default function App() {
  // Captured once, before any effect writes defaults to storage.
  const [incoming] = useState(readSharedFromUrl)
  const [hadSavedOptions] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE.options) !== null
    } catch {
      return false
    }
  })
  const [options, setOptions] = useLocalStorage<WheelOption[]>(STORAGE.options, DEFAULT_OPTIONS, isOptionList)
  const [soundOn, setSoundOn] = useLocalStorage<boolean>(STORAGE.sound, true, isBoolean)
  const [history, setHistory] = useLocalStorage<string[]>(STORAGE.history, [], isStringList)
  const [noRepeat, setNoRepeat] = useLocalStorage<boolean>(STORAGE.noRepeat, true, isBoolean)
  const [lastWinnerId, setLastWinnerId] = useLocalStorage<string | null>(STORAGE.lastWinner, null, isNullableString)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState<Winner | null>(null)
  const [burst, setBurst] = useState(0)
  const [pendingShare, setPendingShare] = useState<WheelOption[] | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null)

  const showToast = useCallback((text: string) => setToast({ text, key: Date.now() }), [])
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(t)
  }, [toast])

  // Opened from a share link: load it, or ask first if it would replace an existing wheel.
  useEffect(() => {
    if (!incoming) return
    clearShareParam()
    const shared = incoming.options
    if (!shared) {
      showToast('That share link looks broken — showing your saved wheel.')
      return
    }
    if (!hadSavedOptions || sameOptions(options, shared)) {
      setOptions(shared)
      setLastWinnerId(null)
      if (!sameOptions(options, shared)) showToast(`Loaded a shared wheel with ${shared.length} options.`)
    } else {
      setPendingShare(shared)
    }
    // Run once on mount only; `options` here is the saved wheel we're comparing against.
  }, [])
  const wheel = useRef<WheelHandle>(null)
  // Only ticked options go on the wheel; unticked ones wait on standby in the list.
  const activeOptions = useMemo(() => options.filter(isEnabled), [options])

  const spin = useCallback(() => {
    if (soundOn) primeAudio()
    setWinner(null)
    wheel.current?.spin()
  }, [soundOn])

  const handleSpinEnd = useCallback(
    (index: number) => {
      setSpinning(false)
      const picked = activeOptions[index]
      if (!picked) return
      setWinner({ id: picked.id, label: picked.label, index, count: activeOptions.length })
      setHistory((h) => [picked.label, ...h].slice(0, 8))
      setLastWinnerId(picked.id)
      setBurst((b) => b + 1)
      if (soundOn) playWin()
    },
    [activeOptions, soundOn, setHistory, setLastWinnerId],
  )

  // Space bar spins when you're not typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || winner || pendingShare) return
      const el = document.activeElement
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLButtonElement) return
      e.preventDefault()
      spin()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [spin, winner, pendingShare])

  const addOptions = (labels: string[]) =>
    setOptions((prev) => [...prev, ...labels.map((label) => ({ id: createId(), label }))].slice(0, MAX_OPTIONS))
  const updateOption = (id: string, label: string) =>
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, label: label.slice(0, MAX_LABEL) } : o)))
  const removeOption = (id: string) => setOptions((prev) => prev.filter((o) => o.id !== id))
  const toggleOption = (id: string, enabled: boolean) =>
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, enabled } : o)))
  const setAllEnabled = (enabled: boolean) => setOptions((prev) => prev.map((o) => ({ ...o, enabled })))

  const closeWinner = useCallback(() => setWinner(null), [])
  const closeShare = useCallback(() => setShareOpen(false), [])
  const shareUrl = useMemo(() => (shareOpen ? buildShareUrl(options) : null), [shareOpen, options])
  const keepMine = useCallback(() => setPendingShare(null), [])
  const loadShared = () => {
    if (!pendingShare) return
    setOptions(pendingShare)
    setLastWinnerId(null)
    setPendingShare(null)
    showToast(`Loaded a shared wheel with ${pendingShare.length} options.`)
  }

  return (
    <div className="app">
      <div className="bg" aria-hidden>
        <span className="blob blob--1" />
        <span className="blob blob--2" />
        <span className="blob blob--3" />
      </div>

      <header className="topbar">
        <h1 className="title">
          Spin<span>the</span>Wheel
        </h1>
        <div className="topbar__actions">
        <button
          className="btn btn--ghost btn--share"
          data-share-trigger
          onClick={() => setShareOpen((o) => !o)}
          disabled={options.length === 0}
          aria-expanded={shareOpen}
          aria-haspopup="dialog"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
            <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
          </svg>
          Share
        </button>
        <button
          className="icon-btn icon-btn--lg"
          onClick={() => setSoundOn((s) => !s)}
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
          title={soundOn ? 'Sound on' : 'Sound off'}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M11 5 6 9H2v6h4l5 4V5z" />
            {soundOn ? (
              <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
            ) : (
              <path d="m22 9-6 6M16 9l6 6" />
            )}
          </svg>
        </button>
        {shareUrl && <SharePopover url={shareUrl} optionCount={options.length} onClose={closeShare} />}
        </div>
      </header>

      <main className="layout">
        <section className="stage">
          <Wheel
            ref={wheel}
            options={activeOptions}
            soundOn={soundOn}
            avoidId={noRepeat ? lastWinnerId : null}
            onSpinStart={() => setSpinning(true)}
            onSpinEnd={handleSpinEnd}
          />
          <button className="btn btn--spin" onClick={spin} disabled={spinning || activeOptions.length < 2}>
            {spinning
              ? 'Spinning…'
              : activeOptions.length >= 2
                ? 'Spin the wheel'
                : options.length >= 2
                  ? 'Tick at least 2 options'
                  : 'Add at least 2 options'}
          </button>
          <p className="hint">
            or press <kbd>Space</kbd>
          </p>

          <label className="toggle" title="The previous winner sits out the next spin (needs 3+ options)">
            <input type="checkbox" checked={noRepeat} onChange={(e) => setNoRepeat(e.target.checked)} disabled={spinning} />
            <span className="toggle__track" aria-hidden />
            No back-to-back repeats
          </label>

          {history.length > 0 && (
            <div className="history">
              <span className="history__label">Recent</span>
              <ul>
                {history.map((h, i) => (
                  <li key={`${h}-${i}`}>{h}</li>
                ))}
              </ul>
              <button className="history__clear" onClick={() => setHistory([])}>
                clear
              </button>
            </div>
          )}
        </section>

        <OptionsPanel
          options={options}
          disabled={spinning}
          onAdd={addOptions}
          onUpdate={updateOption}
          onRemove={removeOption}
          onToggle={toggleOption}
          onSetAll={setAllEnabled}
          onShuffle={() => setOptions((o) => shuffle(o))}
          onSort={() => setOptions((o) => [...o].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })))}
          onClear={() => setOptions([])}
        />
      </main>

      <footer className="foot">Your options are saved in this browser.</footer>

      <Confetti burst={burst} />

      {pendingShare && (
        <ImportPrompt shared={pendingShare} currentCount={options.length} onLoad={loadShared} onKeep={keepMine} />
      )}

      {toast && (
        <div key={toast.key} className="toast" role="status">
          {toast.text}
        </div>
      )}

      {winner && (
        <WinnerModal
          label={winner.label}
          color={segmentColor(winner.index, winner.count)}
          canRemove={options.some((o) => o.id === winner.id)}
          onClose={closeWinner}
          onRemove={() => {
            removeOption(winner.id)
            closeWinner()
          }}
          onSpinAgain={spin}
        />
      )}
    </div>
  )
}
