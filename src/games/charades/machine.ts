import { teamTurns } from '../../sdk/formats/team-turns/teamTurns'
import type { CharadesItem } from './schema'

/** What happened in one turn, so the turn summary can show it. */
export interface CharadesTurn {
  got: CharadesItem[]
  skipped: CharadesItem[]
}

/** Sent by the turn's view: the team guessed the item on screen, or passed on it. */
export type CharadesEvent = { type: 'got' } | { type: 'skip' }

/**
 * Core Charades on the team-turns format (ADR 0004). The format runs the handoff, timer, item pool, turn summary,
 * scores and results; this is the turn.
 *
 * - `got`: one point, and the next item.
 * - `skip`: the next item, no penalty.
 * - `time_up`: the turn ends. The item on screen when time runs out isn't counted either way.
 *
 * Every item is played as "describe" for now: modes, double points for acting or singing, and a skip penalty
 * come in chapter 05.
 */
export const machine = teamTurns<CharadesItem, CharadesTurn, CharadesEvent>()({
  newTurn: () => ({ got: [], skipped: [] }),
  points: (turn) => turn.got.length,
  phases: {
    turn: {
      interaction: 'flash_card',
      on: {
        got: { actions: ['markGot', 'drawItem'] },
        skip: { actions: ['markSkipped', 'drawItem'] },
        time_up: { to: 'turn_summary' },
      },
    },
  },
  guards: {},
  actions: {
    /** Records the item on screen as guessed. */
    markGot: ({ context }) => ({
      ...context,
      turn: { ...context.turn, got: [...context.turn.got, context.item!] },
    }),
    /** Records the item on screen as skipped. */
    markSkipped: ({ context }) => ({
      ...context,
      turn: { ...context.turn, skipped: [...context.turn.skipped, context.item!] },
    }),
  },
})
