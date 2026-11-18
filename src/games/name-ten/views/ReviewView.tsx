import type { TeamTurnsViewProps } from '../../../sdk/formats/team-turns/views'
import { Review, type ReviewRow } from '../../../sdk/interactions/Review'
import type { NameTenConfig } from '../config'
import type { NameTenEvent, NameTenTurn } from '../machine'
import type { NameTenItem } from '../schema'

/** The board as review rows: each answer, got or missed. */
export function reviewRows(turn: NameTenTurn): ReviewRow[] {
  return turn.board.map((text, index) => (turn.got[index] ? { text, result: 'Got it', tone: 'good' } : { text, result: 'Missed', tone: 'none' }))
}

/** Name Ten's review (ADR 0007, 0012): the board, locked until the host taps Adjust, then a tap counts or uncounts an answer. */
export function ReviewView({ context, send }: TeamTurnsViewProps<NameTenItem, NameTenTurn, NameTenEvent, NameTenConfig>) {
  return (
    <Review
      title={context.config.teams[context.current]}
      noun={{ one: 'answer', many: 'answers' }}
      rows={reviewRows(context.turn)}
      onToggle={(index) => send({ type: 'toggle', index })}
      onDone={() => send({ type: 'done' })}
    />
  )
}
