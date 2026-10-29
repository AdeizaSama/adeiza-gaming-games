import type { MachineEvent } from '../../../machine/types'
import { Leaderboard, rank } from '../../../interactions/Leaderboard'
import type { TeamTurnsConfig } from '../config'
import type { TeamTurnsViewProps } from './types'

/** The format's default `results` view: who won, and the standings. */
export function ResultsView<Item, Turn, Event extends MachineEvent, Config extends TeamTurnsConfig>({
  context,
}: TeamTurnsViewProps<Item, Turn, Event, Config>) {
  const entries = context.config.teams.map((name, team) => ({ name, score: context.scores[team] }))
  const winners = rank(entries).filter((entry) => entry.place === 1)
  const headline = winners.length === 1 ? `${winners[0].name} won!` : "It's a tie!"

  return (
    <section className="flex flex-col items-center gap-8 p-6 pt-12">
      <h2 className="text-center text-5xl font-bold text-balance">{headline}</h2>
      <Leaderboard entries={entries} />
    </section>
  )
}
