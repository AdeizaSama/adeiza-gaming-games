import { teamTurns } from '../../sdk/formats/team-turns/teamTurns'
import type { CharadesConfig } from './config'
import type { CharadesItem, CharadesMode } from './schema'

/** One card played in a turn: what it was, how it was clued, and what the team did with it. */
export interface CharadesEntry {
  item: CharadesItem
  mode: CharadesMode
  result: 'got' | 'skipped'
}

/** What happened in one turn, in order, so it can be reviewed and scored (ADR 0007). */
export interface CharadesTurn {
  entries: CharadesEntry[]
  /** How the card on screen is to be clued. */
  mode: CharadesMode
}

/** Sent by the turn's view: the team guessed the item on screen, or passed on it. */
export type CharadesEvent = { type: 'got' } | { type: 'skip' }

/** What one card is worth: its mode's points if got, minus the skip cost if skipped. */
export function entryPoints(entry: CharadesEntry, points: CharadesConfig['points']): number {
  return entry.result === 'got' ? points[entry.mode] : -points.skip
}

/** Adds the card on screen to the turn's log with a result. */
const record = (turn: CharadesTurn, item: CharadesItem, result: CharadesEntry['result']): CharadesTurn => ({
  ...turn,
  entries: [...turn.entries, { item, mode: turn.mode, result }],
})

/**
 * Charades on the team-turns format (ADR 0004). The format runs the handoff, timer, item pool, turn summary,
 * scores and results; this is the turn.
 *
 * - Every card gets a mode when it's drawn (`pickMode`): always describe, or in Mix it up one of the item's modes.
 * - `got` and `skip` log the card and draw the next. `time_up` ends the turn; the card on screen isn't logged.
 * - A turn is worth the sum of its cards (ADR 0007), never less than 0.
 */
export const machine = teamTurns<CharadesItem, CharadesTurn, CharadesEvent, CharadesConfig>()({
  newTurn: () => ({ entries: [], mode: 'describe' }),
  points: (turn, config) => Math.max(0, turn.entries.reduce((sum, entry) => sum + entryPoints(entry, config.points), 0)),
  onStart: ['pickMode'],
  phases: {
    turn: {
      interaction: 'flash_card',
      on: {
        got: { actions: ['markGot', 'drawItem', 'pickMode'] },
        skip: { actions: ['markSkipped', 'drawItem', 'pickMode'] },
        time_up: { to: 'turn_summary' },
      },
    },
  },
  guards: {},
  actions: {
    /** Chooses how the card on screen is clued: describe, or in Mix it up a random one of the item's modes. */
    pickMode: ({ context, rng }) => {
      const modes = context.item!.modes
      const mode = context.config.mode === 'mix' ? modes[rng.int(0, modes.length - 1)] : 'describe'
      return { ...context, turn: { ...context.turn, mode } }
    },
    /** Logs the card on screen as guessed. */
    markGot: ({ context }) => ({ ...context, turn: record(context.turn, context.item!, 'got') }),
    /** Logs the card on screen as skipped. */
    markSkipped: ({ context }) => ({ ...context, turn: record(context.turn, context.item!, 'skipped') }),
  },
})
