# 0002. The machine runner API

- **Status:** Accepted. Amends [0001](0001-game-standard.md) on one point: "pure" guards and actions become "deterministic" (see below).
- **Date:** 2026-10-06

## Context

[ADR 0001](0001-game-standard.md) chose a hybrid state machine for every game: a declarative phase graph with named, typed guards and actions, run by our own small runner instead of XState. It left the runner's exact API open, to be fixed once the runner was built.

The runner is now built (`src/sdk/rng.ts` and `src/sdk/machine/`). Every game will be written against this API, so it's recorded here.

The requirements it had to meet, from the Game Standard:

- Games are deterministic and testable: no `Math.random` or `Date.now` inside game logic.
- A refresh resumes the game exactly where it was.
- A typo in a phase, guard or action name is a compile error.

## Decision

### Randomness: a seeded Rng whose state is one number

`createRng(seed)` returns an `Rng` with `next()`, `int(min, max)`, `shuffle(items)` and `getState()`. It uses mulberry32, whose whole state is a single 32-bit number, so `createRng(rng.getState())` continues the same sequence.

`shuffle` returns a copy and never reorders the array it's given.

- *Rejected: `Math.random`.* Tests couldn't check exact results, bugs couldn't be replayed, and a refresh would reshuffle mid-game.
- *Rejected: a larger generator (e.g. with 128 bits of state).* Better statistical quality matters for simulations, not for shuffling party-game cards, and its state would be harder to save.

### Game state is plain data: `{ phase, context, rngState }`

Everything about a game in progress is this one serializable object. The runner keeps nothing between calls. The app saves it, and loading it later continues with the same phase, the same data and the same next random draw.

### The runner is three plain functions

```ts
start(machine, { input, seed })        // → starting state
send(machine, state, event, { now })   // → next state; the state passed in is never changed
isFinal(machine, state)                // → has the game ended?
```

`send` finds the current phase's transitions for the event, picks the first whose `when` guard passes (a transition without `when` always passes), runs its actions in order with each receiving the previous one's context, and moves to `to` (or stays). The Rng is recreated from `state.rngState` for each event and its new position is saved in the returned state. The time is passed in by the caller; the runner never reads the clock.

- *Rejected: a class holding the current state.* Hidden state would have to be extracted for saving, and could drift from what was saved.

### Ignored events are silent

An event the current phase doesn't list, an event whose guards all fail, and any event after the game has ended are ignored: `send` returns the exact state object it was given. A double tap or a timer firing just as the phase changes must not crash a game. Returning the same object lets callers detect "nothing happened" with `===`.

### Machines are written with `defineMachine`, which infers names

```ts
defineMachine<Context, Event, Input>()({ initial, context, phases, guards, actions })
```

The author writes the context, event and input types. Phase, guard and action names are inferred from the keys of `phases`, `guards` and `actions`. Places that only use a name (`initial`, `to`, `when`, `actions: [...]`) are marked with TypeScript's `NoInfer`, so a typo there is reported where it is, instead of being inferred as a new name.

The two calls are needed because TypeScript can't take some type parameters explicitly and infer the rest in one call.

- *Rejected: listing names as type parameters by hand.* Every name would be written twice, and a forgotten list entry would be reported as a mistake in the machine.

`context` receives `{ input, rng }`. What `input` holds (teams, settings, content) is decided by the format, not by the runner.

### Mistakes caught in types, and in tests

- **In types:** unknown phase, event, guard or action names; a guard or action that is used but not written; an action that returns an incomplete context; a final phase that lists events.
- **In tests, with `validateMachine(machine)`:** a transition placed after a transition without `when`, which can never run. It returns a list of problems rather than throwing, so it runs in CI and never on a player's device. Every game's tests check that the list is empty.

### "Pure" becomes "deterministic" (amends ADR 0001)

ADR 0001 said guards and actions are pure. An action that draws from the `rng` it's given changes the Rng's position, which is a side effect, so "pure" was not accurate. The rule is now:

- **Guards only read.** They don't receive `rng` or `now`.
- **Actions return a new context** and never change the one they're given. Drawing from `rng` is their one allowed side effect.
- Given the same context, event, Rng state and time, both always give the same result.

- *Rejected: a fully pure Rng* where every draw returns `[value, nextState]`. It would make every game author thread state through every action by hand.

## Consequences

- Any game can be tested by playing it from start to finish with a fixed seed, with no screens. The SDK's own tests do this with a toy game shaped like the team-turns format.
- Save and resume needs no game-specific code: the app stores one plain object.
- Changing the Rng algorithm changes every seeded result and every saved game's future draws. A test pins known values so such a change is a visible decision.
- Combining machines by spreading one machine's `phases` into another can carry the first machine's names into inference, so a mistake may be reported in the wrong place. The team-turns format, which combines shared phases with each game's own, must be designed around this.
- The runner is small (about 60 lines). If games outgrow it, moving to XState needs its own decision record.
