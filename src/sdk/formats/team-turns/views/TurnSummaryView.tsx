import { useEffect, useEffectEvent } from 'react'
import type { MachineEvent } from '../../../machine/types'
import { Summary, type Standing } from '../../../interactions/Summary'
import type { TeamTurnsConfig } from '../config'
import { teamTurnsGuards } from '../rules'
import type { TeamTurnsViewProps } from './types'

/**
 * The format's default `turn_summary` view: who played and what they scored, then every team's score so far with
 * the rounds it has played (ADR 0013). A game that can say more (which items were got, say) replaces it with its own
 * (ADR 0005).
 *
 * In Free Play (ADR 0019) the game is one turn, so it goes straight on to the results, where the score is.
 */
export function TurnSummaryView<Item, Turn, Event extends MachineEvent, Config extends TeamTurnsConfig>({
  context,
  send,
  points,
}: TeamTurnsViewProps<Item, Turn, Event, Config>) {
  const solo = context.config.solo === true
  const next = useEffectEvent(() => send({ type: 'next' }))
  useEffect(() => {
    if (solo) next()
  }, [solo])
  if (solo) return null
  return (
    <Summary
      title={context.config.teams[context.current]}
      points={points(context.turn, context.config)}
      standings={standingsOf(context, points(context.turn, context.config))}
      actionLabel={nextLabel(context)}
      onNext={() => send({ type: 'next' })}
    />
  )
}

/**
 * Every team's score so far and the rounds it has played, at the end of a turn. The turn just played counts, though
 * the format banks its points only when players leave the summary (ADR 0004): what players see matches the results.
 */
export function standingsOf(
  context: { config: { teams: string[]; rounds: number }; scores: number[]; current: number; round: number },
  turnPoints: number,
): Standing[] {
  const { teams, rounds } = context.config
  return teams.map((name, team) => ({
    name,
    score: context.scores[team] + (team === context.current ? turnPoints : 0),
    // Teams play in order, so this round counts for the team that just played and everyone before it.
    played: context.round - 1 + (team <= context.current ? 1 : 0),
    of: rounds,
    current: team === context.current,
  }))
}

/**
 * "Next", or "See results" after the last turn. Uses the format's own `turnsRemaining` guard, so the label always
 * matches where `next` will go. Exported for games' own summary views.
 */
export function nextLabel(context: Parameters<typeof teamTurnsGuards.turnsRemaining>[0]['context']): string {
  return teamTurnsGuards.turnsRemaining({ context, event: { type: 'next' } }) ? 'Next' : 'See results'
}
