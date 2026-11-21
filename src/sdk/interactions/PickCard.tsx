import { Check, X } from 'lucide-react'
import { Button } from '../../ui/button'
import { cn } from '../../ui/cn'

export interface PickCardProps {
  /** A small line above the prompt, e.g. "Find their partners". */
  label: string
  /** What the tiles are about: words to find partners for, or a group. Shown as chips. */
  prompts: readonly string[]
  /** The tiles. */
  options: readonly string[]
  /** How many tiles to pick, e.g. 3. */
  need: number
  /** The tiles picked, by position. */
  picked: readonly number[]
  /** The right tiles, by position. Only shown once `checked`. */
  answers: readonly number[]
  /** After Check: the result is shown, and taps do nothing. */
  checked: boolean
  /** A tile tapped before Check: on or off. */
  onPick: (index: number) => void
  onCheck: () => void
}

/** How a tile looks: picked before Check; after it, right (green), wrong (red), missed (outlined), or neither. */
function look(index: number, { picked, answers, checked }: Pick<PickCardProps, 'picked' | 'answers' | 'checked'>) {
  const isPicked = picked.includes(index)
  const isAnswer = answers.includes(index)
  if (!checked) return { variant: isPicked ? ('primary' as const) : ('outline' as const), icon: null, label: undefined, extra: '' }
  if (isPicked && isAnswer) return { variant: 'success' as const, icon: Check, label: 'Right', extra: '' }
  if (isPicked) return { variant: 'destructive' as const, icon: X, label: 'Wrong', extra: '' }
  if (isAnswer) return { variant: 'outline' as const, icon: Check, label: 'Missed', extra: 'border-success' }
  return { variant: 'outline' as const, icon: null, label: undefined, extra: 'opacity-50' }
}

/** "2 of 3 right". */
export function pickResult(picked: readonly number[], answers: readonly number[]): string {
  return `${picked.filter((index) => answers.includes(index)).length} of ${answers.length} right`
}

/**
 * Pick a set number of tiles out of many (standard §6, ADR 0020): Pairs' match-up (the partners of three words) and
 * odd-one-out (the three not in a group). Two columns of tiles at least 44px tall, Check once enough are picked, then
 * the result. It doesn't score: the machine does.
 */
export function PickCard({ label, prompts, options, need, picked, answers, checked, onPick, onCheck }: PickCardProps) {
  const full = picked.length >= need
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* data-feature: the theme's decorations go on this card (ADR 0011). */}
      <div data-feature className="flex flex-col items-center gap-2 rounded-xl bg-card p-4 text-center text-card-foreground shadow-sm">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <ul aria-label="Prompts" className="flex flex-wrap justify-center gap-2">
          {prompts.map((prompt) => (
            <li key={prompt} className="font-heading rounded-full bg-secondary px-3 py-1 text-lg font-bold text-secondary-foreground">
              {prompt}
            </li>
          ))}
        </ul>
        <p className="min-h-6 font-semibold" aria-live="polite">
          {checked ? pickResult(picked, answers) : `${picked.length} of ${need} picked`}
        </p>
      </div>
      <ul aria-label="Tiles" className="grid min-h-0 flex-1 auto-rows-[minmax(2.75rem,1fr)] grid-cols-2 gap-2 overflow-y-auto">
        {options.map((option, index) => {
          const { variant, icon: Icon, label: result, extra } = look(index, { picked, answers, checked })
          const locked = checked || (full && !picked.includes(index))
          return (
            <li key={index} className="flex">
              <Button
                variant={variant}
                aria-pressed={checked ? undefined : picked.includes(index)}
                // Not `disabled`: that would fade the result. A tap that can't count does nothing.
                aria-disabled={locked}
                className={cn('h-full min-h-11 w-full gap-2 px-3 py-2 text-center leading-tight', extra)}
                onClick={() => !locked && onPick(index)}
              >
                <span className="min-w-0 break-words">{option}</span>
                {Icon && <Icon aria-label={result} className="size-4 shrink-0" />}
              </Button>
            </li>
          )
        })}
      </ul>
      {!checked && (
        <Button size="lg" disabled={!full} onClick={onCheck}>
          Check
        </Button>
      )}
    </div>
  )
}
