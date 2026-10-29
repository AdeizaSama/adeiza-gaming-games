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
