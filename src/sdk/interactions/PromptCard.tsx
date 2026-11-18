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
 */
export function PromptCard({ label = 'Category', prompt, answers, onToggle }: PromptCardProps) {
  const got = answers.filter((answer) => answer.on).length
  return (
    <div className="flex flex-col gap-4">
      {/* data-feature: the theme's decorations go on this card (ADR 0011). */}
      <div data-feature className="flex flex-col items-center gap-2 rounded-xl bg-card p-5 text-center text-card-foreground shadow-sm">
        <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <h2 className="text-3xl leading-tight font-bold text-balance break-words">{prompt}</h2>
        <p className="text-lg font-semibold tabular-nums" aria-live="polite">
          {got} of {answers.length}
        </p>
      </div>
      <ul aria-label="Answers" className="flex flex-col gap-2">
        {answers.map((answer, index) => (
          <li key={index}>
            <Button
              variant={answer.on ? 'success' : 'outline'}
              aria-pressed={answer.on}
              className="w-full justify-between text-left"
              onClick={() => onToggle(index)}
            >
              <span className="min-w-0 break-words">{answer.text}</span>
              {answer.on && <Check aria-hidden className="size-5 shrink-0" />}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
