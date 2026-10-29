import { useCallback, useState } from 'react'
import { isFinal, send as sendEvent, start } from '../machine/runner'
import type { MachineDefinition, MachineEvent, MachineState } from '../machine/types'

/** Ways to make a session repeatable in tests. The app uses neither. */
export interface SessionOptions {
  /** The seed for the first game. Default: a random one. */
  seed?: number
  /** The clock. Default: `Date.now`. */
  now?: () => number
}

/** A seed for a new game: a random whole number in the Rng's range (0 to 2^32 − 1). */
function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32)
}

/**
 * Plays a machine inside React: holds the game's state and re-renders when it changes.
 *
 *   const { state, send, restart, ended } = useGameSession(game.machine, { config, items })
 *
 * This is the one place where the app's randomness and time meet the machine (standard §4): it picks a random
 * seed for each new game and passes the current time with each event. Guards and actions never read either.
 */
export function useGameSession<
  Context,
  Event extends MachineEvent,
  Input,
  Phase extends string,
  GuardName extends string,
  ActionName extends string,
>(machine: MachineDefinition<Context, Event, Input, Phase, GuardName, ActionName>, input: Input, options: SessionOptions = {}) {
  const now = options.now ?? Date.now
  const [state, setState] = useState<MachineState<Context, Phase>>(() =>
    start(machine, { input, seed: options.seed ?? randomSeed() }),
  )

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

  /** Starts a new game with a new seed: "Play again". Uses the same input unless given another. */
  const restart = useCallback(
    (nextInput: Input = input) => setState(start(machine, { input: nextInput, seed: randomSeed() })),
    [machine, input],
  )

  return { state, send, restart, ended: isFinal(machine, state) }
}
