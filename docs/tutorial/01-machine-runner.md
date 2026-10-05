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
