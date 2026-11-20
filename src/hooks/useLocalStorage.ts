import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'

/**
 * useState that is persisted to localStorage and kept in sync across tabs.
 * `validate` guards against corrupted / stale data shapes in storage.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  validate?: (value: unknown) => value is T,
): [T, Dispatch<SetStateAction<T>>] {
  const read = useCallback((raw: string | null): T | undefined => {
    if (raw == null) return undefined
    try {
      const parsed: unknown = JSON.parse(raw)
      if (validate && !validate(parsed)) return undefined
      return parsed as T
    } catch {
      return undefined
    }
  }, [validate])

  const [value, setValue] = useState<T>(() => {
    try {
      return read(window.localStorage.getItem(key)) ?? initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage full or blocked (private mode) — the app still works in-memory.
    }
  }, [key, value])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== window.localStorage || e.key !== key) return
      const next = read(e.newValue)
      if (next !== undefined) setValue(next)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key, read])

  return [value, setValue]
}
