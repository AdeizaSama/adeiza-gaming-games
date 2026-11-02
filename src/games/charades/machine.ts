import { teamTurns } from '../../sdk/formats/team-turns/teamTurns'
import type { CharadesConfig } from './config'
import type { CharadesItem, CharadesMode } from './schema'

/**
 * One card played in a turn: what it was, how it was clued, and what happened to it.
 *
 * `played` is what happened during the turn: Got it, Skip, or still on screen when time ran out. `changed` is true
 * when the host corrected it in review; `resultOf` gives the result that counts.
 */
export interface CharadesEntry {
  item: CharadesItem
  mode: CharadesMode
  played: 'got' | 'skipped' | 'time_up'
  changed: boolean
}

/** What happened in one turn, in order, so it can be reviewed and scored (ADR 0007). */
export interface CharadesTurn {
  entries: CharadesEntry[]
  /** How the card on screen is to be clued. */
  mode: CharadesMode
}

/**
 * Sent by the views: in a turn, the team guessed the card on screen or passed on it; in review, the host changed
 * the card at `index`, or finished.
 */
export type CharadesEvent = { type: 'got' } | { type: 'skip' } | { type: 'toggle'; index: number } | { type: 'done' }

/**
 * The result that counts for a card. A correction swaps Got it and Skipped; the card on screen when time ran out
 * is Not counted, and a correction makes it Got it (the team said it as the buzzer went).
 */
export function resultOf(entry: CharadesEntry): 'got' | 'skipped' | 'not_counted' {
  if (!entry.changed) return entry.played === 'time_up' ? 'not_counted' : entry.played
  return entry.played === 'skipped' || entry.played === 'time_up' ? 'got' : 'skipped'
}

/** What one card is worth: its mode's points if got, minus the skip cost if skipped, nothing if not counted. */
export function entryPoints(entry: CharadesEntry, points: CharadesConfig['points']): number {
  const result = resultOf(entry)
  if (result === 'got') return points[entry.mode]
  return result === 'skipped' ? -points.skip : 0
}

/** Adds the card on screen to the turn's log. */
const record = (turn: CharadesTurn, item: CharadesItem, played: CharadesEntry['played']): CharadesTurn => ({
  ...turn,
  entries: [...turn.entries, { item, mode: turn.mode, played, changed: false }],
})

/**
 * Charades on the team-turns format (ADR 0004). The format runs the handoff, timer, item pool, turn summary,
 * scores and results; this is the turn and its review.
 *
 * - Every card gets a mode when it's drawn (`pickMode`): always describe, or in Mix it up one of the item's modes.
 * - `got` and `skip` log the card and draw the next. `time_up` logs the card on screen as not counted, and goes to
 *   review.
 * - In review, `toggle` corrects one card and `done` moves on to the turn summary (ADR 0007).
 * - A turn is worth the sum of its cards, never less than 0.
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
        time_up: { to: 'review', actions: ['markTimeUp'] },
      },
    },
    review: {
      interaction: 'review',
      on: {
        toggle: { when: 'isEntry', actions: ['toggleEntry'] },
        done: { to: 'turn_summary' },
      },
    },
  },
  guards: {
    /** True when a `toggle` names a card that was played this turn. */
    isEntry: ({ context, event }) => event.type === 'toggle' && Number.isInteger(event.index) && event.index >= 0 && event.index < context.turn.entries.length,
  },
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
    /** Logs the card on screen when time ran out, so review can count it if the team got it in time. */
    markTimeUp: ({ context }) => ({ ...context, turn: record(context.turn, context.item!, 'time_up') }),
    /** Corrects the card named by `toggle`; a second correction undoes the first. */
    toggleEntry: ({ context, event }) => {
      if (event.type !== 'toggle') return context
      const entries = context.turn.entries.map((entry, index) => (index === event.index ? { ...entry, changed: !entry.changed } : entry))
      return { ...context, turn: { ...context.turn, entries } }
    },
  },
})
