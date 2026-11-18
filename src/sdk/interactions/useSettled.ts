import { useEffect, useState } from 'react'

/**
 * How long a screen that appears by itself (time ran out) keeps its buttons off, in milliseconds (ADR 0016). A tap
 * aimed at the turn's last second would otherwise land on the next screen's button.
 *
 * An object, not a constant, so `src/testSetup.ts` can set it to 0: tests tap through screens at once.
 */
export const settleDelay = { ms: 2000 }

/**
 * False for `settleDelay.ms` after the component first shows, then true. Use it to turn buttons off just after a
 * screen appears: `<Button disabled={!settled}>`. With a delay of 0, it's true from the start.
 */
export function useSettled(ms: number = settleDelay.ms): boolean {
  const [settled, setSettled] = useState(ms <= 0)
  useEffect(() => {
    if (ms <= 0) return
    const timer = setTimeout(() => setSettled(true), ms)
    return () => clearTimeout(timer)
  }, [ms])
  return settled
}
