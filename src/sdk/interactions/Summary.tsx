import { Button } from '../../ui/button'

export interface SummarySection {
  /** e.g. "Got it" or "Skipped". */
  label: string
  items: string[]
}

export interface SummaryProps {
  /** Whose turn it was, e.g. a team name. */
  title: string
  /** What the turn scored. */
  points: number
  /** Lists of what happened, e.g. the items got and skipped. Empty lists are left out. */
  sections?: SummarySection[]
  actionLabel?: string
  onNext: () => void
}

/**
 * The end of a turn: who played, what they scored, and what happened (standard §6). Read-only for now; correcting
 * a mis-tap here comes with the editable turn summary (chapter 06).
 */
export function Summary({ title, points, sections = [], actionLabel = 'Next', onNext }: SummaryProps) {
  const shown = sections.filter((section) => section.items.length > 0)
  return (
    <section className="flex flex-1 flex-col gap-8 p-6">
      <header className="flex flex-col items-center gap-2 pt-8 text-center">
        <h2 className="text-4xl font-bold text-balance">{title}</h2>
        <p className="text-2xl text-muted-foreground">
          scored <span className="font-bold text-primary">{points}</span> {points === 1 ? 'point' : 'points'}
        </p>
      </header>
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
      <Button size="lg" className="w-full" onClick={onNext}>
        {actionLabel}
      </Button>
    </section>
  )
}
