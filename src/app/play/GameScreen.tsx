import type { TeamTurnsConfig } from '../../sdk/formats/team-turns/config'
import type { TeamTurnsInput } from '../../sdk/formats/team-turns/teamTurns'
import type { TeamTurnsView } from '../../sdk/formats/team-turns/views'
import type { Game } from '../../sdk/game/defineGame'
import { useGameSession, type SessionOptions } from '../../sdk/game/useGameSession'
import type { MachineEvent } from '../../sdk/machine/types'

export interface GameScreenProps<
  Item,
  Config extends TeamTurnsConfig,
  Setup,
  Turn,
  Event extends MachineEvent,
  Phase extends string,
  GuardName extends string,
  ActionName extends string,
> {
  game: Game<Item, Config, Setup, Turn, Event, Phase, GuardName, ActionName>
  /** The settings and items for this game (from the setup screen). */
  input: TeamTurnsInput<Item, Config>
  /** For tests: a fixed seed and clock. */
  options?: SessionOptions
}

/**
 * Plays a game: keeps its session, and draws the view for the phase it's in (ADR 0005). Knows nothing about any
 * particular game or phase.
 */
export function GameScreen<
  Item,
  Config extends TeamTurnsConfig,
  Setup,
  Turn,
  Event extends MachineEvent,
  Phase extends string,
  GuardName extends string,
  ActionName extends string,
>({ game, input, options }: GameScreenProps<Item, Config, Setup, Turn, Event, Phase, GuardName, ActionName>) {
  const { state, send } = useGameSession(game.machine, input, options)
  // Declared as a plain view type: React's JSX typing can't see through a lookup by a still-generic phase name.
  const View: TeamTurnsView<Item, Turn, Event, Config> = game.views[state.phase]

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md">
      <View context={state.context} send={send} points={game.machine.points} />
    </main>
  )
}
