import { Button } from '../../ui/button'

export interface FlashCardProps {
  /** What the team has to guess. */
  text: string
  /** A small line above the text, e.g. "Describe it". */
  hint?: string
  onGot: () => void
  onSkip: () => void
  gotLabel?: string
  skipLabel?: string
}

/**
 * A big card with the item to guess, and Got it / Skip underneath (standard §6, used by Charades).
 * Skip is on the left and Got it on the right, where a right thumb rests: the more common tap is the easier one.
 */
export function FlashCard({ text, hint, onGot, onSkip, gotLabel = 'Got it', skipLabel = 'Skip' }: FlashCardProps) {
  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl bg-card p-6 text-center text-card-foreground shadow-sm">
        {hint && <p className="text-base font-medium tracking-wide text-muted-foreground uppercase">{hint}</p>}
        <p className="text-5xl leading-tight font-bold text-balance break-words">{text}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Button size="lg" variant="outline" onClick={onSkip}>
          {skipLabel}
        </Button>
        <Button size="lg" variant="success" onClick={onGot}>
          {gotLabel}
        </Button>
      </div>
    </div>
  )
}
