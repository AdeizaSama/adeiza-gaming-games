# Test catalog

Every automated test in the repo, in plain English: what it checks, what goes in, what must come out, and why it matters. Read this to understand what the tests protect without opening the code.

**Keep it in sync.** A pull request that adds, removes or changes a test updates this file in the same commit. The "Test" column is the test's name in the code, so you can search for it.

**Counts:** 76 runtime tests (`pnpm test`) and 14 compile-time checks (`pnpm typecheck`).

| Area | File | Runtime tests | Compile-time checks |
|---|---|---|---|
| [Random numbers](#random-numbers-rng) | `src/sdk/rng.test.ts` | 13 | |
| [Machine types](#machine-types) | `src/sdk/machine/types.test.ts` | 1 | 7 |
| [defineMachine](#definemachine) | `src/sdk/machine/defineMachine.test.ts` | 2 | 7 |
| [Runner](#runner) | `src/sdk/machine/runner.test.ts` | 16 | |
| [validateMachine](#validatemachine) | `src/sdk/machine/validateMachine.test.ts` | 4 | |
| [Full game](#full-game-dice-duel) | `src/sdk/machine/fullGame.test.ts` | 6 | |
| [Content packs](#content-packs) | `src/sdk/content/pack.test.ts` | 12 | |
| [Duplicate items](#duplicate-items) | `src/sdk/content/duplicates.test.ts` | 10 | |
| [Loading packs](#loading-packs) | `src/sdk/content/loadPacks.test.ts` | 12 | |

**Two kinds of test:**

- **Runtime tests** run code and compare the result with what's expected. `pnpm test` runs them.
- **Compile-time checks** are deliberate mistakes, each marked `@ts-expect-error`. They prove TypeScript rejects the mistake. If a change makes one of them stop being an error, `pnpm typecheck` fails with "Unused '@ts-expect-error' directive". Nothing runs; the check is that the code *doesn't* compile.

**Toy games.** The SDK tests use small made-up games instead of real ones, so they don't depend on any game's code:

| Toy game | Used in | What it is |
|---|---|---|
| Dice (roll to target) | types, defineMachine | Two phases (`playing`, `done`). Roll a die until the score reaches a target. |
| Counter | runner | Not a game. One phase that adds, doubles and rolls numbers, and three end phases, so every part of the runner gets exercised. |
| Dice Duel | full game | Shaped like the team-turns format: teams take timed turns rolling dice over several rounds. |
| `{ text }` items | content packs, duplicates, loading packs | Items standing in for a real game's. In the duplicate tests they may also have `modes`, like Charades items, and the key is `text`. |

---

## Random numbers (Rng)

`src/sdk/rng.test.ts`, testing `src/sdk/rng.ts`.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 1 | gives the same sequence for the same seed | Seeding | Seed 42, twice; 5 draws each | Both lists identical | Repeatable games and tests depend on this. |
| 2 | gives a different sequence for a different seed | Seeding | Seeds 42 and 43; 5 draws each | The lists differ | If every seed gave the same draws, every game would deal the same cards. |
| 3 | produces the known mulberry32 values for seed 42 | Algorithm pinning | Seed 42; 3 draws | Exactly `0.6011…`, `0.4482…`, `0.8524…` | Locks the algorithm. Changing it would change every saved game's future draws, so this makes that a deliberate decision, not an accident. |
| 4 | continues the same sequence from a saved state | Resume | Draw twice from seed 7, save the state, make a new Rng from it | The next two draws match the original's | This is how a refreshed game continues with the same cards. |
| 5 | stays between 0 (inclusive) and 1 (exclusive) | `next()` | 10,000 draws from seed 1 | Every value ≥ 0 and < 1 | Code that turns draws into list positions would break at exactly 1. |
| 6 | stays within min and max, and reaches both | `int()` | `int(1, 6)` 1,000 times | Every value 1–6 appears, nothing else | Catches off-by-one mistakes at either end (a die that never rolls 6). |
| 7 | returns min when min equals max | `int()` | `int(3, 3)` | `3` | An edge case that must not crash or return 4. |
| 8 | rejects min greater than max | `int()` | `int(6, 1)` | Throws `RangeError` | A game bug should fail loudly, not quietly return a strange number. |
| 9 | rejects numbers that are not whole | `int()` | `int(0, 2.5)` | Throws `RangeError` | Same reason: a fraction here is always a bug. |
| 10 | keeps every item exactly once | `shuffle()` | `['a','b','c','d','e']` | Same five items, none lost or repeated | A shuffle that dropped or doubled a card would be invisible until mid-game. |
| 11 | does not change the original array | `shuffle()` | Shuffle a list, then look at the original | Original unchanged | Actions must never change data they're given; a shuffle that did would make that rule easy to break. |
| 12 | gives the same order for the same seed | `shuffle()` | Same list, seed 42, twice | Same order both times | Repeatable deals. |
| 13 | handles empty and single-item arrays | `shuffle()` | `[]` and `['a']` | `[]` and `['a']` | Edge cases that must not crash. |

## Machine types

`src/sdk/machine/types.test.ts`, testing `src/sdk/machine/types.ts`. Uses the Dice toy game.

### Runtime test

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 14 | describe a machine whose context, guards and actions work together | The machine types | Build the context (target 10), roll once, ask the `reachedTarget` guard about a score of 10 | Score is 1–6; the original context still has score 0; the guard says yes | Shows the types describe a working game, and that actions return a new context instead of changing the old one. |

### Compile-time checks

Each row is a mistake TypeScript must reject.

| # | Mistake | Example | Why |
|---|---|---|---|
| C1 | Initial phase that doesn't exist | `initial: 'start'` | The game would start in a phase with no view. |
| C2 | Event the game doesn't have | `on: { jump: … }` | A phase reacting to an event no view can send is dead code, usually a typo. |
| C3 | Moving to a phase that doesn't exist | `to: 'finished'` (meant `done`) | The game would move to nowhere and crash. |
| C4 | Unknown action name | `actions: ['rolDie']` | A typo would silently skip the action. |
| C5 | Unknown guard name | `when: 'reachTarget'` | A typo would break the choice between transitions. |
| C6 | A guard is used but never written | `guards: {}` | The game would crash the first time it needs that guard. |
| C7 | An action returns only part of the context | `() => ({ score: 0 })` | The rest of the game's data would vanish. |

## defineMachine

`src/sdk/machine/defineMachine.test.ts`, testing `src/sdk/machine/defineMachine.ts`. The same Dice toy game, written the way game authors will write theirs.

### Runtime tests

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 15 | returns the definition unchanged | `defineMachine` at runtime | A one-phase definition | The exact same object back | `defineMachine` exists only for type checking; it must not alter the game. |
| 16 | works out the phase, guard and action names from the definition | Name inference | The Dice game | Phases are `playing \| done`, guards `reachedTarget`, actions `rollDie \| resetScore` | Authors never list names twice. Checked by `pnpm typecheck`; at runtime it does nothing. |

### Compile-time checks

| # | Mistake | Example | Why |
|---|---|---|---|
| C8 | Initial phase that doesn't exist | `initial: 'start'` | As C1, but proving it still works when names are worked out automatically. |
| C9 | Moving to a phase that doesn't exist | `to: 'finished'` | As C3. |
| C10 | Unknown action name | `actions: ['rolDie']` | As C4. |
| C11 | A guard is used but never written | `when: 'reachedTarget'` with `guards: {}` | The error must point at the line using the guard, not somewhere confusing. |
| C12 | Event the game doesn't have | `on: { jump: … }` | As C2. |
| C13 | An action returns only part of the context | `() => ({ score: 0 })` | As C7. |
| C14 | A final phase that lists events | `final: true, on: { reset: … }` | A finished game ignores all events, so these would never run. |

## Runner

`src/sdk/machine/runner.test.ts`, testing `src/sdk/machine/runner.ts`. Uses the Counter toy machine. Unless noted, the time passed in is 1,000.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 17 | begins in the initial phase with context built from the input | `start` | Start at 5 | Phase `counting`; value 5, empty log, no timestamp | A new game is set up from the players' choices. |
| 18 | stores the random sequence position | `start` | Seed 42 | `rngState` is 42 | The saved game must know where the random sequence starts. |
| 19 | runs the actions of a matching transition | `send` | Value 1, event "add 4" | Value 5 | The basic job of the runner. Also shows actions can read data from the event (the 4). |
| 20 | stays in the same phase when the transition has no `to` | `send` | Event "add 1" | Still `counting` | Scoring a point mid-turn shouldn't leave the turn. |
| 21 | runs actions in the order they are listed | `send` | Value 1; "add then double", and separately "double then add" | 4 and 3 | Order matters ("score, then draw the next card"); each action gets the previous one's result. |
| 22 | picks the first transition whose guard passes | Guards | Value 150, event `next`; value −3, event `next` | `big`; `negative` | The game picks the right path ("another round" vs "results"). |
| 23 | falls back to the transition without a guard when no guard passes | Guards | Value 10, event `next` | `done` | The fallback path always exists, so the game can't get stuck. |
| 24 | ignores an event the current phase does not list, returning the same state object | Ignored events | Event `unused` | The exact same state object | A double tap or stray event must not crash or change the game. Returning the same object lets the app tell nothing happened. |
| 25 | ignores every event once the game has ended | Final phases | Reach `done`, then send "add 1" | The exact same state object | Nothing can change a finished game's result. |
| 26 | passes the time it is given to actions | Time | Event `stamp` at time 1,234 | Timestamp 1,234 | Timers use the time the app passes in, never the clock directly, so they're testable. |
| 27 | never changes the state it is given | Immutability | Send two events to one state, compare with a copy taken before | Unchanged | The app keeps old states (for saving, and later undo); changing them would corrupt saved games. |
| 28 | moves the random sequence forward when an action draws from it | Randomness | Seed 7, event `roll` | New `rngState` differs from the old | Otherwise every roll would give the same number. |
| 29 | continues one random sequence across events, as if a single Rng made every draw | Randomness | Seed 99, five `roll` events | Same five rolls as one Rng with seed 99 rolling five times | Rebuilding the Rng for each event must not restart or skip the sequence. |
| 30 | gives the same results for the same seed and events | Determinism | The five rolls above, played twice | Identical both times | Any game can be replayed exactly to reproduce a bug. |
| 31 | continues identically after the state is saved and loaded (resume after refresh) | Save and resume | Roll once, save as JSON, load it back, roll twice more on both copies | Both end in the same state | A refresh mid-game continues with exactly the same draws. |
| 32 | is false while playing and true in a final phase | `isFinal` | A new game; then the same game after reaching `done` | `false`; `true` | The app uses this to show the results screen. |

## validateMachine

`src/sdk/machine/validateMachine.test.ts`, testing `src/sdk/machine/validateMachine.ts`.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 33 | finds nothing wrong with the fallback last | Valid machines | `next`: guarded transition, then fallback | No problems | Correct machines must not get false alarms. |
| 34 | ignores single transitions and lists with no fallback | Valid machines | A single transition; a list of two guarded transitions | No problems | These can't contain an unreachable transition. |
| 35 | reports a guarded transition placed after the fallback | The check | `next`: fallback first, guarded transition second | One message naming the phase, the event and transition 2, explaining how to fix it | A transition after the fallback can never run; TypeScript can't see this, so this check does. |
| 36 | reports every unreachable transition, including a second fallback | The check | `next`: guarded, fallback, guarded, fallback | Two problems: transitions 3 and 4 | Every mistake is reported at once, not one per test run. |

## Full game (Dice Duel)

`src/sdk/machine/fullGame.test.ts`. Plays the Dice Duel toy game end to end with 2 teams (Red, Blue), 2 rounds and 30-second turns. Each turn is: start, roll three times, time up, next.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 37 | has no mistakes validateMachine can find | `validateMachine` | Dice Duel | No problems | Every game's tests must include this (standard §12). |
| 38 | plays from the first handoff to the results | Full playthrough | Seed 2026, play until the game ends | 4 turns (2 teams × 2 rounds); back at the handoff between turns; ends in `results`, round 2, timer cleared | Proves the whole loop (handoff → turn → summary → next team or results) works, not just single steps. |
| 39 | gives the same result every time for the same seed | Determinism | Seed 2026, full game | Turn order Blue, Red; scores 18 and 16 | Pins a whole game. If the runner, the Rng or the game changes, these numbers change, and someone has to decide whether that was intended. |
| 40 | keeps every state plain JSON, so it can be saved | Saving | Every state of a full game | Each survives conversion to JSON and back unchanged | Anything that isn't plain data (a function, a date) would be lost when the game is saved. |
| 41 | finishes the same way after a save and reload halfway through | Save and resume | Play 2 turns, save as JSON, reload, finish both copies | Same ending as each other, and as a game never saved | Resume after refresh, tested on a whole game instead of a single event. |
| 42 | sets the turn timer from the time it is given | Timers | Start a turn at time 5,000 | `turnEndsAt` is 35,000 (5,000 + 30 seconds) | The countdown comes from the time the app passes in. |

## Content packs

`src/sdk/content/pack.test.ts`, testing `src/sdk/content/pack.ts`. Starts from a valid pack (id `animals`, language `en`, maturity `everyone`, contributor `AdeizaSama`, items Elephant and Penguin) and changes one field at a time. "Rejected at X" means the error points at field X.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 43 | accepts a valid pack | Pack schema | The valid pack | Accepted, unchanged | Correct packs must pass. |
| 44 | accepts a $schema path for editors | `$schema` | Valid pack plus a `$schema` path | Accepted | The line that gives editors autocomplete must not break the strict check. |
| 45 | rejects an unknown field, such as a typo | Strict fields | Valid pack plus `"maturty": "teen"` | Rejected as an unknown field | Without this, a misspelled field name is silently ignored. Applies to field names only; the words in a pack can be anything. |
| 46 | rejects a missing field | Required fields | `description` removed | Rejected at `description` | Every pack needs all its shared fields. |
| 47 | checks the id is kebab-case | `id` | `movies-90s`; then `Movies`, `movies_90s`, `movies--90s`, `-movies`, `movies-`, empty | First accepted; the rest rejected at `id` | Ids appear in filenames and presets; one spelling style avoids mix-ups. |
| 48 | rejects a blank name or description | `name`, `description` | Name of only spaces; empty description | Rejected at `name`; at `description` | The library shows these; spaces alone count as blank. |
| 49 | checks the language code | `language` | `en`, `en-GB`, `pt-BR`, `yo`, `zh-Hans`; then `English`, `EN`, `e`, `en_GB`, empty | First five accepted; the rest rejected at `language` | Language codes follow the standard browsers use. |
| 50 | accepts only the three maturity levels | `maturity` | `everyone`, `teen`, `adult`; then `kids` | First three accepted; `kids` rejected | The library filters by these exact values. |
| 51 | needs at least one contributor, each a GitHub username | `contributors` | Two valid usernames; then none; `@AdeizaSama`; `two words`; a 40-character name | First accepted; empty rejected at `contributors`; the rest at `contributors.0` | Credit is required, and must be a real GitHub username format. |
| 52 | checks each item against the game's item schema | Items | Second item with empty text; an item with an extra field | Rejected at `items.1.text`; at `items.0` | Errors point contributors at the exact item to fix. |
| 53 | needs at least one item | Items | `items: []` | Rejected at `items` | An empty pack is almost always a mistake. |
| 54 | gives packs the Pack<Item> type | Types | The schema's inferred type | Exactly `Pack<{ text: string }>` | The type code uses and the check CI runs can't drift apart. Checked by `pnpm typecheck`. |

## Duplicate items

`src/sdk/content/duplicates.test.ts`, testing `src/sdk/content/duplicates.ts`. Items are `{ text, modes? }` and the key is `text`, as it will be for Charades. Positions start at 0.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 55 | finds nothing in a list without duplicates, or an empty list | `findDuplicates` | Goku, Naruto, Luffy; and an empty list | No duplicates for either | Packs without repeats must not get false alarms. |
| 56 | reports where the extra copy is and where the first copy is | `findDuplicates` | Goku, Naruto, Goku | One duplicate: position 2, first copy at 0, key `Goku` | The content check uses the positions to tell contributors exactly which lines clash. |
| 57 | reports every extra copy, each pointing at the first | `findDuplicates` | a, b, a, a | Positions 2 and 3, both pointing at 0 | All repeats are reported at once, not one per CI run. |
| 58 | ignores case and extra spaces | Key comparison | `Monkey D. Luffy`, ` monkey d. luffy `, `MONKEY  D.  LUFFY` | Positions 1 and 2 are duplicates | Small typing differences mustn't hide a repeat. |
| 59 | treats the two ways of storing an accented letter as the same | Key comparison | `Pokémon` with é as one character, and with e plus a separate accent mark | One duplicate | The two look identical on screen, so they must count as the same word. Different keyboards and editors produce different forms. |
| 60 | keeps words that differ only by accents apart | Key comparison | `ọkọ` and `oko` | No duplicates | In languages like Yoruba, accents change the word (husband vs farm). Stripping them would wrongly remove real items. |
| 61 | compares only the key, not the other fields | Key comparison | Goku (act) and Goku (describe) | One duplicate | It's the same word to players, whatever mode it's tagged with. |
| 62 | keeps the first copy of each item, in the original order | `uniqueBy` | Goku (act), Naruto, goku (describe) | Goku (act), Naruto | When players pick two packs that share a word, it appears once, taken from the first pack picked. |
| 63 | returns every item when there are no duplicates, without changing the original | `uniqueBy` | Goku, Naruto | A new list with both; the original unchanged | Game data is never changed in place (the same rule as actions). |
| 64 | handles an empty list | `uniqueBy` | An empty list | An empty list | Edge case that must not crash. |

## Loading packs

`src/sdk/content/loadPacks.test.ts`, testing `src/sdk/content/loadPacks.ts`. Items are `{ text }` and the key is `text`. Packs are built from an id and item texts; unless noted, the file is `./content/anime.json`.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 65 | returns the pack when everything is right | `checkPack` | Pack `anime` with Goku and Naruto | OK, with the pack | Valid packs pass. |
| 66 | lists every schema problem, each with where it is | `checkPack` | Maturity `kids` and an empty second item | Two problems: at `maturity` and `items.1.text` | Contributors see everything wrong in one go. |
| 67 | reports a file that is not a pack at all as a problem with the whole file | `checkPack` | The text `"not a pack"` | One problem with an empty path (the whole file) | A badly broken file still gets a clear report instead of a crash. |
| 68 | rejects an id that does not match the file name | Id = file name | Pack `manga` in `anime.json` | One problem at `id`: must be `"anime"` | Keeps ids unique (file names in a folder are) and makes packs easy to find. |
| 69 | reads the file name from any kind of path | Id = file name | `./content/anime.json`, a Linux path, a Windows path with `\`, and just `anime.json` | All OK | The app (Vite paths) and the CI script (full paths, on any OS) must agree. |
| 70 | rejects an item listed twice, pointing at both copies | Duplicates | Goku, Naruto, goku | One problem at `items.2`: already in the pack at `items.0` | Uses the item key, so case differences still count as repeats. |
| 71 | reports the id and duplicates together | Reporting | Pack `manga` in `anime.json`, with Goku twice | Problems at `id` and `items.1` | All problems after the shape check come in one report. |
| 72 | skips the id and duplicate checks while the shape is wrong | Reporting | Wrong id, Goku twice, and maturity `kids` | Only the `maturity` problem | The id and duplicate checks need a pack whose shape is known; they run once the shape is fixed. |
| 73 | returns every pack, sorted by id | `loadPacks` | `movies.json`, then `anime.json` | `anime`, `movies` | Same order on every device, whatever order the files come in. |
| 74 | returns no packs for no files | `loadPacks` | No files | An empty list | A game without packs yet must not crash. |
| 75 | throws one error listing every problem in every file | `loadPacks` | `anime.json` with Goku twice, `movies.json` with id `films`, and a valid `ok.json` | One error naming both files, each with where and what | A developer sees every broken pack at once, with file names. |
| 76 | gives packs the item type from the item schema | Types | The result of `loadPacks` | Exactly `Pack<{ text: string }>[]` | Code using the packs knows their item shape. Checked by `pnpm typecheck`. |
