import { Check, X } from 'lucide-react'
import { Button } from '../../ui/button'
import { cn } from '../../ui/cn'

export interface MultipleChoiceProps {
  /** What the prompt is, e.g. "Question" or "Mathematics". */
  label?: string
  /** The question. */
  question: string
  /** The options, 2 to 5, in the order to show them. */
  options: readonly string[]
  /** The right option's position in `options`. */
  answer: number
  /** The option tapped, or null while the question is open. Once it's set, the card shows the result. */
  picked: number | null
  /** Called with an option's position when it's tapped. Only while the question is open. */
  onPick: (index: number) => void
}

/** What the card says after a tap: "Right!", or which option was the answer. */
export function resultText(options: readonly string[], answer: number, picked: number): string {
  return picked === answer ? 'Right!' : `Not quite: it's ${options[answer]}.`
}

/** How an option looks: before a tap, an outline; after it, green for the answer, red for a wrong pick, faded otherwise. */
function look(index: number, answer: number, picked: number | null) {
  if (picked === null) return { variant: 'outline' as const, icon: null, faded: false }
  if (index === answer) return { variant: 'success' as const, icon: Check, faded: false }
  if (index === picked) return { variant: 'destructive' as const, icon: X, faded: false }
  return { variant: 'outline' as const, icon: null, faded: true }
}

/**
 * A question, its options, and the result once one is tapped (standard §6, ADR 0015). For any multiple-choice game:
 * Trivia Night, a true-or-false quiz, a this-or-that drill. It knows nothing about scoring: the view reports the tap,
 * and the machine decides what it's worth.
 *
 * The question takes about two thirds of the height it's given and the options the rest, one per row. Options never
 * shrink below 44px; when five don't fit in a third (a small phone), the question gives up space instead. Give it a
 * parent with a fixed height, like the play screen.
 */
export function MultipleChoice({ label = 'Question', question, options, answer, picked, onPick }: MultipleChoiceProps) {
  const answered = picked !== null
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* 13 : 7 is about 65 : 35. Basis 0 shares the height by those numbers; the options' min-height (their content)
          wins when they need more. data-feature: the theme's decorations go on this card (ADR 0011). */}
      <div
        data-feature
        className="flex min-h-0 flex-[13_1_0%] flex-col items-center justify-center gap-2 overflow-y-auto rounded-xl bg-card p-4 text-center text-card-foreground shadow-sm"
      >
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <h2 className="font-heading text-2xl leading-tight font-bold text-balance break-words">{question}</h2>
        <p className="min-h-6 font-semibold" aria-live="polite">
          {answered && resultText(options, answer, picked)}
        </p>
      </div>
      <ul aria-label="Options" className="flex flex-[7_0_0%] flex-col gap-2">
        {options.map((option, index) => {
          const { variant, icon: Icon, faded } = look(index, answer, picked)
          return (
            <li key={index} className="flex min-h-11 flex-1">
              <Button
                variant={variant}
                // Not `disabled`: that would fade the result too. A tap after the result does nothing.
                aria-disabled={answered}
                className={cn('h-auto min-h-11 w-full justify-between gap-2 px-4 py-2 text-left leading-tight', faded && 'opacity-50')}
                onClick={() => !answered && onPick(index)}
              >
                <span className="min-w-0 break-words">{option}</span>
                {Icon && <Icon aria-label={index === answer ? 'The answer' : 'Your pick'} className="size-5 shrink-0" />}
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
