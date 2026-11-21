import { Button } from '../../ui/button'
import { cn } from '../../ui/cn'
import { textSize } from './FlashCard'

export interface FlipCardProps {
  /** A small line above the front, e.g. "French". */
  label?: string
  /** The side shown first. */
  front: string
  /** The side shown after the flip. */
  back: string
  /** Shown both sides. The machine keeps it, so a refresh doesn't hide the answer again. */
  flipped: boolean
  onFlip: () => void
  /** After the flip: players knew it, or not yet. */
  onKnew: () => void
  onNotYet: () => void
}

/**
 * A flash card for learning (standard §6, ADR 0020): one side, Show the answer, then both sides and an honest
 * Not yet or Knew it. It doesn't mark anything itself: players do, and the machine counts it.
 * Not yet on the left and Knew it on the right, like FlashCard's Skip and Got it.
 */
export function FlipCard({ label, front, back, flipped, onFlip, onKnew, onNotYet }: FlipCardProps) {
  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      {/* data-feature: the theme's decorations (tape, pins…) go on this card (ADR 0011). */}
      <div
        data-feature
        className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl bg-card p-6 text-center text-card-foreground shadow-sm"
      >
        {label && <p className="text-base font-medium tracking-wide text-muted-foreground uppercase">{label}</p>}
        <p className={cn(textSize(front), 'font-heading leading-tight font-bold text-balance break-words')}>{front}</p>
        {flipped && (
          <>
            <hr aria-hidden className="w-1/2 border-border" />
            <p aria-live="polite" className={cn(textSize(back), 'leading-tight font-semibold text-balance break-words text-primary')}>
              {back}
            </p>
          </>
        )}
      </div>
      {flipped ? (
        <div className="grid grid-cols-2 gap-4">
          <Button size="lg" variant="outline" onClick={onNotYet}>
            Not yet
          </Button>
          <Button size="lg" variant="success" onClick={onKnew}>
            Knew it
          </Button>
        </div>
      ) : (
        <Button size="lg" onClick={onFlip}>
          Show the answer
        </Button>
      )}
    </div>
  )
}
