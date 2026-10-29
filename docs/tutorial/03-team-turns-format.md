# 03 — Team-turns format

**Goal of this chapter:** build the team-turns format (standard §7): the outer loop that Charades, Name Ten and Trivia Night share, and `defineGame`, the function every game exports. Then build core Charades on top of it. The chapter ends when Charades plays a full game from start to finish in tests. No screens yet.

**Branch:** `chapter/03-team-turns-format`

**Where this fits.** Phase 1 of the roadmap (the SDK and Charades) is now split into five chapters, not four:

| Chapter | Scope | Ends with |
|---|---|---|
| 01: Machine runner | Rng, machine types, `defineMachine`, the runner | A test machine plays a full game in tests |
| 02: Content packs | The pack schema, loading packs, JSON Schemas, `validate-content` in CI, Charades' item schema and first pack | All five CI checks are real |
| **03: Team-turns format** (this one) | The format's config, item pool, guards, actions and phase loop; `defineGame`; core Charades | Core Charades plays start to finish in tests |
| 04: App shell | Game list, setup, play and results screens, interaction primitives, theme tokens, save and resume | Core Charades is playable on a phone |
| 05: Charades complete | Modes, double points for acting and singing, skip penalty, settings and presets, rules, the game's README | Charades meets the Definition of Done |

The old chapter 03 held the format *and* the whole app shell, with a placeholder game to try it on. That was too much for one pull request someone can actually review. Splitting it also removes the placeholder: Charades is the real game from this chapter on, built in two stages. Here it gets the core rules (a correct guess scores 1, a skip just moves on, the timer ends the turn). The extras wait for chapter 05.

**Why no screens yet.** Every screen shows one phase of a game (standard §5), so screens are built on top of the phases this chapter defines. Building them first would mean building against an API that's about to change.

---

## Step 1: Five chapters, and a PR checklist that matches CI

**What:**

1. Record the new five-chapter plan: this file, and a note in chapters 01 and 02, whose tables and "next" lines still describe four chapters.
2. Fix the pull request template's checklist so it lists every check CI runs.

**Why:** a tutorial that describes a plan we've dropped will mislead the next person who reads it. We don't rewrite old chapters, because they record what happened at the time. A short "Changed in chapter 03" note at the top keeps them accurate and keeps the history.

The PR template is a separate problem. Its checklist said "`pnpm lint`, `pnpm test` and `pnpm build` pass locally", but CI runs five checks: typecheck, lint, test, validate-content and build. A contributor who followed the checklist could still have their pull request fail on the two checks it didn't mention. The rule from now on: **every check that can fail CI is in the checklist**, and any step that adds or changes a CI check updates the template in the same commit.

`pnpm build` already includes the type check (`tsc -b && vite build`), but the checklist lists `pnpm typecheck` on its own anyway, because CI runs it as its own check and reports it separately.

### Files changed

- `docs/tutorial/03-team-turns-format.md` (new, this file).
- `docs/tutorial/01-machine-runner.md`: a note under the chapter table.
- `docs/tutorial/02-content-packs.md`: a note under the introduction and under "Chapter 02 done".
- `.github/pull_request_template.md`: the checklist names all five CI checks.
- `docs/game-standard.md` §12: the template's checklist must match the CI checks.

### How to verify

1. Open `.github/pull_request_template.md`. The first checklist line names `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm validate-content` and `pnpm build`. Compare it with the `run:` lines in `.github/workflows/ci.yml`: same five commands.
2. Open chapters 01 and 02. Each has a "Changed in chapter 03" note that links here.
3. No code changed: `pnpm test` still reports 118 passed.

---

## Step 2: How a game plugs its turn into the format (ADR 0004)

**What:** decide, before writing any format code, how a game's turn and the format's loop become one machine. The decision is [ADR 0004](../decisions/0004-team-turns-builder.md). No code is committed in this step.

**Why:** this is the API every team-turns game is written against: Charades now, Name Ten and Trivia Night later. Changing it after three games use it means rewriting all three.

### The problem

Look at Dice Duel, the toy game in `src/sdk/machine/fullGame.test.ts` from chapter 01. Its phases are `handoff → turn → turn_summary → handoff …→ results`, all written by hand. Charades has the same loop. So do Name Ten and Trivia. Only the `turn` phase is different:

| | Inside the turn |
|---|---|
| Dice Duel | `roll` |
| Charades | `got` scores and shows the next item; `skip` shows the next item |
| Trivia Night | `answer` checks the answer; a wrong one can lead to a `steal` phase |

We want each game to write only its turn, and get the rest from the format.

### Three ways to do it

**(a) Copy the format's parts in.** The format exports its phases, guards and actions as objects, and each game copies them into its own `defineMachine` call with `...`. It looks simple, but chapter 01, step 4 found the trap: `defineMachine` learns the phase names from every key in `phases`, including the copied ones, so a typo can be reported inside the format's code instead of on the game's line. And nothing stops a game from writing its own `handoff` and quietly changing the loop.

**(b) A builder function.** The format exports a function, `teamTurns`. The game passes it only its turn, and the function builds the whole machine. This is what we chose.

**(c) A machine inside a machine.** The turn would be a small machine of its own, run by the format's machine. The runner would have to handle two layers of state, to save and to resume. That's a big change to the smallest, most important piece of the SDK.

### What a game writes with (b)

```ts
export const machine = teamTurns<CharadesItem, CharadesTurn, CharadesEvent>()({
  newTurn: () => ({ got: [], skipped: [] }),
  points: (turn) => turn.got.length,
  phases: {
    turn: {
      interaction: 'flash_card',
      on: {
        got:     { actions: ['markGot', 'drawItem'] },
        skip:    { actions: ['markSkipped', 'drawItem'] },
        time_up: { to: 'turn_summary' },
      },
    },
  },
  guards:  {},
  actions: { markGot: …, markSkipped: … },
})
```

Line by line:

- **`teamTurns<…>()({ … })`**: two calls, like `defineMachine`. The first fixes the types the game writes: what an item is, what the game records during a turn, and the game's own events. The second works out the names from the keys.
- **`newTurn`**: the game's record of one turn, empty at the start of each turn. Charades records which items were got and which were skipped, so the turn summary can show them.
- **`points`**: what a turn record is worth. Charades: one point per item got.
- **`phases.turn`**: the game's turn. `drawItem` is one of the format's actions; the game can use it because the format puts its actions and the game's together. `time_up` is the game's to handle, because what running out of time means depends on the game.

Everything else (handoff, timer, item pool, scores, turn summary, the move to the next team, results) comes from `teamTurns`.

### Points come from the turn record

Instead of adding to a score each time someone guesses, the game keeps a record of the turn, and `points` works out what it's worth. The format adds that to the team's score when the players tap "next" on the turn summary.

Why: the turn summary will let players fix a mis-tap (standard §7 calls it "editable"). If the score were added as the turn went, a fix would have to undo it. Worked out from the record, the score follows the fix automatically.

### What the types catch

Before writing the ADR, a throwaway prototype of `teamTurns` was checked against a set of deliberate mistakes. Each one is a type error on the game's own line:

| Mistake | Why it's caught |
|---|---|
| `to: 'turn_sumary'` | Not a phase |
| `actions: ['markGott']` | Not an action |
| Using `markGot` without writing it | Same: names come from the `actions` object's keys |
| `to: 'results'` from the turn | A game may only go to its own phases or `turn_summary` |
| No `turn` phase | `handoff` starts `turn`, so it must exist |
| A phase called `handoff`, or an action called `drawItem` | Those names belong to the format |

The prototype also showed Trivia's extra `steal` phase compiling (it's in the ADR), so the design leaves room for it. The prototype isn't committed; the real code is built in steps 3 to 6.

### Files changed

- `docs/decisions/0004-team-turns-builder.md` (new).
- `docs/decisions/README.md`: lists 0004.
- `docs/tutorial/03-team-turns-format.md`: this section.

### How to verify

Read ADR 0004 and check that:

1. The Charades example uses only names the format provides (`drawItem`, `turn_summary`, `time_up`) or the game defines (`markGot`, `markSkipped`).
2. Each rejected option says why, and (a)'s reason matches the trap recorded in ADR 0002's Consequences.
3. No code changed: `pnpm test` still reports 118 passed.

---

## Step 3: The format's settings

**What:** `src/sdk/formats/team-turns/config.ts`: a zod schema for the settings players choose before a team-turns game (teams, rounds, seconds per turn, packs, tags), with defaults and tests. This is the first file in `src/sdk/formats/`, where standard §7 says formats live.

**Why:** these settings are the same for Charades, Name Ten and Trivia, so the format owns them. The setup screen (chapter 04) sends them, the schema checks them, and the machine (step 6) receives them with every default filled in. A saved game also carries them, so checking them stops an old or broken save from starting a game with nonsense like 0 rounds.

### The settings

| Setting | Rule | Default | Why |
|---|---|---|---|
| `teams` | 2 to 10 names, each 1 to 20 characters after trimming, no two the same | none: players name them | Names appear on the handoff screen and leaderboard. Two teams called "Lions" would make the scores ambiguous. Playing order is the order listed. |
| `rounds` | Whole number, 1 to 10 | 3 | How many turns each team gets. |
| `seconds` | Whole number, 10 to 300 | 60 | How long one turn lasts. |
| `packs` | At least one pack id, written as in pack files, no repeats | none: players pick | Which content packs to draw from. |
| `tags` | Tags written as in packs, no repeats | `[]` | Only play items with one of these tags. Empty means every item. |

The limits (10 teams, 20 characters, 10 rounds, 10 to 300 seconds) are starting points, picked to fit a phone screen and keep games playable. Changing them later is one line each.

**Tags are in the settings now, but there's no way to pick them yet.** The setup screen comes in chapter 04. Adding the setting now keeps standard §7 true ("pack/tag selection"), and the item pool (step 4) uses it.

### Two types from one schema

zod schemas with defaults have two shapes, and the file exports a type for each:

- **`TeamTurnsSetup`** (`z.input`): what the setup screen sends. `rounds`, `seconds` and `tags` may be left out.
- **`TeamTurnsConfig`** (`z.output`): what comes out after checking. Every setting is there. This is what the machine gets, so it never has to handle a missing value.

### Reusing what chapter 02 built

- **Pack ids and tags** use the same rules as pack files: `PackInfo.shape.id` (the `id` field from the pack schema) and `Tag`. A pack id in the settings can only be written the way it can be in a pack.
- **Repeated names** use `findDuplicates`, so "Lions" and " lions" count as the same team, compared exactly like duplicate items.

### Strict, and extendable

Like packs, the schema is strict: an unknown setting is an error. That catches typos, and settings left over from an older saved game.

A game with its own settings extends it. In chapter 05, Charades will do something like:

```ts
const CharadesConfig = TeamTurnsConfig.extend({ punishSkips: z.boolean().default(false) })
```

`extend` keeps the strictness and every check above. A test proves it.

### Tests: `src/sdk/formats/team-turns/config.test.ts`

11 tests: defaults, each setting's limits, repeated names, strictness, extending, and the two types. The full table is in [docs/tests.md](../tests.md#team-turns-config).

### Files changed

- `src/sdk/formats/team-turns/config.ts`, `src/sdk/formats/team-turns/config.test.ts` (new).
- `docs/tests.md`: the new tests, and counts updated to 129.

### How to verify

1. `pnpm test` reports `129 passed` (118 before, 11 new).
2. Break a limit: in `config.ts`, change `.max(20, ` to `.max(21, ` and run `pnpm test`. "trims team names and rejects blank or long ones" fails, because a 21-character name is now accepted. Change it back.
3. `pnpm typecheck` and `pnpm lint` pass.

---

## Step 4: The item pool

**What:** `src/sdk/formats/team-turns/pool.ts`: three small functions that turn the chosen packs into cards to draw, and draw them one at a time.

| Function | When it runs | What it does |
|---|---|---|
| `choosePoolItems(packs, { packs, tags }, itemKey)` | Once, when the game starts | The chosen packs' items in the order the packs were chosen, filtered by tag, each item once |
| `newPool(items, rng)` | Once, when the game starts | Shuffles the items into a pool |
| `drawFrom(pool, rng)` | Every time a card is needed | Takes the next item; reshuffles when every item has been drawn |

**Why:** standard §7 says the format provides an "item pool (drawn without repeats)". Three questions it left open are answered here:

1. **An item in two chosen packs?** Kept once, from the first pack chosen. That's ADR 0003's rule, using `uniqueBy` from chapter 02.
2. **Tags?** With tags chosen, only items with at least one of them are kept. No tags keeps every item.
3. **What happens when every item has been drawn?** The drawn items are shuffled back in and the game continues. Ending the game, or the turn, because the deck ran out would be unfair to whoever was playing. Repeats are better, and they only start once every item has been seen.

### Why three functions, not one

`choosePoolItems` needs the packs, which live in the game (`defineGame`'s `content.packs`). The machine shouldn't hold every pack: a saved game only needs the items it can draw. So the app picks the items once at the start (chapter 04), and the machine receives just those items as input. `newPool` and `drawFrom` run inside the machine, using the runner's `rng`, so drawing is repeatable and resumes correctly after a refresh.

### The pool is two lists

```ts
interface ItemPool<Item> {
  remaining: Item[]   // still to draw, in the order they'll come out
  drawn: Item[]       // already drawn since the last shuffle
}
```

Plain data, so it's saved with the game. `drawFrom` returns a new pool and never changes the one it's given, the same rule actions follow.

### The card just shown never comes straight back

When `remaining` is empty, `drawFrom` shuffles `drawn` back in. Done naively, the card that was just on screen could come out first again, and two of the same card in a row looks like a bug. So the last item drawn is left out of the shuffle and put at the end of the new order:

```ts
remaining = [...rng.shuffle(drawn.slice(0, -1)), drawn[drawn.length - 1]]
```

`drawn.slice(0, -1)` is every drawn item except the last, and `drawn[drawn.length - 1]` is the last one, now last again. The test for this tries 50 seeds, since one seed could pass by luck.

### Errors

- `choosePoolItems` **returns an empty list** when no item matches the tags. That's a player's choice, so the setup screen (chapter 04) will say "no items match" instead of starting.
- It **throws** for a pack id that doesn't exist. The setup screen only offers real packs, so that's a bug.
- `drawFrom` **throws** for a pool with no items at all. Step 6 makes the machine refuse to start with no items, so this never happens in play.

### The standard

§7 gets a new "Item pool" row in "what the format provides", with all three rules.

### Tests: `src/sdk/formats/team-turns/pool.test.ts`

13 tests. The full table is in [docs/tests.md](../tests.md#item-pool).

### Files changed

- `src/sdk/formats/team-turns/pool.ts`, `src/sdk/formats/team-turns/pool.test.ts` (new).
- `docs/game-standard.md` §7: the item pool rules.
- `docs/tests.md`: the new tests, and counts updated to 142.

### How to verify

1. `pnpm test` reports `142 passed` (129 before, 13 new).
2. Break the "just shown" rule: in `pool.ts`, replace the reshuffle line with `remaining = rng.shuffle(drawn)` and run `pnpm test`. "never draws the item just shown first after shuffling back in" fails. Change it back.
3. `pnpm typecheck` and `pnpm lint` pass.

---

## Step 5: The format's guards and actions

**What:** `src/sdk/formats/team-turns/rules.ts`: the context every team-turns game shares (`TeamTurnsContext`), the format's guard and its four actions, and a test for each (standard §12).

**Why:** these are the pieces the format's loop (step 6) is made of. Writing and testing them on their own first means that when step 6 joins them into a machine, each piece is already known to work.

### The context

```ts
interface TeamTurnsContext<Item, Turn, Config> {
  config: Config        // the settings from step 3
  scores: number[]      // one per team, same order as config.teams
  current: number       // whose turn: a position in config.teams
  round: number         // starting at 1
  turnEndsAt: number | null
  pool: ItemPool<Item>  // from step 4
  item: Item | null     // the card on screen
  turn: Turn            // the game's record of this turn
}
```

The format doesn't know what's inside `turn`. Charades will record items got and skipped; Name Ten a count. The format only stores it, starts a fresh one each turn, and asks the game what it's worth.

### The guard

| Guard | True when |
|---|---|
| `turnsRemaining` | Any team still has a turn to play: not yet the last team, or not yet the last round |

The standard called it `roundsRemaining`, but "are there rounds left?" is the wrong question: in the last round, the other teams still have to play. Dice Duel in chapter 01 used the same check under the same name. Step 9 updates the standard.

### The actions

| Action | What it does |
|---|---|
| `startTurn` | A fresh turn record (the game's `newTurn()`), and `turnEndsAt` set to `now` plus the turn's seconds |
| `drawItem` | Puts the next item from the pool on screen (`drawFrom`, step 4) |
| `bankPoints` | Adds what the turn record is worth (the game's `points(turn)`) to the current team's score |
| `advanceTeam` | Passes play to the next team, or back to the first team in the next round |

Each does one thing. The standard's list had `addPoints`; ADR 0004 replaced it with points worked out from the turn record, so it's `bankPoints` here.

### Actions built for a game

`startTurn` needs the game's `newTurn`, and `bankPoints` needs its `points`. So the actions aren't a fixed object. They're built by a function that takes those two from the game:

```ts
const actions = teamTurnsActions<Item, Turn, Config>({ newTurn, points })
```

The guard needs nothing from the game, so `teamTurnsGuards` is a plain object.

### `satisfies`

Both end with `satisfies Record<string, Guard<…>>` (or `Action<…>`). `satisfies` checks that every entry has the right shape, so each function's `context` and `rng` get their types, but it keeps the exact keys (`startTurn`, `drawItem`, …) instead of widening them to "any string". Step 6 needs those exact names.

The format's functions accept any event (`MachineEvent`), because they never read it. That lets them sit in a machine together with any game's events.

### Tests: `src/sdk/formats/team-turns/rules.test.ts`

8 tests, using a made-up game whose turn record is a list of guessed words worth a point each. Every action test also checks the context passed in is unchanged. The full table is in [docs/tests.md](../tests.md#team-turns-guards-and-actions).

### Files changed

- `src/sdk/formats/team-turns/rules.ts`, `src/sdk/formats/team-turns/rules.test.ts` (new).
- `docs/tests.md`: the new tests, and counts updated to 150.

### How to verify

1. `pnpm test` reports `150 passed` (142 before, 8 new).
2. Make the game end a turn late: in `rules.ts`, change `context.config.teams.length - 1` to `context.config.teams.length` and run `pnpm test`. "is false once the last team has played in the last round" fails. Change it back.
3. `pnpm typecheck` and `pnpm lint` pass.

---

## Step 6: `teamTurns`, the builder

**What:** `src/sdk/formats/team-turns/teamTurns.ts`, the function ADR 0004 chose. A game passes it its turn; it returns the whole machine. Tested with **Word Duel**, a small game that exists only in the format's tests.

**Why:** this is where steps 3 to 5 come together. After this step, a team-turns game can be written in a few dozen lines and played start to finish.

### Word Duel: why a test game

The format lives in `src/sdk/`, and lint forbids `sdk/` from importing `games/` (standard §9): the SDK must never depend on a particular game. So the format can't be tested with Charades. Word Duel is the stand-in: a team sees a word and guesses it (`got`, one point) or passes (`skip`) until time runs out. It's written exactly as a real game would be, never registered, and lives only in `teamTurns.test.ts`.

```ts
const wordDuel = teamTurns<string, WordTurn, WordEvent>()({
  newTurn: () => ({ got: [], skipped: [] }),
  points: (turn) => turn.got.length,
  phases: {
    turn: {
      interaction: 'flash_card',
      on: {
        got:     { actions: ['markGot', 'drawItem'] },
        skip:    { actions: ['markSkipped', 'drawItem'] },
        time_up: { to: 'turn_summary' },
      },
    },
  },
  guards: {},
  actions: { markGot: …, markSkipped: … },
})
```

That's the whole game. Compare it with Dice Duel in chapter 01, where every phase of the loop was written by hand.

### The format's loop

```ts
const formatPhases = {
  handoff: {
    interaction: 'handoff',
    on: { start: { to: 'turn', actions: ['startTurn', 'drawItem'] } },
  },
  turn_summary: {
    interaction: 'summary',
    on: {
      next: [
        { when: 'turnsRemaining', to: 'handoff', actions: ['bankPoints', 'advanceTeam'] },
        { to: 'results', actions: ['bankPoints'] },
      ],
    },
  },
  results: { interaction: 'leaderboard', final: true },
} as const
```

The step 5 pieces, in order. `start` begins a turn (fresh record and timer, then the first card). `next` on the summary banks the points, then either passes to the next team or, after the last turn, goes to the results. Both branches bank the points, so the last turn counts too.

`as const` keeps the exact strings (`'turn'`, not just `string`), so they can be checked against the machine's names.

### Building the machine

```ts
phases:  { ...game.phases, ...formatPhases },
guards:  { ...game.guards, ...teamTurnsGuards },
actions: { ...game.actions, ...teamTurnsActions<Item, Turn, Config>(game) },
```

This uses `...`, the thing ADR 0004 rejected. The difference: the trap was in letting TypeScript *work out names* from the combined object. Here the names are already fixed by the game's own object (the second call's `game` parameter) before anything is combined. The format's parts go last, so even code without types can't replace them.

`context` builds the starting context: the settings, scores at zero, the first team, round 1, and the items shuffled into a pool. It throws if there are no items: a game with nothing to draw can't be played, and failing at the start is clearer than failing on the first card.

### The types

`TeamTurnsGame` is what a game can pass. Each part does one job:

```ts
phases: Record<Phase, GamePhase<…>> & { turn: unknown } & Taken<TeamTurnsPhase>
guards: Record<GuardName, Guard<…>> & Taken<FormatGuardName>
actions: Record<ActionName, Action<…>> & Taken<FormatActionName>
```

- **`Record<Phase, GamePhase<…>>`**: as in `defineMachine`, the phase names are worked out from the keys.
- **`GamePhase`** is a game's phase: like a machine phase, but it can't be `final`, and its transitions can go only to the game's phases or `turn_summary`. That's what makes `to: 'results'` an error.
- **`{ turn: unknown }`**: there must be a key called `turn`. Its shape is already checked by the `Record`.
- **`Taken<…>`** is `{ handoff?: never, turn_summary?: never, … }`. `never` is the type with no values, so writing any of those keys is an error. It's how the format reserves its names.

The result type, `TeamTurnsMachine`, is a plain `MachineDefinition` whose names are the game's plus the format's. That's why `start`, `send`, `isFinal` and `validateMachine` needed no changes.

### The one unchecked line

```ts
return machine as unknown as TeamTurnsMachine<…>
```

`as` tells TypeScript "trust me" about a type. Inside `teamTurns`, the game's events are still a type parameter (`Event`): TypeScript doesn't yet know which events a particular game has, so it can't confirm that `start` and `next` fit the combined event list. We know they do, because the builder adds them. Rather than bend the types until TypeScript agrees, the result is declared once, with a comment saying why. Both halves are still checked: the game's by `TeamTurnsGame`, the format's by the tests below.

### Tests: `src/sdk/formats/team-turns/teamTurns.test.ts`

12 runtime tests: Word Duel played start to finish, `validateMachine`, the turn record and when its points are banked, reshuffling in a long game, determinism, and save and reload halfway through.

9 compile-time checks: each of ADR 0004's mistakes is a type error on the game's own line. Before writing them down, each was checked to fail for the reason in its comment, not by accident.

The full tables are in [docs/tests.md](../tests.md#teamturns-word-duel).

### Files changed

- `src/sdk/formats/team-turns/teamTurns.ts`, `src/sdk/formats/team-turns/teamTurns.test.ts` (new).
- `docs/tests.md`: the new tests and Word Duel; counts updated to 162 runtime tests and 23 compile-time checks.

### How to verify

1. `pnpm test` reports `162 passed` (150 before, 12 new).
2. `pnpm typecheck` passes, which proves the 9 mistakes are still type errors. To see one: in `teamTurns.test.ts`, delete the `// @ts-expect-error` line above `'turn_sumary'`, run `pnpm typecheck`, and read the error on that line. Put the comment back.
3. Make the last turn not count: in `teamTurns.ts`, change `{ to: 'results', actions: ['bankPoints'] }` to `{ to: 'results' }` and run `pnpm test`. "plays from the first handoff to the results" fails with scores 4 and 2 instead of 4 and 4. Change it back.
4. `pnpm lint` passes.

---

## Step 7: `defineGame`

**What:** `src/sdk/game/defineGame.ts`: the function every game's `index.ts` exports (standard §3), with `GameMeta`, the schema for what the library shows about a game, and tests.

**Why:** the app (chapter 04) needs one object per game that holds everything about it: what to show in the library, where its content is, which settings it has, and its machine. `defineGame` is that object's shape, and the place where mistakes TypeScript can't see are caught.

### What's in it now

```ts
defineGame({
  meta:    { id, name, tagline, icon, format: 'team-turns', players, complexity, tags, contributors },
  content: { itemSchema, itemKey, packs },
  config:  { schema, presets? },
  machine,
})
```

Compared with standard §3 before this step, three things changed:

1. **`content.itemKey` is new.** The item pool (step 4) needs it to keep each item once, and only the game knows what makes two of its items the same.
2. **`config.defaults` is gone.** The defaults already live in the config schema (`.default(3)` in step 3). A second list would be a second place to update, and sooner or later the two would disagree.
3. **`views` and `rules` aren't there yet.** Views are built in chapter 04 and Charades' rules in chapter 05. Each is added then, as a **required** field. Adding them now as optional would let a game with no screens type-check, and nothing would force it to change later.

### What the types check

`defineGame`'s type parameters are worked out from the game, and every part must agree:

- The **item type** from `itemSchema` must be the one the packs hold and the one the machine plays. A machine for `{ word }` items with `{ text }` packs is a type error.
- The **settings type** from `config.schema` must be the one the machine was built with.
- **Presets** can't set `teams`: players always name their own.

### What it checks when the game loads

Types can't check values like "complexity is between 1 and 5" or "this preset's pack exists". `defineGame` does, and throws one error listing every problem, the same way `loadPacks` does for packs:

```
Game "word-duel" has problems:
  meta.id: Use lowercase words joined by hyphens, e.g. "movies-90s"
  meta.complexity: Too big: expected number to be <=5
  config.presets.0.packs: No pack with id "anime"
```

- **`meta`**: kebab-case id, a name, tagline and icon, complexity 1 to 5, `players.max` at least `players.min`, at least one contributor (GitHub usernames, the same rule as packs).
- **At least one pack.**
- **Each preset**: a unique kebab-case id, a name, contributors, at least one pack, only packs that exist, and settings that pass the game's config schema. That last check runs the preset's settings through the schema with two placeholder team names, since presets never include teams.

Because a game's tests import its `index.ts`, a broken game fails CI, never a player's phone.

### Compile-time checks that would throw

`defineMachine`'s tests list their mistakes in a plain array. `defineGame` also checks values when it runs, so one of the mistakes (`format: 'host-led'`) would throw as soon as the test file loads. Each mistake is wrapped in a function that's never called, `() => defineGame({ … })`, so TypeScript still checks it but it never runs.

### Tests: `src/sdk/game/defineGame.test.ts`

8 runtime tests and 3 compile-time checks. The full tables are in [docs/tests.md](../tests.md#definegame).

### Files changed

- `src/sdk/game/defineGame.ts`, `src/sdk/game/defineGame.test.ts` (new).
- `docs/game-standard.md` §3: the example matches `defineGame`, with what it checks, where defaults live, and a note on `views` and `rules`. §13: the Definition of Done line matches.
- `docs/tests.md`: the new tests; counts updated to 170 runtime tests and 26 compile-time checks.

### How to verify

1. `pnpm test` reports `170 passed` (162 before, 8 new).
2. `pnpm typecheck` passes, so the 3 mistakes are still type errors.
3. Break a check: in `defineGame.ts`, change `complexity: z.int().min(1).max(5)` to `.max(6)` and run `pnpm test`. "reports problems in meta, with where each is" fails. Change it back.
4. `pnpm lint` passes.

---

## Step 8: Core Charades

**What:** Charades becomes a real game on the format:

- `src/games/charades/machine.ts`: the turn, written with `teamTurns`.
- `src/games/charades/index.ts`: the game's single `defineGame` export.
- `src/games/charades/machine.test.ts`: a full game with real content, `validateMachine`, and a test per action.

**Why:** this is what the chapter was for. Everything in steps 3 to 7 exists so that a game looks like this.

### The machine

```ts
export const machine = teamTurns<CharadesItem, CharadesTurn, CharadesEvent>()({
  newTurn: () => ({ got: [], skipped: [] }),
  points: (turn) => turn.got.length,
  phases: {
    turn: {
      interaction: 'flash_card',
      on: {
        got:     { actions: ['markGot', 'drawItem'] },
        skip:    { actions: ['markSkipped', 'drawItem'] },
        time_up: { to: 'turn_summary' },
      },
    },
  },
  guards: {},
  actions: { markGot: …, markSkipped: … },
})
```

It's Word Duel from step 6, with real Charades items instead of strings. That's the point of the format: the difference between games is the turn.

The rules, as decided for this chapter:

| Event | What happens |
|---|---|
| `got` | The item on screen goes into the turn's `got` list (worth 1 point), and the next item comes up |
| `skip` | The item goes into `skipped` (worth nothing, no penalty), and the next item comes up |
| `time_up` | The turn ends. The item on screen isn't recorded: it wasn't guessed or passed |

`context.item!`: the `!` tells TypeScript that `item` isn't null here. It can only be null before the first draw, and `got` and `skip` only exist in `turn`, which the handoff enters after drawing.

**Left for chapter 05:** modes (every item is played as "describe" for now), double points for acting or singing, the skip penalty, Charades' own settings and presets, `rules.md` and the game's README.

### `index.ts`

```ts
export default defineGame({
  meta: { id: 'charades', name: 'Charades', tagline: 'Act it out. Beat the clock.', … },
  content: { itemSchema, itemKey, packs: loadPacks(import.meta.glob('./content/*.json', …), itemSchema, itemKey) },
  config: { schema: TeamTurnsConfig },
  machine,
})
```

Charades has no settings of its own yet, so it uses the format's. Nothing imports `index.ts` except its tests: the game list in `src/app/registry/` comes in chapter 04, so players still won't see Charades until it has screens.

### Testing with real content

The SDK's tests use made-up games, because the SDK can't import a game. A game's own tests use its real content. `machine.test.ts` picks items from the real Back to School pack with `choosePoolItems`, exactly as the app will in chapter 04, and plays a whole game: 2 teams, 3 rounds, each turn got, got, skip, got, time up. That's 30 draws from 34 items, so the test also checks no item came up twice.

### Tests: `src/games/charades/machine.test.ts`

9 tests: the game definition, `validateMachine`, each event, a full game, and one for each of Charades' two actions (standard §12). The full table is in [docs/tests.md](../tests.md#charades-machine).

### Files changed

- `src/games/charades/machine.ts`, `src/games/charades/index.ts`, `src/games/charades/machine.test.ts` (new).
- `docs/tests.md`: the new tests, and counts updated to 179.

### How to verify

1. `pnpm test` reports `179 passed` (170 before, 9 new).
2. Add a skip penalty by mistake: in `machine.ts`, change `points: (turn) => turn.got.length` to `turn.got.length - turn.skipped.length` and run `pnpm test`. "skip: … with no penalty" and the full game fail. Change it back.
3. `pnpm typecheck`, `pnpm lint`, `pnpm validate-content` and `pnpm build` pass.

---

## Step 9: The standard matches the code

**What:** bring the Game Standard in line with what this chapter built. No code changes.

**Why:** the standard is the contract contributors read. Before this step, parts of it described a design we'd since changed: guard and action names that don't exist (`roundsRemaining`, `addPoints`, `startTimer`), and a machine example that wrote all of Charades with `defineMachine`, which no team-turns game does any more. A contract that disagrees with the code is a bug (steps 4 and 7 already fixed §3 and the item pool rules as they went).

### Changes

- **§4 Machine contract:** the vocabulary uses real names (`turnsRemaining`, `markGot`). The example is now a small dice game written with `defineMachine`, the same one the SDK's tests use, followed by a note that games in a format don't write the whole machine: they pass their turn to the format, and everything in §4 applies to the result.
- **§7 Formats, "what the format provides":** each row now names what exists. Setup is `TeamTurnsConfig` with its limits and defaults. The phases are `handoff → turn → turn_summary → results`, with `round_summary` added only when a game needs it. The context lists `TeamTurnsContext`'s fields. The guards and actions are `turnsRemaining`, `startTurn`, `drawItem`, `bankPoints` and `advanceTeam`. Views are marked as being built.
- **§7, new "how a game plugs in":** the Charades example with `teamTurns`, and its rules, summarising ADR 0004.
- **§9 Repo layout:** `sdk/` lists `game/`, `content/` and `formats/<format>/`.

### Files changed

- `docs/game-standard.md` §4, §7, §9.
- `docs/tutorial/03-team-turns-format.md`: this section and the chapter summary.

### How to verify

1. Search `docs/game-standard.md` for `roundsRemaining`, `addPoints`, `startTimer` and `scorePoint`: none are left.
2. Every name in §7's tables exists in `src/sdk/formats/team-turns/`.
3. All five checks pass: `pnpm typecheck`, `pnpm lint`, `pnpm test` (179 passed), `pnpm validate-content`, `pnpm build`.

---

## Chapter 03 done

The team-turns format is real, and Charades is built on it:

- `src/sdk/formats/team-turns/`: the settings (`config.ts`), the item pool (`pool.ts`), the format's guards and actions (`rules.ts`), and `teamTurns` (`teamTurns.ts`), the builder from ADR 0004.
- `src/sdk/game/`: `defineGame`, with checks for meta, packs and presets.
- `src/games/charades/`: core Charades (`machine.ts`) and its `index.ts`, playing a full game with the real Back to School pack in tests.
- Word Duel, a test-only game, proves the format works and that a game's mistakes are type errors on its own lines.

179 tests and 26 compile-time checks. Still no screens.

Next: chapter 04, the app shell: the game list, the setup screen (teams, rounds, timer, packs and tags), play and results screens, the interaction primitives, theme tokens, and save and resume. Core Charades becomes playable on a phone.
