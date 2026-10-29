import { Minus, Plus } from 'lucide-react'
import { Button } from '../../ui/button'

export interface StepperProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  /** How the value is shown, e.g. `(s) => `${s} seconds``. */
  format?: (value: number) => string
  onChange: (value: number) => void
}

/** A number picked with − and + buttons: easier than typing a number on a phone, and can't go out of range. */
export function Stepper({ label, value, min, max, step = 1, format = String, onChange }: StepperProps) {
  return (
    <div role="group" aria-label={label} className="flex items-center justify-between gap-4">
      <Button
        size="icon"
        variant="secondary"
        aria-label={`Less: ${label}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - step))}
      >
        <Minus aria-hidden />
      </Button>
      <span className="text-2xl font-bold tabular-nums" aria-live="polite">
        {format(value)}
      </span>
      <Button
        size="icon"
        variant="secondary"
        aria-label={`More: ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + step))}
      >
        <Plus aria-hidden />
      </Button>
    </div>
  )
}
