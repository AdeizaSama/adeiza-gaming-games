import type { Rng } from '../../sdk/rng'
import { teamTurns } from '../../sdk/formats/team-turns/teamTurns'
import type { NameTenConfig } from './config'
import type { NameTenItem } from './schema'

/**
 * One turn: the answers dealt onto the judge's board, and which of them the team got (ADR 0012). `got[i]` is for
 * `board[i]`. Ticks are toggled during the turn and corrected in review; both are the same event.
 */
export interface NameTenTurn {
  board: string[]
  got: boolean[]
}

/**
 * Sent by the views: the judge ticks or unticks the answer at `index` (during the turn, or after Adjust in review),
 * ends the turn early, or finishes review.
 */
export type NameTenEvent = { type: 'toggle'; index: number } | { type: 'lock_in' } | { type: 'done' }

/** `count` of the answers in a random order, using the machine's random numbers so a saved game deals the same board. */
export function deal(answers: readonly string[], count: number, rng: Rng): string[] {
  const shuffled = [...answers]
  // Fisher–Yates: each answer is equally likely to end up in each place.
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = rng.int(0, i)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, count)
}

/**
 * Name Ten on the team-turns format (ADR 0004, 0012). The format runs the handoff, timer, category pool, turn summary,
 * scores and results; this is the turn and its review.
 *
 * - When a turn starts, the format draws a category and `dealBoard` puts `shown` of its answers on the board.
 * - In the turn, `toggle` ticks an answer the team said. `lock_in` (the judge ends early) and `time_up` go to review.
 * - In review, `toggle` corrects a tick and `done` moves on to the turn summary (ADR 0007).
 * - A turn is worth one point per answer got.
 */
export const machine = teamTurns<NameTenItem, NameTenTurn, NameTenEvent, NameTenConfig>()({
  newTurn: () => ({ board: [], got: [] }),
  points: (turn) => turn.got.filter(Boolean).length,
  onStart: ['dealBoard'],
  phases: {
    turn: {
      interaction: 'prompt_card',
      on: {
        toggle: { when: 'isAnswer', actions: ['toggleAnswer'] },
        lock_in: { to: 'review' },
        time_up: { to: 'review' },
      },
    },
    review: {
      interaction: 'review',
      on: {
        toggle: { when: 'isAnswer', actions: ['toggleAnswer'] },
        done: { to: 'turn_summary' },
      },
    },
  },
  guards: {
    /** True when a `toggle` names an answer on the board. Events come from views, so the index is checked. */
    isAnswer: ({ context, event }) => event.type === 'toggle' && Number.isInteger(event.index) && event.index >= 0 && event.index < context.turn.board.length,
  },
  actions: {
    /** Deals `shown` of the category's answers onto the board (all of them if it has fewer), none ticked. */
    dealBoard: ({ context, rng }) => {
      const board = deal(context.item!.answers, context.config.shown, rng)
      return { ...context, turn: { board, got: board.map(() => false) } }
    },
    /** Ticks or unticks the answer named by `toggle`. */
    toggleAnswer: ({ context, event }) => {
      if (event.type !== 'toggle') return context
      const got = context.turn.got.map((on, index) => (index === event.index ? !on : on))
      return { ...context, turn: { ...context.turn, got } }
    },
  },
})
