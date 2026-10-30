import { useCallback, useEffect, useEffectEvent, useState } from 'react'
import { isFinal, send as sendEvent, start } from '../machine/runner'
import type { MachineDefinition, MachineEvent, MachineState } from '../machine/types'

/** A seed for a new game: a random whole number in the Rng's range (0 to 2^32 − 1). */
function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32)
}

/**
 * A new game: the machine's first state, from the players' input and a random seed.
 *
 *   const game = newGame(charades.machine, { config, items })
 *
 * This and `restart` are the only places a seed is picked (standard §4). Tests pass a fixed `seed` to get the same
 * game every time.
 */
export function newGame<
  Context,
  Event extends MachineEvent,
  Input,
  Phase extends string,
  GuardName extends string,
  ActionName extends string,
>(
  machine: MachineDefinition<Context, Event, Input, Phase, GuardName, ActionName>,
  input: Input,
  seed: number = randomSeed(),
): MachineState<Context, Phase> {
  return start(machine, { input, seed })
}

export interface SessionOptions<State> {
  /** The clock. Default: `Date.now`. Tests pass a fixed one. */
  now?: () => number
  /** Called with the new state after every change (an event that changed it, or `restart`). Used to save the game. */
  onChange?: (state: State) => void
}

/**
 * Plays a game inside React: holds its state, and re-renders when it changes.
 *
 *   const { state, send, restart, ended } = useGameSession(game.machine, savedOrNewState, { onChange: save })
 *
 * It plays whatever state it's given: a new game from `newGame`, or a saved one (ADR 0006). It passes the current
 * time with each event, so guards and actions never read the clock (standard §4). It doesn't save anything itself:
 * `onChange` reports each change, and the app decides where it goes.
 */
export function useGameSession<
  Context,
  Event extends MachineEvent,
  Input,
  Phase extends string,
  GuardName extends string,
  ActionName extends string,
>(
  machine: MachineDefinition<Context, Event, Input, Phase, GuardName, ActionName>,
  initial: MachineState<Context, Phase>,
  options: SessionOptions<MachineState<Context, Phase>> = {},
) {
  const now = options.now ?? Date.now
  // Only the first render's `initial` counts: a caller that builds a new object each render doesn't restart the game.
  const [first] = useState(initial)
  const [state, setState] = useState(first)

  // After React has drawn a new state, report it: saving is a side effect, so it doesn't belong inside the update.
  // The state it started with isn't reported: whoever passed it in already has it.
  const reportChange = useEffectEvent((changed: MachineState<Context, Phase>) => options.onChange?.(changed))
  useEffect(() => {
    if (state !== first) reportChange(state)
  }, [state, first])

  /** Reports what the players did. Events the current phase doesn't handle are ignored, and nothing re-renders. */
  const send = useCallback(
    (event: Event) => {
      // Read the clock here, not inside the update below: React may run an update twice to check it has no side
      // effects, and both runs must get the same time.
      const time = now()
      setState((current) => sendEvent(machine, current, event, { now: time }))
    },
    [machine, now],
  )

  /** Starts a new game from this input, with a new seed: "Play again". */
  const restart = useCallback((input: Input) => setState(newGame(machine, input)), [machine])

  return { state, send, restart, ended: isFinal(machine, state) }
}
