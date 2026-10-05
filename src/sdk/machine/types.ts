import type { Rng } from '../rng'

/**
 * Something that happened, sent by a view. Every event has a `type`; it may carry more data.
 * A game lists its events as a union, e.g. `{ type: 'got' } | { type: 'answer'; option: number }`.
 */
export interface MachineEvent {
  type: string
}

/** What a guard receives. */
export interface GuardArgs<Context, Event extends MachineEvent> {
  context: Context
  event: Event
}

/** A named yes/no question about the game, used to choose between transitions. */
export type Guard<Context, Event extends MachineEvent> = (args: GuardArgs<Context, Event>) => boolean

/** What an action receives. `rng` and `now` come from the runner, never from `Math.random` or `Date.now`. */
export interface ActionArgs<Context, Event extends MachineEvent> {
  context: Context
  event: Event
  rng: Rng
  /** The current time in milliseconds, e.g. for setting `turnEndsAt`. */
  now: number
}

/** A named change to the game. Returns the new context; never changes the one it was given. */
export type Action<Context, Event extends MachineEvent> = (args: ActionArgs<Context, Event>) => Context

/**
 * What an event does in a phase: optionally check a guard, run actions in order, optionally move to another phase.
 * With no `to`, the game stays in the same phase.
 *
 * `NoInfer` marks places that only *use* a name. Names are *defined* by the keys of `phases`, `guards` and
 * `actions`; without `NoInfer`, `defineMachine` would also learn names from here, so a typo would become a
 * "real" name and the correct code would be reported as the mistake.
 */
export interface Transition<Phase extends string, GuardName extends string, ActionName extends string> {
  when?: NoInfer<GuardName>
  to?: NoInfer<Phase>
  actions?: readonly NoInfer<ActionName>[]
}

/**
 * The transitions for one event: a single transition, or a list tried in order where the first
 * whose `when` guard passes wins. A transition with no `when` always passes, so it goes last as the fallback.
 */
export type Transitions<Phase extends string, GuardName extends string, ActionName extends string> =
  | Transition<Phase, GuardName, ActionName>
  | readonly Transition<Phase, GuardName, ActionName>[]

/**
 * One step of the game. Each phase is shown by one view, chosen by `interaction`.
 *
 * Either a playing phase, which responds to events, or a final phase, which ends the game.
 * A final phase can't list events: they would never run, so writing `on` there is a type error.
 */
export type PhaseDefinition<
  Event extends MachineEvent,
  Phase extends string,
  GuardName extends string,
  ActionName extends string,
> =
  | {
      /** Which interaction primitive shows this phase (standard §6), e.g. `'handoff'` or `'flash_card'`. */
      interaction: string
      /** The events this phase responds to. Events not listed here are ignored in this phase. */
      on?: { [Type in Event['type']]?: Transitions<Phase, GuardName, ActionName> }
      final?: false
    }
  | {
      interaction: string
      /** This phase ends the game. */
      final: true
      on?: never
    }

/**
 * A game's rulebook: its phases, and the guards and actions they refer to by name.
 *
 * `Input` is whatever the game needs to set up its starting context (teams, settings, content).
 * The format decides what that is (chapter 03); the machine only says how to turn it into context.
 */
export interface MachineDefinition<
  Context,
  Event extends MachineEvent,
  Input,
  Phase extends string,
  GuardName extends string,
  ActionName extends string,
> {
  initial: NoInfer<Phase>
  context: (args: { input: Input; rng: Rng }) => Context
  phases: Record<Phase, PhaseDefinition<Event, Phase, GuardName, ActionName>>
  guards: Record<GuardName, Guard<Context, Event>>
  actions: Record<ActionName, Action<Context, Event>>
}

/**
 * Everything about a game in progress. Plain data, so the app can save it and resume after a refresh.
 * `rngState` is where the random sequence is (see `Rng.getState`), so a resumed game draws what it would have anyway.
 */
export interface MachineState<Context, Phase extends string> {
  phase: Phase
  context: Context
  rngState: number
}
