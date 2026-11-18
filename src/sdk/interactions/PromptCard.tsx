import { Check } from 'lucide-react'
import { Button } from '../../ui/button'

export interface PromptAnswer {
  text: string
  /** Ticked: the team said it. */
  on: boolean
}

export interface PromptCardProps {
  /** What the prompt is, e.g. "Category". */
  label?: string
  /** The prompt read out to players, e.g. "Things Found in a School Bag". */
  prompt: string
  /** The answers to tick off, in board order. */
  answers: PromptAnswer[]
  /** Called with an answer's position when it's tapped. */
  onToggle: (index: number) => void
}

/**
 * A prompt, a running count, and a board of answers that tick on and off when tapped (standard §6, ADR 0012). For
 * whoever is checking what the players say: Name Ten's judge, for one. It knows nothing about scoring: the view
 * reports taps, and the machine decides what they're worth.
 *
 * It fills the height it's given (ADR 0013): the board is two columns of tiles sharing the space left under the
 * prompt, each at least 44px tall, so ten answers fit on a phone without scrolling. Give it a parent with a fixed
 * height, like the play screen.
 */
export function PromptCard({ label = 'Category', prompt, answers, onToggle }: PromptCardProps) {
  const got = answers.filter((answer) => answer.on).length
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* data-feature: the theme's decorations go on this card (ADR 0011). */}
      <div data-feature className="flex flex-col items-center gap-1 rounded-xl bg-card p-3 text-center text-card-foreground shadow-sm">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <h2 className="text-2xl leading-tight font-bold text-balance break-words">{prompt}</h2>
        <p className="font-semibold tabular-nums" aria-live="polite">
          {got} of {answers.length}
        </p>
      </div>
      {/* Rows share the height left, but never shrink below 44px; only then does the board scroll. */}
      <ul aria-label="Answers" className="grid min-h-0 flex-1 auto-rows-[minmax(2.75rem,1fr)] grid-cols-2 gap-2 overflow-y-auto">
        {answers.map((answer, index) => (
          <li key={index} className="flex">
            <Button
              variant={answer.on ? 'success' : 'outline'}
              aria-pressed={answer.on}
              className="h-full w-full justify-between gap-1 px-3 text-left leading-tight"
              onClick={() => onToggle(index)}
            >
              <span className="min-w-0 break-words">{answer.text}</span>
              {answer.on && <Check aria-hidden className="size-4 shrink-0" />}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
