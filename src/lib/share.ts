import { createId, MAX_LABEL, MAX_OPTIONS, type WheelOption } from './types'

/** Query parameter that carries a shared wheel. */
export const SHARE_PARAM = 'w'

// Wire format: base64url( JSON [[label, 1|0], ...] ). Compact, UTF-8 safe, no server needed.
type Packed = [label: string, enabled: 0 | 1][]

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(encoded: string): string {
  const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

export function encodeOptions(options: WheelOption[]): string {
  const packed: Packed = options.map((o) => [o.label, o.enabled === false ? 0 : 1])
  return toBase64Url(JSON.stringify(packed))
}

/** Returns null for anything malformed — links get mangled, truncated or hand-edited. */
export function decodeOptions(encoded: string): WheelOption[] | null {
  try {
    const data: unknown = JSON.parse(fromBase64Url(encoded))
    if (!Array.isArray(data)) return null
    const options: WheelOption[] = []
    for (const item of data) {
      if (!Array.isArray(item) || typeof item[0] !== 'string') return null
      const label = item[0].trim().slice(0, MAX_LABEL)
      if (!label) continue
      options.push({ id: createId(), label, enabled: item[1] !== 0 })
      if (options.length >= MAX_OPTIONS) break
    }
    return options.length > 0 ? options : null
  } catch {
    return null
  }
}

/** Link to this page (any other query params kept) carrying the given options. */
export function buildShareUrl(options: WheelOption[]): string {
  const url = new URL(window.location.href)
  url.hash = ''
  url.searchParams.set(SHARE_PARAM, encodeOptions(options))
  return url.toString()
}

/** Reads a shared wheel from the current URL, if there is one. */
export function readSharedFromUrl(): { options: WheelOption[] | null } | null {
  const raw = new URL(window.location.href).searchParams.get(SHARE_PARAM)
  if (raw == null) return null
  return { options: decodeOptions(raw) }
}

/** Drops the share param from the address bar so a refresh doesn't re-import. */
export function clearShareParam() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has(SHARE_PARAM)) return
  url.searchParams.delete(SHARE_PARAM)
  window.history.replaceState(window.history.state, '', url.toString())
}

export function sameOptions(a: WheelOption[], b: WheelOption[]): boolean {
  return a.length === b.length && a.every((o, i) => o.label === b[i].label && (o.enabled !== false) === (b[i].enabled !== false))
}
