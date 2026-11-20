/** Uniform integer in [0, max) using the crypto RNG when available. */
export function randomInt(max: number): number {
  if (max <= 0) return 0
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1)
    const limit = Math.floor(0x100000000 / max) * max // reject to avoid modulo bias
    do crypto.getRandomValues(buf)
    while (buf[0] >= limit)
    return buf[0] % max
  }
  return Math.floor(Math.random() * max)
}

export function shuffle<T>(items: readonly T[]): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
