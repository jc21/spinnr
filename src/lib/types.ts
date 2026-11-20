export const MAX_LABEL = 40
export const MAX_OPTIONS = 100

export interface WheelOption {
  id: string
  label: string
  /** Shown on the wheel when true. Missing (older saved data) counts as enabled. */
  enabled?: boolean
}

export const isEnabled = (o: WheelOption) => o.enabled !== false

export function isOptionList(value: unknown): value is WheelOption[] {
  return (
    Array.isArray(value) &&
    value.every(
      (o) =>
        typeof o === 'object' &&
        o !== null &&
        typeof (o as WheelOption).id === 'string' &&
        typeof (o as WheelOption).label === 'string' &&
        ['boolean', 'undefined'].includes(typeof (o as WheelOption).enabled),
    )
  )
}

export function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    try {
      return crypto.randomUUID()
    } catch {
      /* insecure context — fall through */
    }
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
