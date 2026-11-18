import { Button } from '../../ui/button'
import { cn } from '../../ui/cn'
import { useSettled } from './useSettled'

export interface SummarySection {
  /** e.g. "Got it" or "Skipped". */
  label: string
  items: string[]
}

/** One team's place in the game so far (ADR 0013). */
export interface Standing {
  name: string
  /** Points so far, this turn included. */
  score: number
  /** Rounds this team has played, out of `of`. */
  played: number
  of: number
  /** The team that just played. */
  current?: boolean
}

export interface SummaryProps {
  /** Whose turn it was, e.g. a team name. */
  title: string
  /** What the turn scored. */
  points: number
  /** Lists of what happened, e.g. the items got and skipped. Empty lists are left out. */
  sections?: SummarySection[]
  /** Every team so far, in playing order (ADR 0013). */
  standings?: Standing[]
  actionLabel?: string
  onNext: () => void
}

/**
 * The end of a turn: who played, what they scored, and what happened (standard §6). Read-only: mis-taps are fixed
 * before it, on the review screen (`Review`, ADR 0007).
 *
 * Its button is off for a moment after the screen appears (ADR 0016): it can come up when time runs out, under a
 * finger aimed at the turn.
 */
export function Summary({ title, points, sections = [], standings = [], actionLabel = 'Next', onNext }: SummaryProps) {
  const shown = sections.filter((section) => section.items.length > 0)
  const settled = useSettled()
  return (
    <section className="flex flex-1 flex-col gap-8 p-6">
      <header className="flex flex-col items-center gap-2 pt-8 text-center">
        <h2 className="text-4xl font-bold text-balance">{title}</h2>
        <p className="text-2xl text-muted-foreground">
          scored <span className="font-bold text-primary">{points}</span> {points === 1 ? 'point' : 'points'}
        </p>
      </header>
      {standings.length > 0 && (
        <ul aria-label="Scores so far" className="flex flex-col gap-2">
          {standings.map((team) => (
            <li
              key={team.name}
              aria-current={team.current || undefined}
              className={cn('flex items-center gap-4 rounded-md px-3 py-2', team.current && 'bg-secondary text-secondary-foreground')}
            >
              <span className={cn('min-w-0 flex-1 break-words', team.current && 'font-semibold')}>{team.name}</span>
              <span className="text-xl font-bold tabular-nums">{team.score}</span>
              <span role="img" aria-label={`${team.played} of ${team.of} rounds played`} className="flex gap-1">
                {Array.from({ length: team.of }, (_, round) => (
                  <span
                    key={round}
                    className={cn('size-2.5 rounded-full border-line border-current', round < team.played ? 'bg-current' : 'opacity-50')}
                  />
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-1 flex-col gap-6">
        {shown.map((section) => (
          <div key={section.label} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              {section.label} ({section.items.length})
            </h3>
            <ul aria-label={section.label} className="flex flex-wrap gap-2">
              {section.items.map((item, index) => (
                <li key={index} className="rounded-md bg-secondary px-3 py-1 text-secondary-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Button size="lg" className="w-full" disabled={!settled} onClick={onNext}>
        {actionLabel}
      </Button>
    </section>
  )
}
