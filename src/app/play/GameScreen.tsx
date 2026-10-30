import { X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import type { TeamTurnsConfig } from '../../sdk/formats/team-turns/config'
import type { TeamTurnsContext } from '../../sdk/formats/team-turns/rules'
import type { TeamTurnsInput, TeamTurnsPhase } from '../../sdk/formats/team-turns/teamTurns'
import type { TeamTurnsView } from '../../sdk/formats/team-turns/views'
import type { Game } from '../../sdk/game/defineGame'
import { useGameSession, type SessionOptions } from '../../sdk/game/useGameSession'
import type { MachineEvent, MachineState } from '../../sdk/machine/types'
import { Button } from '../../ui/button'
import { Dialog } from '../../ui/dialog'
import { useWakeLock } from './useWakeLock'

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
  /** The game to play: new, or saved (ADR 0006). */
  initial: MachineState<TeamTurnsContext<Item, Turn, Config>, TeamTurnsPhase | Phase>
  /** The settings and items, for "Play again". */
  input: TeamTurnsInput<Item, Config>
  /** `onChange` to save each change; a fixed clock for tests. */
  options?: SessionOptions<MachineState<TeamTurnsContext<Item, Turn, Config>, TeamTurnsPhase | Phase>>
  /** Players confirmed they want to quit: delete the save and leave. */
  onQuit: () => void
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
>({ game, initial, input, options, onQuit }: GameScreenProps<Item, Config, Setup, Turn, Event, Phase, GuardName, ActionName>) {
  const { state, send, restart, ended } = useGameSession(game.machine, initial, options)
  // Declared as a plain view type: React's JSX typing can't see through a lookup by a still-generic phase name.
  const View: TeamTurnsView<Item, Turn, Event, Config> = game.views[state.phase]
  const [quitting, setQuitting] = useState(false)
  // The screen stays on for the whole game: handoffs and summaries included, when nobody touches the phone either.
  useWakeLock()

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      {/* Quit asks first: one stray tap mustn't end a game. Not on the results, which have their own buttons. */}
      {!ended && (
        <div className="flex px-2 pt-2">
          <Button variant="ghost" onClick={() => setQuitting(true)}>
            <X aria-hidden className="size-5" />
            Quit
          </Button>
        </div>
      )}
      <Dialog open={quitting} onClose={() => setQuitting(false)} title="Quit this game?" description="The scores will be lost.">
        <Button variant="destructive" onClick={onQuit}>
          Quit game
        </Button>
        <Button variant="outline" onClick={() => setQuitting(false)}>
          Keep playing
        </Button>
      </Dialog>
      <View context={state.context} send={send} points={game.machine.points} />
      {/* After the game: the app's own buttons, not the game's. They leave the game rather than send it events. */}
      {ended && (
        <nav aria-label="After the game" className="flex flex-col gap-3 p-6">
          <Button size="lg" onClick={() => restart(input)}>
            Play again
          </Button>
          <Link
            to="/"
            className="flex h-12 items-center justify-center rounded-lg font-semibold text-foreground focus-visible:outline-3 focus-visible:outline-offset-2"
          >
            Back to games
          </Link>
        </nav>
      )}
    </main>
  )
}
