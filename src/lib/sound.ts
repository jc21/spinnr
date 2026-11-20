let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** Unlock audio on a user gesture so later sounds aren't blocked by autoplay policy. */
export function primeAudio() {
  audio()
}

export function playTick(intensity = 1) {
  const c = audio()
  if (!c) return
  const t = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(1400 + Math.random() * 300, t)
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.04)
  gain.gain.setValueAtTime(0.06 * intensity + 0.02, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
  osc.connect(gain).connect(c.destination)
  osc.start(t)
  osc.stop(t + 0.06)
}

export function playWin() {
  const c = audio()
  if (!c) return
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]
  notes.forEach((freq, i) => {
    const t = c.currentTime + i * 0.085
    const last = i === notes.length - 1
    const len = last ? 0.9 : 0.22
    for (const type of ['sine', 'triangle'] as OscillatorType[]) {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(type === 'sine' ? 0.12 : 0.05, t + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + len)
      osc.connect(gain).connect(c.destination)
      osc.start(t)
      osc.stop(t + len + 0.05)
    }
  })
}
