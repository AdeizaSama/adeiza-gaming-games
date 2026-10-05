import type { MachineDefinition, MachineEvent } from './types'

/**
 * Defines a game's machine. You write the context, event and input types; TypeScript works out the
 * phase, guard and action names from the keys of `phases`, `guards` and `actions`, and checks every
 * place the machine refers to them.
 *
 * Two calls, because TypeScript can't take some type parameters from you and infer the rest in one call:
 * the first call fixes the types you write, the second infers the names.
 *
 *   const machine = defineMachine<MyContext, MyEvent, MyInput>()({ initial: 'handoff', phases: { … }, … })
 *
 * At runtime it returns the definition unchanged.
 */
export function defineMachine<Context, Event extends MachineEvent, Input = void>() {
  return <Phase extends string, GuardName extends string = never, ActionName extends string = never>(
    definition: MachineDefinition<Context, Event, Input, Phase, GuardName, ActionName>,
  ) => definition
}
