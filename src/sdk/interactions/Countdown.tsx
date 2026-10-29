import { useEffect, useEffectEvent, useState } from 'react'
import { cn } from '../../ui/cn'

export interface CountdownProps {
  /** When time runs out, in milliseconds (a machine's `turnEndsAt`). */
  endsAt: number
  /** Called once, when time runs out. A view sends `time_up` from here. */
  onTimeUp: () => void
  /** From this many seconds left, the number turns to the warning color. */
  warnAt?: number
  /** The clock. Tests replace it; the app uses the default. */
  now?: () => number
}

/** Whole seconds left, rounded up: with 4.2 seconds left it shows 5, and it shows 0 only when time is up. */
function secondsLeft(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000))
}

/**
 * The turn timer. Shows the seconds left, turns to the warning color near the end, and calls `onTimeUp` once
 * when time runs out, with a short vibration on phones that support it. If `endsAt` has already passed when it
 * appears, it calls `onTimeUp` straight away.
 *
 * It reads the clock only to *show* the time. Deciding what running out means is the machine's job.
 */
export function Countdown({ endsAt, onTimeUp, warnAt = 10, now = Date.now }: CountdownProps) {
  const [seconds, setSeconds] = useState(() => secondsLeft(endsAt, now()))

  // An effect event always sees the latest `onTimeUp`, without restarting the timer when the parent re-renders.
  const timeUp = useEffectEvent(() => {
    navigator.vibrate?.(300)
    onTimeUp()
  })

  useEffect(() => {
    // Checked four times a second, so the number changes within a quarter of a second of the real time.
    const id = setInterval(() => {
      const left = secondsLeft(endsAt, now())
      setSeconds(left)
      if (left === 0) {
        clearInterval(id)
        timeUp()
      }
    }, 250)
    if (secondsLeft(endsAt, now()) === 0) {
      clearInterval(id)
      timeUp()
    }
    return () => clearInterval(id)
  }, [endsAt, now])

  const warning = seconds <= warnAt

  return (
    <div
      role="timer"
      aria-label={`${seconds} seconds left`}
      className={cn(
        'text-6xl font-bold tabular-nums transition-colors',
        warning ? 'text-warning motion-safe:animate-pulse' : 'text-muted-foreground',
      )}
    >
      {seconds}
    </div>
  )
}
