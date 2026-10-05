import { createRng } from '../rng'
import type { MachineDefinition, MachineEvent, MachineState, Transition } from './types'

/**
 * Starts a game: builds the starting context from `input` and puts the game in the initial phase.
 * `seed` decides every random draw for the whole game; the app picks a random one, tests pick a fixed one.
 */
export function start<Context, Event extends MachineEvent, Input, Phase extends string, GuardName extends string, ActionName extends string>(
  machine: MachineDefinition<Context, Event, Input, Phase, GuardName, ActionName>,
  { input, seed }: { input: Input; seed: number },
): MachineState<Context, Phase> {
  const rng = createRng(seed)
  const context = machine.context({ input, rng })
  return { phase: machine.initial, context, rngState: rng.getState() }
}

/**
 * Handles one event and returns the game's next state. The state passed in is never changed.
 *
 * 1. Find the transitions for this event in the current phase. None? The event is ignored.
 * 2. Pick the first transition whose `when` guard passes (no `when` always passes). None? Ignored.
 * 3. Run its actions in order, each getting the context the previous one returned.
 * 4. Move to its `to` phase, or stay in the same phase if it has none.
 *
 * An ignored event returns the exact same state object, so callers can tell nothing happened.
 */
export function send<Context, Event extends MachineEvent, Input, Phase extends string, GuardName extends string, ActionName extends string>(
  machine: MachineDefinition<Context, Event, Input, Phase, GuardName, ActionName>,
  state: MachineState<Context, Phase>,
  event: Event,
  { now }: { now: number },
): MachineState<Context, Phase> {
  const phase = machine.phases[state.phase]
  if (phase.final) return state

  const type: Event['type'] = event.type
  const found = phase.on?.[type]
  if (!found) return state

  // `found` is one transition or a list of them; make it always a list.
  const candidates: readonly Transition<Phase, GuardName, ActionName>[] = Array.isArray(found) ? found : [found]
  const chosen = candidates.find(
    (transition) => transition.when === undefined || machine.guards[transition.when]({ context: state.context, event }),
  )
  if (!chosen) return state

  // The Rng continues from where the last event left it, and its new position is saved in the returned state.
  const rng = createRng(state.rngState)
  const context = (chosen.actions ?? []).reduce(
    (current, name) => machine.actions[name]({ context: current, event, rng, now }),
    state.context,
  )

  return { phase: chosen.to ?? state.phase, context, rngState: rng.getState() }
}

/** Whether the game has ended. */
export function isFinal<Context, Phase extends string>(
  machine: { phases: Record<Phase, { final?: boolean }> },
  state: MachineState<Context, Phase>,
): boolean {
  return machine.phases[state.phase].final === true
}
