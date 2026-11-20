import type { ComponentType } from 'react'
import { Button } from '../../ui/button'
import { cn } from '../../ui/cn'

export interface FlashCardProps {
  /** What the team has to guess. */
  text: string
  /** A small line above the text, e.g. "Describe it". */
  hint?: string
  /**
   * Makes the hint stand out, for cards that differ in how they're played (Charades' modes): a badge in this theme
   * color, and the card's outline in it too. Only colors the theme's contrast check covers with their own text color.
   */
  tone?: FlashCardTone
  /** An icon in the hint's badge, so the difference doesn't rest on color alone. */
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  onGot: () => void
  onSkip: () => void
  gotLabel?: string
  skipLabel?: string
  /** Turns Skip off, e.g. when no skips are left (ADR 0014). */
  skipDisabled?: boolean
}

/** The theme colors a hint can be, each with text that reads on it (ADR 0010's contrast check). */
export type FlashCardTone = 'primary' | 'secondary' | 'warning'

/** Whole class names, so Tailwind finds them: the badge, and the card's outline. */
const tones: Record<FlashCardTone, { badge: string; card: string }> = {
  primary: { badge: 'bg-primary text-primary-foreground', card: 'border-line border-primary' },
  secondary: { badge: 'bg-secondary text-secondary-foreground', card: 'border-line border-secondary' },
  warning: { badge: 'bg-warning text-warning-foreground', card: 'border-line border-warning' },
}

/**
 * The text size for a card: the longer its longest word, the smaller the whole text.
 * A word can't wrap, so a word too wide for the card would otherwise be broken mid-word.
 * The limits fit a small phone (about 320px of card); `break-words` stays as a last resort.
 */
export function textSize(text: string): string {
  const longest = Math.max(0, ...text.split(/\s+/).map((word) => word.length))
  if (longest <= 10) return 'text-5xl'
  if (longest <= 13) return 'text-4xl'
  if (longest <= 16) return 'text-3xl'
  return 'text-2xl'
}

/**
 * A big card with the item to guess, and Got it / Skip underneath (standard §6, used by Charades).
 * Skip is on the left and Got it on the right, where a right thumb rests: the more common tap is the easier one.
 */
export function FlashCard({ text, hint, tone, icon: Icon, onGot, onSkip, gotLabel = 'Got it', skipLabel = 'Skip', skipDisabled = false }: FlashCardProps) {
  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      {/* data-feature: the theme's decorations (tape, pins…) go on this card (ADR 0011). */}
      <div
        data-feature
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-3 rounded-xl bg-card p-6 text-center text-card-foreground shadow-sm',
          tone && tones[tone].card,
        )}
      >
        {hint && tone ? (
          <p className={cn('flex items-center gap-2 rounded-full px-4 py-1.5 text-base font-semibold tracking-wide uppercase', tones[tone].badge)}>
            {Icon && <Icon aria-hidden className="size-5" />}
            {hint}
          </p>
        ) : (
          hint && <p className="text-base font-medium tracking-wide text-muted-foreground uppercase">{hint}</p>
        )}
        <p className={cn(textSize(text), 'font-heading leading-tight font-bold text-balance break-words')}>{text}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Button size="lg" variant="outline" disabled={skipDisabled} onClick={onSkip}>
          {skipLabel}
        </Button>
        <Button size="lg" variant="success" onClick={onGot}>
          {gotLabel}
        </Button>
      </div>
    </div>
  )
}
