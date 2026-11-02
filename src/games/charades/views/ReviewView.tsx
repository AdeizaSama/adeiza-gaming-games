import { Review, type ReviewRow } from '../../../sdk/interactions/Review'
import type { TeamTurnsViewProps } from '../../../sdk/formats/team-turns/views'
import type { CharadesConfig } from '../config'
import { resultOf, type CharadesEntry, type CharadesEvent, type CharadesTurn } from '../machine'
import type { CharadesItem, CharadesMode } from '../schema'

/** How a card was clued, shown under it in Mix it up. */
const modeLabels: Record<CharadesMode, string> = { describe: 'Described', act: 'Acted', sing: 'Sung' }

/** One card as a review row. A skip that costs nothing reads as neutral, not bad. */
function row(entry: CharadesEntry, config: CharadesConfig): ReviewRow {
  const result = resultOf(entry)
  return {
    text: entry.item.text,
    detail: config.mode === 'mix' ? modeLabels[entry.mode] : undefined,
    result: result === 'got' ? 'Got it' : result === 'skipped' ? 'Skipped' : 'Not counted',
    tone: result === 'got' ? 'good' : result === 'skipped' && config.points.skip > 0 ? 'bad' : 'none',
    changed: entry.changed,
  }
}

/** Charades' review (ADR 0007): every card of the turn, locked until the host taps Adjust. */
export function ReviewView({ context, send }: TeamTurnsViewProps<CharadesItem, CharadesTurn, CharadesEvent, CharadesConfig>) {
  return (
    <Review
      title={context.config.teams[context.current]}
      rows={context.turn.entries.map((entry) => row(entry, context.config))}
      onToggle={(index) => send({ type: 'toggle', index })}
      onDone={() => send({ type: 'done' })}
    />
  )
}
