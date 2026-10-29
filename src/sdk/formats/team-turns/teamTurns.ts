import type { Action, Guard, MachineDefinition, MachineEvent, Transitions } from '../../machine/types'
import type { Rng } from '../../rng'
import type { TeamTurnsConfig } from './config'
import { newPool } from './pool'
import { teamTurnsActions, teamTurnsGuards, type TeamTurnsContext, type TurnRecord } from './rules'

/** The format's own phases. A game can't write a phase with one of these names. */
export type TeamTurnsPhase = 'handoff' | 'turn_summary' | 'results'

/** The format's own events. A game lists only its own; `teamTurns` adds these. */
export type TeamTurnsEvent = { type: 'start' } | { type: 'time_up' } | { type: 'next' }

/** What a team-turns game is started with: the settings, and the items picked with `choosePoolItems`. */
export interface TeamTurnsInput<Item, Config extends TeamTurnsConfig = TeamTurnsConfig> {
  config: Config
  items: Item[]
}

type FormatGuardName = keyof typeof teamTurnsGuards
type FormatActionName = keyof ReturnType<typeof teamTurnsActions>

/** Names a game can't use, because the format already does. `?: never` makes writing one a type error. */
type Taken<Name extends string> = { [Key in Name]?: never }

/**
 * One of a game's phases. Unlike `PhaseDefinition`, it can't be final (only the format ends the game), and its
 * transitions can only go to the game's own phases or to `turn_summary`, so a game can't skip the format's loop.
 */
export interface GamePhase<
  Event extends MachineEvent,
  Phase extends string,
  GuardName extends string,
  ActionName extends string,
> {
  /** Which interaction primitive shows this phase (standard §6), e.g. `'flash_card'`. */
  interaction: string
  /** The events this phase responds to: the game's own, and the format's (`time_up`, …). */
  on?: { [Type in Event['type']]?: Transitions<Phase | 'turn_summary', GuardName, ActionName> }
}

/** What a game passes to `teamTurns`: its turn (ADR 0004). */
export interface TeamTurnsGame<
  Item,
  Turn,
  Event extends MachineEvent,
  Config extends TeamTurnsConfig,
  Phase extends string,
  GuardName extends string,
  ActionName extends string,
> extends TurnRecord<Turn> {
  /** The game's phases. Must include `turn`, which the format's `handoff` starts. */
  phases: Record<Phase, GamePhase<Event | TeamTurnsEvent, Phase, FormatGuardName | GuardName, FormatActionName | ActionName>> &
    { turn: unknown } &
    Taken<TeamTurnsPhase>
  guards: Record<GuardName, Guard<TeamTurnsContext<Item, Turn, Config>, Event | TeamTurnsEvent>> & Taken<FormatGuardName>
  actions: Record<ActionName, Action<TeamTurnsContext<Item, Turn, Config>, Event | TeamTurnsEvent>> & Taken<FormatActionName>
}

/** The machine `teamTurns` returns: an ordinary machine, so `start`, `send` and `validateMachine` work as usual. */
export type TeamTurnsMachine<
  Item,
  Turn,
  Event extends MachineEvent,
  Config extends TeamTurnsConfig,
  Phase extends string,
  GuardName extends string,
  ActionName extends string,
> = MachineDefinition<
  TeamTurnsContext<Item, Turn, Config>,
  Event | TeamTurnsEvent,
  TeamTurnsInput<Item, Config>,
  TeamTurnsPhase | Phase,
  FormatGuardName | GuardName,
  FormatActionName | ActionName
>

/**
 * The format's loop. `start` begins a turn: a fresh turn record, the timer, the first item. `next` on the turn
 * summary adds the turn's points to the team's score, then moves to the next team's handoff, or to the results
 * after the last turn. The game's phases go between `handoff` and `turn_summary`.
 */
const formatPhases = {
  handoff: {
    interaction: 'handoff',
    on: { start: { to: 'turn', actions: ['startTurn', 'drawItem'] } },
  },
  turn_summary: {
    interaction: 'summary',
    on: {
      next: [
        { when: 'turnsRemaining', to: 'handoff', actions: ['bankPoints', 'advanceTeam'] },
        { to: 'results', actions: ['bankPoints'] },
      ],
    },
  },
  results: { interaction: 'leaderboard', final: true },
} as const

/**
 * Builds a team-turns game's machine from its turn (ADR 0004). The game writes what happens inside a turn; the
 * format adds the handoff, timer, item pool, scores, turn summary, the move to the next team, and the results.
 *
 *   export const machine = teamTurns<CharadesItem, CharadesTurn, CharadesEvent>()({
 *     newTurn: () => ({ got: [], skipped: [] }),
 *     points: (turn) => turn.got.length,
 *     phases: { turn: { interaction: 'flash_card', on: { got: …, skip: …, time_up: { to: 'turn_summary' } } } },
 *     guards: {},
 *     actions: { markGot: …, markSkipped: … },
 *   })
 *
 * Two calls, like `defineMachine`: the first fixes the types you write (item, turn record, your events, and your
 * settings if you extend `TeamTurnsConfig`); the second works out your phase, guard and action names.
 */
export function teamTurns<Item, Turn, Event extends MachineEvent, Config extends TeamTurnsConfig = TeamTurnsConfig>() {
  return <Phase extends string, GuardName extends string = never, ActionName extends string = never>(
    game: TeamTurnsGame<Item, Turn, Event, Config, Phase, GuardName, ActionName>,
  ): TeamTurnsMachine<Item, Turn, Event, Config, Phase, GuardName, ActionName> => {
    const machine = {
      initial: 'handoff',
      context: ({ input, rng }: { input: TeamTurnsInput<Item, Config>; rng: Rng }) => {
        if (input.items.length === 0) throw new Error('A team-turns game needs at least one item')
        return {
          config: input.config,
          scores: input.config.teams.map(() => 0),
          current: 0,
          round: 1,
          turnEndsAt: null,
          pool: newPool(input.items, rng),
          item: null,
          turn: game.newTurn(),
        }
      },
      // The format's phases go last, so even untyped code can't replace them.
      phases: { ...game.phases, ...formatPhases },
      guards: { ...game.guards, ...teamTurnsGuards },
      actions: { ...game.actions, ...teamTurnsActions<Item, Turn, Config>(game) },
    }

    // The one unchecked step. TypeScript can't check the format's phases against the game's events while those are
    // still a type parameter (it doesn't know yet that `start` and `next` are among them), so the result is declared
    // here. The parts are checked: the game's by `TeamTurnsGame` above, the format's by its tests.
    return machine as unknown as TeamTurnsMachine<Item, Turn, Event, Config, Phase, GuardName, ActionName>
  }
}
