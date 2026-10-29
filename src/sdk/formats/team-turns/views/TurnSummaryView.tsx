import type { MachineEvent } from '../../../machine/types'
import { Summary } from '../../../interactions/Summary'
import type { TeamTurnsConfig } from '../config'
import { teamTurnsGuards } from '../rules'
import type { TeamTurnsViewProps } from './types'

/**
 * The format's default `turn_summary` view: who played and what they scored. A game that can say more (which items
 * were got, say) replaces it with its own (ADR 0005).
 */
export function TurnSummaryView<Item, Turn, Event extends MachineEvent, Config extends TeamTurnsConfig>({
  context,
  send,
  points,
}: TeamTurnsViewProps<Item, Turn, Event, Config>) {
  return (
    <Summary
      title={context.config.teams[context.current]}
      points={points(context.turn)}
      actionLabel={nextLabel(context)}
      onNext={() => send({ type: 'next' })}
    />
  )
}

/**
 * "Next", or "See results" after the last turn. Uses the format's own `turnsRemaining` guard, so the label always
 * matches where `next` will go. Exported for games' own summary views.
 */
export function nextLabel(context: Parameters<typeof teamTurnsGuards.turnsRemaining>[0]['context']): string {
  return teamTurnsGuards.turnsRemaining({ context, event: { type: 'next' } }) ? 'Next' : 'See results'
}
