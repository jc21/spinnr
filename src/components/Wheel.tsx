import { useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type Ref } from 'react'
import type { WheelOption } from '../lib/types'
import { segmentColor } from '../lib/colors'
import { randomInt } from '../lib/random'
import { playTick, primeAudio } from '../lib/sound'

export interface WheelHandle {
  spin: () => void
}

interface WheelProps {
  options: WheelOption[]
  soundOn: boolean
  /** Option id that must not win this spin (used for "no back-to-back repeats"). */
  avoidId?: string | null
  onSpinStart?: () => void
  onSpinEnd?: (index: number) => void
  ref?: Ref<WheelHandle>
}

const R = 230 // wheel radius in SVG units (viewBox is 500x500 centred on 0,0)
const BULBS = 24

/** Point on a circle, angle in degrees measured clockwise from 12 o'clock. */
function polar(radius: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: radius * Math.sin(rad), y: -radius * Math.cos(rad) }
}

function segmentPath(start: number, end: number) {
  const a = polar(R, start)
  const b = polar(R, end)
  const large = end - start > 180 ? 1 : 0
  return `M0 0 L${a.x} ${a.y} A${R} ${R} 0 ${large} 1 ${b.x} ${b.y} Z`
}

function truncate(label: string, max: number) {
  return label.length > max ? `${label.slice(0, max - 1).trimEnd()}…` : label
}

// Fast launch, long satisfying glide to a stop.
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)

const mod = (n: number, m: number) => ((n % m) + m) % m

export function Wheel({ options, soundOn, avoidId, onSpinStart, onSpinEnd, ref }: WheelProps) {
  const rotorRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef<HTMLDivElement>(null)
  const rotation = useRef(0)
  const frame = useRef(0)
  const busy = useRef(false)
  const [spinning, setSpinning] = useState(false)

  // Keep latest props in refs so the animation loop never sees stale values.
  const latest = useRef({ options, soundOn, avoidId, onSpinStart, onSpinEnd })
  useLayoutEffect(() => {
    latest.current = { options, soundOn, avoidId, onSpinStart, onSpinEnd }
  })

  const n = options.length
  const seg = n > 0 ? 360 / n : 360

  const segments = useMemo(() => {
    const fontSize = n <= 4 ? 26 : n <= 8 ? 22 : n <= 14 ? 18 : n <= 24 ? 14 : 11
    const maxChars = n <= 2 ? 16 : n <= 12 ? 14 : 12
    return options.map((opt, i) => ({
      ...opt,
      i,
      color: segmentColor(i, n),
      path: segmentPath(i * seg, (i + 1) * seg),
      mid: i * seg + seg / 2,
      text: truncate(opt.label, maxChars),
      fontSize,
    }))
  }, [options, n, seg])

  const applyRotation = (deg: number) => {
    rotation.current = deg
    if (rotorRef.current) rotorRef.current.style.transform = `rotate(${deg}deg)`
  }

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const spin = () => {
    const count = latest.current.options.length
    if (busy.current || count < 2) return
    busy.current = true
    if (latest.current.soundOn) primeAudio()

    const segDeg = 360 / count
    // Uniformly random among eligible options. Excluding the previous winner only
    // kicks in with 3+ options — with 2 it would just alternate predictably.
    const { options: opts, avoidId: avoid } = latest.current
    const all = opts.map((_, i) => i)
    const eligible = avoid && count >= 3 ? all.filter((i) => opts[i].id !== avoid) : all
    const pool = eligible.length > 0 ? eligible : all
    const winner = pool[randomInt(pool.length)]
    // Land somewhere inside the winning slice, away from the edges.
    const landAt = winner * segDeg + segDeg * (0.12 + Math.random() * 0.76)
    const start = rotation.current
    // Rotating clockwise by R puts wheel-angle `a` under the pointer when a + R ≡ 0 (mod 360).
    const delta = mod(-landAt - start, 360)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fullTurns = reduced ? 1 : 6 + randomInt(3)
    const end = start + fullTurns * 360 + delta
    const duration = reduced ? 1200 : 5200 + Math.random() * 1400

    setSpinning(true)
    latest.current.onSpinStart?.()

    let lastSlice = Math.floor(mod(-start, 360) / segDeg)
    let lastTickAt = 0
    const t0 = performance.now()

    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration)
      const deg = start + (end - start) * easeOut(t)
      applyRotation(deg)

      const slice = Math.floor(mod(-deg, 360) / segDeg)
      if (slice !== lastSlice) {
        lastSlice = slice
        // Throttle so very fast/very dense wheels don't machine-gun the audio.
        if (now - lastTickAt > 28) {
          lastTickAt = now
          if (latest.current.soundOn) playTick(1 - t)
          pointerRef.current?.animate(
            [{ transform: 'rotate(-22deg)' }, { transform: 'rotate(0deg)' }],
            { duration: 90 + t * 160, easing: 'cubic-bezier(.2,.8,.3,1.4)' },
          )
        }
      }

      if (t < 1) {
        frame.current = requestAnimationFrame(step)
      } else {
        applyRotation(mod(end, 360)) // normalise so numbers stay small
        busy.current = false
        setSpinning(false)
        latest.current.onSpinEnd?.(Math.floor(mod(-end, 360) / segDeg) % count)
      }
    }
    frame.current = requestAnimationFrame(step)
  }

  useImperativeHandle(ref, () => ({ spin }))

  const canSpin = n >= 2 && !spinning

  return (
    <div className={`wheel ${spinning ? 'is-spinning' : ''}`}>
      <div className="wheel__glow" aria-hidden />

      <div className="wheel__frame">
        <svg className="wheel__rim" viewBox="-250 -250 500 500" aria-hidden>
          <defs>
            <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fde68a" />
              <stop offset=".45" stopColor="#d97706" />
              <stop offset=".55" stopColor="#92400e" />
              <stop offset="1" stopColor="#fcd34d" />
            </linearGradient>
          </defs>
          <circle r="246" fill="url(#rim)" />
          <circle r="236" fill="#140f2e" />
          {Array.from({ length: BULBS }, (_, i) => {
            const p = polar(241, (i * 360) / BULBS)
            return <circle key={i} className="bulb" cx={p.x} cy={p.y} r="3.6" style={{ ['--i' as string]: i }} />
          })}
        </svg>

        <div className="wheel__rotor" ref={rotorRef}>
          <svg viewBox="-250 -250 500 500" role="img" aria-label={`Wheel with ${n} options`}>
            <defs>
              {segments.map((s) => (
                <linearGradient
                  key={s.id}
                  id={`g-${s.id}`}
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1="0"
                  x2={polar(R, s.mid).x}
                  y2={polar(R, s.mid).y}
                >
                  <stop offset="0" stopColor={s.color.to} />
                  <stop offset="1" stopColor={s.color.from} />
                </linearGradient>
              ))}
              <radialGradient id="sheen" cx="0" cy="0" r={R} gradientUnits="userSpaceOnUse">
                <stop offset=".55" stopColor="#fff" stopOpacity="0" />
                <stop offset=".93" stopColor="#fff" stopOpacity=".14" />
                <stop offset="1" stopColor="#000" stopOpacity=".25" />
              </radialGradient>
            </defs>

            {n === 0 && (
              <>
                <circle r={R} fill="#ffffff10" stroke="#ffffff22" strokeDasharray="6 8" />
                <text className="wheel__empty" y="70" textAnchor="middle">
                  Add some options
                </text>
              </>
            )}
            {n === 1 && <circle r={R} fill={`url(#g-${segments[0].id})`} />}
            {n > 1 &&
              segments.map((s) => (
                <path key={s.id} d={s.path} fill={`url(#g-${s.id})`} stroke="#0b0b1a55" strokeWidth="1.5" />
              ))}

            {n === 1 && (
              <text className="wheel__label" y="-120" textAnchor="middle" dominantBaseline="central" fill={segments[0].color.text} fontSize={segments[0].fontSize}>
                {segments[0].text}
              </text>
            )}
            {n > 1 &&
              segments.map((s) => (
                <g key={s.id} transform={`rotate(${s.mid - 90})`}>
                  <text
                    className="wheel__label"
                    x={R - 22}
                    textAnchor="end"
                    dominantBaseline="central"
                    fill={s.color.text}
                    fontSize={s.fontSize}
                  >
                    {s.text}
                  </text>
                </g>
              ))}

            <circle r={R} fill="url(#sheen)" pointerEvents="none" />
          </svg>
        </div>

        <div className="wheel__pointer" ref={pointerRef} aria-hidden>
          <svg viewBox="0 0 40 56">
            <defs>
              <linearGradient id="ptr" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="1" stopColor="#e2e8f0" />
              </linearGradient>
            </defs>
            <path d="M20 54 L4 14 A17 17 0 1 1 36 14 Z" fill="url(#ptr)" stroke="#0b0b1a" strokeOpacity=".15" />
            <circle cx="20" cy="17" r="6" fill="#ec4899" />
          </svg>
        </div>

        <button className="wheel__hub" onClick={spin} disabled={!canSpin} aria-label="Spin the wheel">
          <span>{spinning ? '' : 'SPIN'}</span>
        </button>
      </div>
    </div>
  )
}
