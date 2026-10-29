import { Summary } from '../../../sdk/interactions/Summary'
import { nextLabel, type TeamTurnsViewProps } from '../../../sdk/formats/team-turns/views'
import type { CharadesEvent, CharadesTurn } from '../machine'
import type { CharadesItem } from '../schema'

/** Replaces the format's turn summary (ADR 0005) to list the items the team got and skipped. */
export function SummaryView({ context, send, points }: TeamTurnsViewProps<CharadesItem, CharadesTurn, CharadesEvent>) {
  return (
    <Summary
      title={context.config.teams[context.current]}
      points={points(context.turn)}
      sections={[
        { label: 'Got it', items: context.turn.got.map((item) => item.text) },
        { label: 'Skipped', items: context.turn.skipped.map((item) => item.text) },
      ]}
      actionLabel={nextLabel(context)}
      onNext={() => send({ type: 'next' })}
    />
  )
}
