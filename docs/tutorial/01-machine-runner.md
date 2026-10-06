# 01 — Machine runner

**Goal of this chapter:** build the core of the game SDK: a seeded random number generator, the machine types, `defineMachine` and the runner that plays a machine. The chapter ends when a small test machine plays a full game from start to finish in tests. No screens yet.

**Branch:** `chapter/01-machine-runner`

**Where this fits.** Phase 1 of the roadmap (the SDK and Charades) is split into four chapters, so each one ends in something that works, is reviewed and is merged before the next builds on it:

| Chapter | Scope | Ends with |
|---|---|---|
| **01: Machine runner** (this one) | Rng, machine types, `defineMachine`, the runner, a decision record for the runner API | A test machine plays a full game in tests |
| 02: Content packs | zod, the pack schema, loading packs, JSON Schema generation, `validate-content` in CI | All five CI checks are real |
| 03: team-turns format | The format's phases, guards and actions, `defineGame`, the shared interaction primitives, the app shell (library, setup, save and resume) | A placeholder game is playable on a phone |
| 04: Charades | Item schema, machine, views, first content pack, rules | Charades meets the Definition of Done |

One big chapter would have meant one huge pull request, with the runner's design only tested by Charades at the very end. Split, the runner is merged and used before anything large depends on it.

---

## Step 1: Choose how pull requests are merged

**What:** allow two merge methods, squash and rebase, and say in the standard when to use each.

**Why:** chapter 00 showed the problem. GitHub offers three ways to merge a PR:

| Method | What lands on `main` |
|---|---|
| Merge commit | Every commit from the branch, plus an extra "Merge pull request" commit, with a branching history |
| Squash | One commit for the whole PR |
| Rebase | Every commit from the branch, in a straight line, with no extra commit |

Squash suits most PRs: contributors' branches often contain commits like "fix typo" or "wip" that nobody needs on `main`, and one commit per PR is easy to revert. But the tutorial chapters are built one step per commit, with Conventional Commit messages. Squashing a chapter would fold all its steps into a single commit, so the history could no longer be followed step by step.

So:

- **Squash by default.** The PR title becomes the commit message.
- **Rebase when every commit stands on its own** and follows Conventional Commits, as tutorial chapters do.
- **No merge commits.** They add a commit that says nothing and make the history branch.

**Settings (on GitHub):** **Settings → General → Pull Requests**:

- tick **Allow squash merging**, and set its default message to **Default to pull request title**;
- tick **Allow rebase merging**;
- untick **Allow merge commits**.

**Files changed:**

- `docs/game-standard.md` §12: the merge rule.
- `CONTRIBUTING.md`: PRs are usually squashed, so branch commits don't need to be tidy, but the PR title must follow Conventional Commits.
- `docs/tutorial/01-machine-runner.md` (new, this file).

**How to verify:** open any PR. The merge button's dropdown offers **Squash and merge** and **Rebase and merge**, and nothing else.

> **Changed in [chapter 02, step 1](02-content-packs.md#step-1-merge-chapters-with-a-merge-commit):** chapters are now merged with a merge commit instead of rebased. This chapter was the only one rebase-merged.

---

## Step 2: A seeded random number generator (Rng)

**What:** an `Rng` that games use for anything random (shuffling the words, picking who starts), in `src/sdk/rng.ts`, with tests.

**Why:** standard §4 says guards and actions never call `Math.random`; the runner passes them an Rng instead. `Math.random` gives different results every run, which causes three problems:

1. Tests can't check exact results ("the first word drawn is Goku") if the order changes every time.
2. A bug like "the same word came up twice" can't be replayed.
3. After a refresh, the game would reshuffle and the cards would change mid-game.

A **seeded** generator fixes all three. The seed is a starting number, and the same seed always produces the same sequence. Tests use a fixed seed; real games get a random seed once, when the game starts.

### The interface

```ts
interface Rng {
  next(): number                       // 0 (inclusive) to 1 (exclusive)
  int(min: number, max: number): number // whole number, both ends inclusive
  shuffle<T>(items: readonly T[]): T[]  // shuffled copy; the original is unchanged
  getState(): number                    // where we are in the sequence
}

function createRng(seed: number): Rng
```

**Seed and state are the same thing.** The generator's whole memory is one number. `createRng(seed)` starts the sequence there, `getState()` reads where it is now, and `createRng(savedState)` continues from that point. That's how a refresh will resume with the same draws: the runner (step 5) saves the state next to `{ phase, context }`.

**`shuffle` returns a copy** instead of shuffling in place. Actions must not change data they're given (they return new context), so an Rng that modified arrays in place would make that rule easy to break by accident.

### The algorithm: mulberry32

```ts
state = (state + 0x6d2b79f5) >>> 0
let t = state
t = Math.imul(t ^ (t >>> 15), t | 1)
t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
return ((t ^ (t >>> 14)) >>> 0) / 4294967296
```

You don't need to follow the bit operations. What matters:

- Each call adds a fixed constant to the state, then scrambles it into an output. The scrambling makes outputs look random; the constant step makes them repeatable.
- `>>> 0` keeps numbers as whole 32-bit values (0 to 4,294,967,295). Dividing by 4,294,967,296 (2³²) turns the result into a number from 0 to just under 1.
- `Math.imul` multiplies two numbers the way 32-bit integers do, which plain `*` doesn't in JavaScript.

We chose it because it's about ten lines, fast, and its state is a single number, so saving it is trivial. It's not suitable for security (passwords, tokens), which doesn't matter for shuffling cards.

**`int(min, max)`** scales `next()` to the range: `min + Math.floor(next() * (max - min + 1))`. It throws a `RangeError` if `min > max` or either isn't a whole number: a bug in a game should fail loudly, not quietly return a strange number.

**`shuffle`** uses Fisher–Yates: walk the array from the end, swapping each item with a random item at or before it. Every order is equally likely. (The simpler-looking `items.sort(() => rng.next() - 0.5)` is a known trap: some orders come up more often than others.)

The line `;[result[i], result[j]] = [result[j], result[i]]` swaps two items. The leading `;` is there because the file doesn't use semicolons, and a line starting with `[` would otherwise be read as continuing the line above.

### Tests: `src/sdk/rng.test.ts`

13 tests:

| Test | Why it matters |
|---|---|
| Same seed → same sequence; different seed → different sequence | The whole point of seeding |
| Seed 42 gives three known values | Pins the algorithm. If someone changes it, every saved game and seeded test would replay differently; this test makes that a visible decision, not an accident. The values match published mulberry32 output. |
| Continuing from `getState()` gives the same next draws as the original | Resume after refresh |
| `next` stays in 0–1 over 10,000 draws | The range promise |
| `int(1, 6)` stays in range and hits every value from 1 to 6 | No off-by-one at either end |
| `int` with min = max, min > max, or a fraction | Edge cases and errors |
| `shuffle` keeps every item once, leaves the original alone, repeats per seed, handles `[]` and one item | The shuffle promises |

**Deleted:** `src/app/smoke.test.ts`, the throwaway test from chapter 00. Real tests now prove the runner works.

### Files changed

- `src/sdk/rng.ts`, `src/sdk/rng.test.ts` (new): the first files in `src/sdk/`, so the folder boundary rules now apply to real code.
- `src/app/smoke.test.ts` (deleted)
- `docs/game-standard.md` §4: names the Rng's three functions.

### How to verify

1. `pnpm test` reports `13 passed`.
2. See the pinning test do its job: in `rng.ts`, change `0x6d2b79f5` to `0x6d2b79f6` and run `pnpm test`. The "known mulberry32 values" test fails. Change it back.
3. `pnpm lint` and `pnpm typecheck` pass.

---

## Step 3: Machine types

**What:** the TypeScript types that describe a machine (a game's rulebook), in `src/sdk/machine/types.ts`. Types only: nothing runs yet.

**Why:** standard §4 promises that "a typo is a compile error, not a runtime surprise". Writing the types first fixes the shape of a rulebook, and lets us prove that promise before any runner code exists.

### The types, from small to large

| Type | What it is | Charades example |
|---|---|---|
| `MachineEvent` | Anything with a `type`. A game lists its events as a union. | `{ type: 'got' } \| { type: 'skip' }` |
| `Guard` | A function: `({ context, event }) => boolean` | `roundsRemaining` |
| `Action` | A function: `({ context, event, rng, now }) => Context`. Returns a **new** context. | `scorePoint` |
| `Transition` | `{ when?, to?, actions? }`: check a guard, run actions, maybe move phase | `{ to: 'turn_summary' }` |
| `Transitions` | One transition, or a list tried in order (first passing `when` wins) | the `next` event in `turn_summary` |
| `PhaseDefinition` | `{ interaction, on?, final? }`: one step of the game | `turn` |
| `MachineDefinition` | The whole rulebook: `initial`, `context`, `phases`, `guards`, `actions` | Charades' machine |
| `MachineState` | A game in progress: `{ phase, context, rngState }` | what gets saved on refresh |

### How names get checked

`MachineDefinition` takes the names as type parameters:

```ts
MachineDefinition<Context, Event, Input, Phase, GuardName, ActionName>
```

`Phase`, `GuardName` and `ActionName` are unions of strings, like `'playing' | 'done'`. Everywhere a rulebook refers to something by name, the type only accepts those strings:

- `initial` and every `to` must be a `Phase`;
- every `when` must be a `GuardName`;
- every name in `actions: [...]` must be an `ActionName`;
- the keys of `on` must be event types;
- `guards` and `actions` are `Record<Name, …>`, so every name used must also be implemented.

Writing those unions out by hand is tedious. Step 4's `defineMachine` will work them out from the rulebook itself, so game authors never list them.

### Decisions in this step

- **`Input` instead of `config, items, teams`.** The standard's example passes `{ config, items, teams, rng }` to `context`. Those come from the format and content packs (chapters 02 and 03), which don't exist yet. The machine only knows "some input, plus an Rng"; the format decides what the input is.
- **Guards don't get `rng` or `now`.** A guard is a question about the current state. Letting it draw a random number would make the same question give different answers. The type doesn't offer them, so the rule can't be broken by accident.
- **Every phase names an `interaction`.** The runner never reads it; the app (chapter 03) uses it to pick the view. It's required because the standard says one phase = one view.
- **"Pure" became "deterministic".** The Rng changes itself every time it's drawn from, so an action that calls `rng.int()` isn't strictly pure. It is fully repeatable, because the runner creates the Rng from the saved state and saves it again afterwards. Standard §4 now says exactly that: guards only read; actions return new context and may draw from `rng`, nothing else. The alternative, an Rng that returns `[value, nextState]` for every draw, would make every game author pass state around by hand.
- **Rejected for now: forcing context to be JSON in the type.** A `Context extends Json` constraint sounds right, but TypeScript treats `interface`s as incompatible with such types, which would confuse contributors with errors on correct code. Serializability will be checked by a test instead, once the runner exists.

### Tests: `src/sdk/machine/types.test.ts`

- A tiny dice game ("roll until the score reaches the target") written against the types, with one runtime test that its context, guard and action work together.
- Seven deliberate mistakes, each marked `// @ts-expect-error`: an unknown initial phase, an unknown event, `to: 'finished'` (no such phase), `actions: ['rolDie']`, `when: 'reachTarget'`, a missing guard, and an action that returns half a context.

**How `@ts-expect-error` works:** it tells TypeScript "the next line must be an error". If it is, the error is silenced. If it isn't (say someone loosens the types), `pnpm typecheck` fails with `Unused '@ts-expect-error' directive`. So these lines are tests for the types themselves. We also checked, with the markers removed, that each line fails for the intended reason and not something else.

**Reading the errors.** A typo inside a transition gives a long message naming the whole type, e.g.:

```
Type '{ actions: "rolDie"[]; }' is not assignable to type 'Transitions<"playing" | "done", "reachedTarget", "rollDie" | "resetScore"> | undefined'.
```

Look for your typo (`"rolDie"`) and the list of valid names (`"rollDie" | "resetScore"`). Editors show the same error as a red underline on the typo.

### Files changed

- `src/sdk/machine/types.ts`, `src/sdk/machine/types.test.ts` (new)
- `docs/game-standard.md` §4: "pure" → "deterministic", guards vs actions, and `rngState` in what the app saves

### How to verify

1. `pnpm typecheck` passes.
2. Delete one `// @ts-expect-error` line in `types.test.ts` and run `pnpm typecheck`: it fails with the error that line was expecting. Put it back.
3. In your editor, change `'rollDie'` to `'rollDice'` in the dice machine's `roll` transition: it's underlined red.
4. `pnpm test` reports `14 passed`.

---

## Step 4: `defineMachine`

**What:** a function that game authors wrap their machine in, so TypeScript works out the phase, guard and action names on its own. In `src/sdk/machine/defineMachine.ts`.

**Why:** with only the step 3 types, every name is written twice: once in a list of type parameters, once in the machine itself. Adding an action means updating both, and forgetting the list produces an error that blames the machine. `defineMachine` removes the lists.

### Before and after

Before (step 3), the author lists every name:

```ts
type DiceMachine = MachineDefinition<
  DiceContext, DiceEvent, { target: number },
  'playing' | 'done',          // phases
  'reachedTarget',             // guards
  'rollDie' | 'resetScore'     // actions
>
const dice: DiceMachine = { … }
```

After:

```ts
const dice = defineMachine<DiceContext, DiceEvent, { target: number }>()({ … })
```

### The code

```ts
export function defineMachine<Context, Event extends MachineEvent, Input = void>() {
  return <Phase extends string, GuardName extends string = never, ActionName extends string = never>(
    definition: MachineDefinition<Context, Event, Input, Phase, GuardName, ActionName>,
  ) => definition
}
```

At runtime it does nothing: it returns what it's given. All its value is in the types.

**Why two calls, `defineMachine<…>()({ … })`?** TypeScript has a rule: when you call a function, you either give *all* its type parameters or *none* (and it infers them all). We need a mix. Context, event and input can't be guessed from the machine, so the author writes them; the names should be inferred. Splitting into two functions solves it: the first call takes the three written types, and returns a second function whose type parameters (the names) are inferred from the machine passed to it.

The `= never` defaults cover machines with no guards or no actions: `guards: {}` means "no guard names".

### The problem we hit, and `NoInfer`

The first version had no `NoInfer`. We tested it with a typo, `actions: ['rolDie']`, next to a correctly written `rollDie` action. TypeScript reported:

```
'rollDie' does not exist in type 'Record<"rolDie", Action<…>>'. Did you mean to write 'rolDie'?
```

It blamed the **correct** code and suggested changing it to match the typo. Why: TypeScript infers a type parameter from every place it appears. `ActionName` appears in the keys of `actions` *and* in every `actions: [...]` list, so the typo `'rolDie'` became one of the "real" action names.

The fix is to tell TypeScript which places **define** names and which only **use** them:

| Defines names (inferred from) | Uses names (checked against) |
|---|---|
| keys of `phases` | `initial`, every `to` |
| keys of `guards` | every `when` |
| keys of `actions` | every `actions: [...]` |

TypeScript's built-in `NoInfer<T>` marks a "use" place: "check against `T`, but don't learn `T` from here". In `types.ts`, `initial`, `to`, `when` and `actions` are now wrapped in `NoInfer`. After that, the same typo is reported on the line with the typo, and the correct code compiles.

`NoInfer` changes nothing when type parameters are written out by hand (as in `types.test.ts`), so the step 3 tests still pass.

### A trap to remember for chapter 03

One test first reported in the wrong place: a machine built by spreading another machine's phases (`phases: { ...dice.phases, … }`). The spread brought `dice`'s guard name along, and TypeScript learned from it. Written as one block, the error lands where it should. That matters later: the team-turns format will provide shared phases that each game combines with its own, and combining them will need care so errors still point at the right line.

### Tests: `src/sdk/machine/defineMachine.test.ts`

The dice game again, written with `defineMachine` and no name lists.

| Test | Checked by | Expected |
|---|---|---|
| Returns the definition unchanged | `pnpm test` | The same object comes back |
| Works out the names | `pnpm typecheck` (`expectTypeOf`) | Phases `'playing' \| 'done'`, guards `'reachedTarget'`, actions `'rollDie' \| 'resetScore'` |
| Six mistakes marked `@ts-expect-error` | `pnpm typecheck` | Unknown initial phase, `to: 'finished'`, `actions: ['rolDie']`, a guard used but never written, an unknown event, an action returning half a context. Each is an error **on the line with the mistake**. |

`expectTypeOf(...).toEqualTypeOf<...>()` is Vitest's way of testing types: it compiles only if the two types are exactly equal. At runtime it does nothing, so a wrong type shows up in `pnpm typecheck`, not `pnpm test`.

### Files changed

- `src/sdk/machine/defineMachine.ts`, `src/sdk/machine/defineMachine.test.ts` (new)
- `src/sdk/machine/types.ts`: `NoInfer` on `initial`, `to`, `when` and `actions`
- `docs/game-standard.md` §4: the example now uses the real API, `defineMachine<Context, Event, Input>()({ … })` with `context: ({ input, rng })`

### How to verify

1. `pnpm typecheck` passes; `pnpm test` reports `16 passed`.
2. See `NoInfer` matter: remove `NoInfer<…>` around `ActionName` in `types.ts` (leave `readonly ActionName[]`), then in `defineMachine.test.ts` change the dice game's `'rollDie'` in the `roll` transition to `'rolDie'`. Hover the error: TypeScript now suggests renaming the correct action. Undo both changes.
3. In your editor, hover `dice` in `defineMachine.test.ts`: the phase, guard and action names appear in its type without anyone having written them.

---

## Step 5: The runner

**What:** the code that plays a machine: `start`, `send` and `isFinal`, in `src/sdk/machine/runner.ts`. Plus a type change so a final phase can't list events.

**Why:** steps 3 and 4 describe a rulebook. The runner is the referee: every time something happens, it reads the rulebook and works out what comes next. Every game uses this same runner (standard §2).

### First: final phases can't list events

`PhaseDefinition` is now one of two shapes:

```ts
| { interaction: string; on?: { … }; final?: false }   // a playing phase
| { interaction: string; final: true; on?: never }     // a final phase
```

A type that is "one of several shapes" is a **union**. `on?: never` means "this property must not be there": `never` is the type with no possible values, so nothing can be assigned to it. Writing `done: { final: true, on: { … } }` is now a red underline, because those events could never run (the game has ended). A new deliberate-mistake test in `defineMachine.test.ts` checks it.

This is the "types" half of the split we chose; the "guard after the fallback" check comes in step 6 as `validateMachine`.

### The three functions

```ts
start(machine, { input, seed })        // → the starting state
send(machine, state, event, { now })   // → the next state
isFinal(machine, state)                // → has the game ended?
```

State is `{ phase, context, rngState }`: plain data, which is what the app will save. The runner itself keeps nothing between calls. That's why these are plain functions instead of a class with methods: there's no hidden state to lose on refresh.

**`start`** creates an Rng from the seed, asks the machine to build its starting context from the input, and returns the initial phase, that context, and the Rng's position.

**`send`** does four things:

1. **Find the transitions** for this event in the current phase. None, or the phase is final? Return the state unchanged.
2. **Pick one:** the first transition whose `when` guard passes. A transition with no `when` always passes. None pass? Return the state unchanged.
3. **Run its actions in order.** Each action gets the context the previous one returned. This is a `reduce`: start with the current context and fold each action over it:
   ```ts
   const context = (chosen.actions ?? []).reduce(
     (current, name) => machine.actions[name]({ context: current, event, rng, now }),
     state.context,
   )
   ```
4. **Return the new state:** the transition's `to` phase (or the same phase), the new context, and the Rng's new position.

The Rng is recreated from `state.rngState` at the start of every `send`, and its position is saved at the end. Between events, the random sequence exists only as that one number in the state.

**"Unchanged" means the same object.** An ignored event returns the exact state object it was given, not a copy. The app can then tell "nothing happened" with a simple `===` check, and React skips re-rendering.

### Decisions in this step

- **Ignored events are silent.** A view might send an event the current phase doesn't expect: a double tap, a timer firing just as the phase changed. Throwing an error there would crash the game over something harmless. Standard §4 now states the rule.
- **`now` is passed in, not read by the runner.** The runner never calls `Date.now()` itself; the app passes the time with each event. That keeps the runner deterministic too: tests pass whatever time they like.
- **`isFinal` takes a loose type** (`{ phases: Record<Phase, { final?: boolean }> }`) instead of the full machine type, because it only needs to look at phases. The app will call it with any game's machine.

### Tests: `src/sdk/machine/runner.test.ts`

A small test machine (not a real game) with events chosen to exercise each part of the runner: adding, two actions in both orders, rolling a die, recording the time, and a three-way guarded `next`.

| Area | Tests |
|---|---|
| `start` | Initial phase and context from the input; the Rng position is stored |
| Transitions | Actions run; no `to` stays in phase; **actions run in listed order** (1 → +1 → ×2 = 4, but 1 → ×2 → +1 = 3); first passing guard wins; the fallback is used when no guard passes |
| Ignoring | An unlisted event returns **the same object**; every event after the game ends is ignored |
| Purity | `now` reaches actions; the state passed in is never changed (compared against a deep copy taken before) |
| Randomness | The Rng position moves when an action draws; draws across events equal one Rng's sequence for that seed; same seed and events give the same results; **saving the state as JSON and loading it continues exactly as without the refresh** |
| `isFinal` | False while playing, true after reaching `done` |

### Testing the tests

A test that never fails proves nothing, so we broke the runner on purpose and checked which tests caught it:

| Broken on purpose | Caught by |
|---|---|
| Last matching transition wins instead of first | "picks the first transition whose guard passes" |
| Forget to save the Rng's position after an event | At first, only "moves the random sequence forward". |

The second one exposed a weak test. With the position never saved, every roll gives the same number, and "same seed gives same results" still passed, because both runs repeat that number. We added "draws across events equal one Rng's sequence for that seed", which compares the runner's rolls with `createRng(99)`'s own draws. Now two tests catch it.

### Files changed

- `src/sdk/machine/runner.ts`, `src/sdk/machine/runner.test.ts` (new)
- `src/sdk/machine/types.ts`: `PhaseDefinition` is a union; final phases can't have `on`
- `src/sdk/machine/defineMachine.test.ts`: a deliberate mistake for a final phase with events
- `docs/game-standard.md` §4: actions run in order; ignored events; final phases can't list events; the runner's three functions

### How to verify

1. `pnpm test` reports `32 passed`; `pnpm typecheck` and `pnpm lint` pass.
2. In `runner.ts`, change `candidates.find(` to `candidates.findLast(` and run `pnpm test`: "picks the first transition whose guard passes" fails. Undo it.
3. In `runner.test.ts`, add `on: { next: { to: 'counting' } }` to the `done` phase: it's underlined red. Undo it.

---

## Step 6: A full game, and `validateMachine`

**What:** two things that check machines from the outside:

- `validateMachine` (`src/sdk/machine/validateMachine.ts`): finds a mistake TypeScript can't.
- A full-game test (`src/sdk/machine/fullGame.test.ts`): a toy game played from the first screen to the results, the way standard §12 requires for every game.

**Why:** step 5 tested the runner piece by piece. This step tests it the way a game will use it: a whole game, many events in a row, saved and reloaded halfway.

### `validateMachine`

The mistake it finds compiles fine and fails quietly:

```ts
next: [
  { to: 'results' },                               // no `when`: always matches
  { when: 'roundsRemaining', to: 'handoff' },      // can never run
]
```

The first match wins, so the game always goes to the results after the first turn. In play, that looks like a rules bug ("the game ends too early"), not a code bug.

`validateMachine(machine)` walks every phase and every event. Wherever a list of transitions has one without `when`, every transition after it is reported:

```
Phase "turn_summary", event "next": transition 2 (when "roundsRemaining") can never run,
because transition 1 has no `when` and always matches. Move the transition without `when` last.
```

**It returns problems instead of throwing**, and it's meant for tests, not for when a game loads. That way a mistake is caught in CI, before merging, and never shows a player an error screen. A test uses it like this:

```ts
expect(validateMachine(machine)).toEqual([])
```

If there are problems, Vitest prints the whole list in its diff.

It takes a loose type (`{ phases: Record<string, { on?: Record<string, unknown> }> }`) instead of the full machine type: it only reads phase and transition structure, and its own tests can then use small hand-written objects.

### Dice Duel, a toy game

A game made up for this test, deliberately shaped like the team-turns format (standard §7) that Charades will use:

```
handoff ──start──▶ turn ──time_up──▶ turn_summary ──next──▶ handoff   (if turns remain)
                    │ roll                         └─next──▶ results  (otherwise)
                    └──▶ (stays in turn)
```

Teams take timed turns over two rounds. During a turn the team rolls as often as it likes; when time is up, the rolls are added to its score. The starting context shuffles the team order with `rng.shuffle`, so randomness is used both at the start and during play.

That makes it an early check of the runner against chapter 03's design: a handoff, a timed turn with `turnEndsAt` set from `now`, an end-of-turn summary, and a guarded loop back to the next team.

### The tests

| Test | Expected |
|---|---|
| `validateMachine(diceDuel)` | No problems |
| Plays to the end | 4 turns (2 teams × 2 rounds), back to `handoff` after each of the first three, then `results` |
| Same seed, same result | Seed 2026 gives turn order Blue, Red and scores `[18, 16]` |
| Every state is plain JSON | Each state survives `JSON.stringify` then `JSON.parse` unchanged. This is the serializability check we deferred in step 3. |
| Save and reload halfway | Reloading the state after two turns finishes with exactly the same final state as never reloading |
| Timer | Starting a turn at `now = 5000` with 30-second turns sets `turnEndsAt` to 35000 |

**The pinned scores were checked by hand**, not just copied from the first run. Separately from the runner, one `createRng(2026)` shuffled `['Red', 'Blue']` and then made 12 rolls; Blue's score is turns 1 and 3, Red's is turns 2 and 4. Both gave `[18, 16]`. A pinned number copied from the code it tests would only prove the code agrees with itself.

### What catches the mistake

We swapped Dice Duel's `next` list so the fallback came first, then ran the tests. Three failed:

- "plays to the end" and "same seed, same result": the game ended after one turn. True, but they don't say why.
- `validateMachine`: names the phase, the event, the transition, and the fix.

### Docs updated

- Standard §4: `validateMachine` added to the machine rules.
- Standard §12 and the Definition of Done (§13): every game's tests include `validateMachine(machine)` returning no problems. "Guards and actions are pure" became "deterministic" in the Definition of Done, matching §4 since step 3.
- `.github/pull_request_template.md`: the same checklist change.

ADR 0001 still says "pure". Accepted decision records aren't edited, so the change will be recorded in ADR 0002 (step 7).

### Files changed

- `src/sdk/machine/validateMachine.ts`, `src/sdk/machine/validateMachine.test.ts`, `src/sdk/machine/fullGame.test.ts` (new)
- `docs/game-standard.md`, `.github/pull_request_template.md`

### How to verify

1. `pnpm test` reports `42 passed`.
2. In `fullGame.test.ts`, swap the two transitions in Dice Duel's `next` list and run `pnpm test`. Three tests fail, and the `validateMachine` one prints the message above. Swap them back.

---

## Step 7: ADR 0002, the runner's API

**What:** `docs/decisions/0002-machine-runner.md`, the decision record for everything this chapter built.

**Why:** ADR 0001 chose "our own small runner" but left its API open until it was built. Every game will be written against this API, and standard §12 says changes to `src/sdk/` need a decision record.

### What it records

| Decision | Rejected alternative |
|---|---|
| A seeded Rng (mulberry32) whose state is one number | `Math.random`; a larger generator |
| Game state is plain data: `{ phase, context, rngState }` | — |
| The runner is three plain functions: `start`, `send`, `isFinal` | A class holding the current state |
| Events a phase doesn't expect are ignored, returning the same state object | Throwing an error |
| `defineMachine` infers names; `NoInfer` keeps typos from becoming names | Listing names by hand |
| Mistakes caught in types, plus `validateMachine` in tests | Checking when the game loads |
| "Pure" becomes "deterministic" | A fully pure Rng returning `[value, nextState]` |

Its **Consequences** section also records the trap from step 4: combining machines by spreading phases can make errors appear on the wrong line. Chapter 03's format has to be designed around it.

### Amending ADR 0001

ADR 0001 said guards and actions are "pure". Accepted records aren't edited, so ADR 0002 says it **amends** 0001 on that one point. The decisions README only allowed "Superseded" (replaced entirely), so we added **Amended by NNNN** for a record changed on one point, and the index now shows 0001 as "Accepted; amended by 0002".

### Files changed

- `docs/decisions/0002-machine-runner.md` (new)
- `docs/decisions/README.md`: 0002 in the index, and the "Amended" status

### How to verify

Read the ADR and check it against the code: every function and rule it names exists in `src/sdk/rng.ts` or `src/sdk/machine/`, and every rejected alternative is one we actually discussed in steps 2–6.

---

## Chapter 01 done

The SDK has a seeded Rng, machine types, `defineMachine`, a runner, `validateMachine`, and a toy game played start to finish in tests, including save and reload. 42 tests, no screens yet.

Next: chapter 02, content packs: the pack schema, loading packs, generated JSON Schemas, and the `validate-content` check in CI.
