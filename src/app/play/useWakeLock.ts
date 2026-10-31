import { useEffect } from 'react'

/**
 * Keeps the screen on while the component using it is shown: phones dim and lock after a minute or so without a
 * touch, and in a party game nobody touches the phone while someone acts out a clue.
 *
 * Uses the Screen Wake Lock API. The browser drops the lock whenever the page is hidden (another app, the lock
 * button), so it's asked for again each time the page comes back. Where the API is missing, or the request is refused
 * (some battery savers refuse it), the screen just behaves as usual.
 */
export function useWakeLock(): void {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | undefined
    let active = true

    const request = async () => {
      try {
        const granted = await navigator.wakeLock.request('screen')
        // The page may have closed while the browser was answering.
        if (active) lock = granted
        else await granted.release()
      } catch {
        // Refused: carry on without it.
      }
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void request()
    }

    void request()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', onVisibilityChange)
      void lock?.release()
    }
  }, [])
}
