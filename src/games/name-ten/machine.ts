import type { Rng } from '../../sdk/rng'
import { teamTurns } from '../../sdk/formats/team-turns/teamTurns'
import type { NameTenConfig } from './config'
import type { NameTenItem } from './schema'

/** How many categories a team can skip each turn, before its minute starts (ADR 0014). */
export const maxSkips = 3

/**
 * One turn: the answers dealt onto the judge's board, and which of them the team got (ADR 0012). `got[i]` is for
 * `board[i]`. Ticks are toggled during the turn and corrected in review; both are the same event. `skips` counts the
 * categories skipped before the turn started, so a refresh can't give them back.
 */
export interface NameTenTurn {
  board: string[]
  got: boolean[]
  skips: number
}

/**
 * Sent by the views: before the turn, the team plays the category shown or skips it; during the turn the judge ticks
 * or unticks the answer at `index` (also after Adjust in review), or ends the turn early; then finishes review.
 */
export type NameTenEvent =
  | { type: 'play' }
  | { type: 'skip' }
  | { type: 'toggle'; index: number }
  | { type: 'lock_in' }
  | { type: 'done' }

/** `count` of the answers in a random order, using the machine's random numbers so a saved game deals the same board. */
export function deal(answers: readonly string[], count: number, rng: Rng): string[] {
  return rng.shuffle(answers).slice(0, count)
}

/**
 * Name Ten on the team-turns format (ADR 0004, 0012). The format runs the handoff, timer, category pool, turn summary,
 * scores and results; this is the turn and its review.
 *
 * - When a turn starts, the format draws a category and `dealBoard` puts `shown` of its answers on the board. The team
 *   sees the category first (ADR 0014): `play` starts the clock; `skip` draws the next category and deals its board,
 *   up to `maxSkips` times. A skipped category stays drawn, so it doesn't come back.
 * - In the turn, `toggle` ticks an answer the team said. `lock_in` (the judge ends early) and `time_up` go to review.
 * - In review, `toggle` corrects a tick and `done` moves on to the turn summary (ADR 0007).
 * - A turn is worth one point per answer got.
 */
export const machine = teamTurns<NameTenItem, NameTenTurn, NameTenEvent, NameTenConfig>()({
  newTurn: () => ({ board: [], got: [], skips: 0 }),
  points: (turn) => turn.got.filter(Boolean).length,
  onStart: ['dealBoard'],
  beforeTurn: 'category',
  phases: {
    category: {
      interaction: 'flash_card',
      on: {
        play: { to: 'turn', actions: ['startTimer'] },
        skip: { when: 'canSkip', actions: ['drawItem', 'dealBoard', 'countSkip'] },
      },
    },
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
    /** True while the team has skips left this turn. */
    canSkip: ({ context }) => context.turn.skips < maxSkips,
    /** True when a `toggle` names an answer on the board. Events come from views, so the index is checked. */
    isAnswer: ({ context, event }) => event.type === 'toggle' && Number.isInteger(event.index) && event.index >= 0 && event.index < context.turn.board.length,
  },
  actions: {
    /** Deals `shown` of the category's answers onto the board (all of them if it has fewer), none ticked. */
    dealBoard: ({ context, rng }) => {
      const board = deal(context.item!.answers, context.config.shown, rng)
      return { ...context, turn: { ...context.turn, board, got: board.map(() => false) } }
    },
    /** Counts a skipped category. */
    countSkip: ({ context }) => ({ ...context, turn: { ...context.turn, skips: context.turn.skips + 1 } }),
    /** Ticks or unticks the answer named by `toggle`. */
    toggleAnswer: ({ context, event }) => {
      if (event.type !== 'toggle') return context
      const got = context.turn.got.map((on, index) => (index === event.index ? !on : on))
      return { ...context, turn: { ...context.turn, got } }
    },
  },
})
