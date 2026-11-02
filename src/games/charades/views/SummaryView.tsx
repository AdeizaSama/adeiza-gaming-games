import { Summary } from '../../../sdk/interactions/Summary'
import { nextLabel, type TeamTurnsViewProps } from '../../../sdk/formats/team-turns/views'
import type { CharadesConfig } from '../config'
import { resultOf, type CharadesEvent, type CharadesTurn } from '../machine'
import type { CharadesItem } from '../schema'

/** Replaces the format's turn summary (ADR 0005) to list the items the team got and skipped. */
export function SummaryView({ context, send, points }: TeamTurnsViewProps<CharadesItem, CharadesTurn, CharadesEvent, CharadesConfig>) {
  return (
    <Summary
      title={context.config.teams[context.current]}
      points={points(context.turn, context.config)}
      sections={[
        { label: 'Got it', items: context.turn.entries.filter((entry) => resultOf(entry) === 'got').map((entry) => entry.item.text) },
        { label: 'Skipped', items: context.turn.entries.filter((entry) => resultOf(entry) === 'skipped').map((entry) => entry.item.text) },
      ]}
      actionLabel={nextLabel(context)}
      onNext={() => send({ type: 'next' })}
    />
  )
}
