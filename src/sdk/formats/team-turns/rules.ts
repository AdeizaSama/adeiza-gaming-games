import type { Action, Guard, MachineEvent } from '../../machine/types'
import type { TeamTurnsConfig } from './config'
import { drawFrom, type ItemPool } from './pool'

/**
 * Everything the team-turns format keeps about a game in progress. Plain data, saved with the game.
 *
 * `Turn` is the game's own record of one turn (Charades: which items were got and skipped). The format stores it
 * and starts a fresh one each turn; only the game reads inside it.
 */
export interface TeamTurnsContext<Item, Turn, Config extends TeamTurnsConfig = TeamTurnsConfig> {
  /** The settings chosen at setup, with defaults filled in. */
  config: Config
  /** Each team's score, in the same order as `config.teams`. */
  scores: number[]
  /** Whose turn it is: a position in `config.teams`. */
  current: number
  /** The round being played, starting at 1. */
  round: number
  /** When the current turn ends, in milliseconds. The view counts down to it and sends `time_up`. */
  turnEndsAt: number | null
  pool: ItemPool<Item>
  /** The item on screen, or null before the first draw. */
  item: Item | null
  turn: Turn
}

/** What the format needs from a game to run its guards and actions. */
export interface TurnRecord<Turn> {
  /** A fresh, empty record for a new turn. */
  newTurn: () => Turn
  /** How many points a turn's record is worth. */
  points: (turn: Turn) => number
}

type AnyContext = TeamTurnsContext<unknown, unknown>

/** The format's guards. They only read the format's part of the context, so they work for any game. */
export const teamTurnsGuards = {
  /** True until the last team has played its turn in the last round. */
  turnsRemaining: ({ context }) =>
    context.round < context.config.rounds || context.current < context.config.teams.length - 1,
} satisfies Record<string, Guard<AnyContext, MachineEvent>>

/**
 * The format's actions, built for one game: `startTurn` needs the game's `newTurn`, and `bankPoints` its `points`.
 * Each does one thing, so the format's phases (step 6) list them in order.
 */
export function teamTurnsActions<Item, Turn, Config extends TeamTurnsConfig>({ newTurn, points }: TurnRecord<Turn>) {
  type Context = TeamTurnsContext<Item, Turn, Config>

  return {
    /** A fresh turn record, and the timer set to end `config.seconds` from now. */
    startTurn: ({ context, now }) => ({
      ...context,
      turn: newTurn(),
      turnEndsAt: now + context.config.seconds * 1000,
    }),

    /** Puts the next item from the pool on screen. */
    drawItem: ({ context, rng }) => {
      const { item, pool } = drawFrom(context.pool, rng)
      return { ...context, item, pool }
    },

    /** Adds what this turn's record is worth to the current team's score. */
    bankPoints: ({ context }) => ({
      ...context,
      scores: context.scores.map((score, team) => (team === context.current ? score + points(context.turn) : score)),
    }),

    /** Passes play to the next team; after the last team, back to the first for the next round. */
    advanceTeam: ({ context }) => {
      const last = context.current === context.config.teams.length - 1
      return { ...context, current: last ? 0 : context.current + 1, round: last ? context.round + 1 : context.round }
    },
  } satisfies Record<string, Action<Context, MachineEvent>>
}
