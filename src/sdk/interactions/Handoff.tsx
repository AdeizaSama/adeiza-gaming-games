import { Button } from '../../ui/button'

export interface HandoffProps {
  /** Who gets the phone next, e.g. a team name. */
  to: string
  /** A line of context under the name, e.g. "Round 2 of 3". */
  detail?: string
  /** The button's label. */
  actionLabel?: string
  /** Called when the new holder is ready. */
  onReady: () => void
}

/**
 * "Pass the phone to Lions." A privacy gate between turns (standard §5): it shows nothing from the last turn,
 * so the next team can't see the previous team's cards while the phone changes hands.
 */
export function Handoff({ to, detail, actionLabel = 'Start', onReady }: HandoffProps) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-10 p-6 text-center">
      <div className="flex flex-col gap-3">
        <p className="text-lg text-muted-foreground">Pass the phone to</p>
        <h2 className="text-5xl font-bold text-balance">{to}</h2>
        {detail && <p className="text-lg text-muted-foreground">{detail}</p>}
      </div>
      <Button size="lg" className="w-full max-w-xs" onClick={onReady}>
        {actionLabel}
      </Button>
    </section>
  )
}
