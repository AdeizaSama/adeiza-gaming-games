# Test catalog

Every automated test in the repo, in plain English: what it checks, what goes in, what must come out, and why it matters. Read this to understand what the tests protect without opening the code.

**Keep it in sync.** A pull request that adds, removes or changes a test updates this file in the same commit. The "Test" column is the test's name in the code, so you can search for it.

**Counts:** 241 runtime tests (`pnpm test`) and 29 compile-time checks (`pnpm typecheck`).

| Area | File | Runtime tests | Compile-time checks |
|---|---|---|---|
| [Random numbers](#random-numbers-rng) | `src/sdk/rng.test.ts` | 13 | |
| [Machine types](#machine-types) | `src/sdk/machine/types.test.ts` | 1 | 7 |
| [defineMachine](#definemachine) | `src/sdk/machine/defineMachine.test.ts` | 2 | 7 |
| [Runner](#runner) | `src/sdk/machine/runner.test.ts` | 16 | |
| [validateMachine](#validatemachine) | `src/sdk/machine/validateMachine.test.ts` | 4 | |
| [Full game](#full-game-dice-duel) | `src/sdk/machine/fullGame.test.ts` | 6 | |
| [Content packs](#content-packs) | `src/sdk/content/pack.test.ts` | 12 | |
| [Friendly messages](#friendly-messages) | `src/sdk/content/messages.test.ts` | 10 | |
| [Duplicate items](#duplicate-items) | `src/sdk/content/duplicates.test.ts` | 10 | |
| [Loading packs](#loading-packs) | `src/sdk/content/loadPacks.test.ts` | 12 | |
| [Finding games (scripts)](#finding-games-scripts) | `scripts/lib/games.test.ts` | 6 | |
| [Charades content](#charades-content) | `src/games/charades/schema.test.ts` | 8 | |
| [JSON Schemas (scripts)](#json-schemas-scripts) | `scripts/lib/jsonSchema.test.ts` | 8 | |
| [Loading game schemas (scripts)](#loading-game-schemas-scripts) | `scripts/lib/gameSchema.test.ts` | 4 | |
| [Content check (scripts)](#content-check-scripts) | `scripts/lib/validate.test.ts` | 6 | |
| [Team-turns config](#team-turns-config) | `src/sdk/formats/team-turns/config.test.ts` | 11 | |
| [Item pool](#item-pool) | `src/sdk/formats/team-turns/pool.test.ts` | 13 | |
| [Team-turns guards and actions](#team-turns-guards-and-actions) | `src/sdk/formats/team-turns/rules.test.ts` | 8 | |
| [teamTurns (Word Duel)](#teamturns-word-duel) | `src/sdk/formats/team-turns/teamTurns.test.ts` | 13 | 9 |
| [defineGame](#definegame) | `src/sdk/game/defineGame.test.ts` | 10 | 6 |
| [Charades machine](#charades-machine) | `src/games/charades/machine.test.ts` | 9 | |
| [App](#app) | `src/app/App.test.tsx` | 4 | |
| [Theme tokens](#theme-tokens) | `src/app/theme.test.ts` | 3 | |
| [UI components](#ui-components) | `src/ui/ui.test.tsx` | 5 | |
| [Game session](#game-session) | `src/sdk/game/useGameSession.test.ts` | 9 | |
| [Interaction primitives](#interaction-primitives) | `src/sdk/interactions/interactions.test.tsx` | 8 | |
| [Summary and Leaderboard](#summary-and-leaderboard) | `src/sdk/interactions/summary.test.tsx` | 4 | |
| [Team-turns views](#team-turns-views) | `src/sdk/formats/team-turns/views/views.test.tsx` | 3 | |
| [Game screen](#game-screen) | `src/app/play/GameScreen.test.tsx` | 2 | |
| [Setup screen](#setup-screen) | `src/app/setup/setup.test.tsx` | 7 | |
| [Saved game](#saved-game) | `src/app/play/savedGame.test.ts` | 12 | |
| [Play page](#play-page) | `src/app/play/PlayPage.test.tsx` | 2 | |

**Two kinds of test:**

- **Runtime tests** run code and compare the result with what's expected. `pnpm test` runs them.
- **Compile-time checks** are deliberate mistakes, each marked `@ts-expect-error`. They prove TypeScript rejects the mistake. If a change makes one of them stop being an error, `pnpm typecheck` fails with "Unused '@ts-expect-error' directive". Nothing runs; the check is that the code *doesn't* compile.

**Screen tests** are runtime tests that draw React components into a fake browser page (happy-dom) and look at the result the way a player would: by text and by role ("the button called Start"). Files that need the fake page start with `// @vitest-environment happy-dom`; every other test runs in plain Node.

**Toy games.** The SDK tests use small made-up games instead of real ones, so they don't depend on any game's code:

| Toy game | Used in | What it is |
|---|---|---|
| Dice (roll to target) | types, defineMachine | Two phases (`playing`, `done`). Roll a die until the score reaches a target. |
| Counter | runner | Not a game. One phase that adds, doubles and rolls numbers, and three end phases, so every part of the runner gets exercised. |
| Dice Duel | full game | Shaped like the team-turns format: teams take timed turns rolling dice over several rounds. |
| Word Duel | teamTurns | Built with the real team-turns format: a team sees a word and guesses it (`got`, one point) or passes (`skip`) until time runs out. Never registered as a game. |
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

## Finding games (scripts)

`scripts/lib/games.test.ts`, testing `scripts/lib/games.ts`. Each test creates a throwaway games folder in the system's temp directory and deletes it afterwards, so no test files are committed and the real `src/games` is never touched.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 77 | finds each game with its schema file and pack files, sorted | `findGames` | `trivia` (schema, 1 pack) and `charades` (schema, `movies.json`, `anime.json`) | Charades then Trivia, each with its `schema.ts` path and its packs in name order | The content scripts need every game and pack, in the same order on every computer. |
| 78 | reports a missing schema file as null | `findGames` | A game with a pack but no `schema.ts` | `schemaFile` is null | The content check can then say "this game has packs but no schema" instead of crashing. |
| 79 | gives no pack files for a game without a content folder | `findGames` | A game with only `schema.ts` | No pack files | A game being built may not have packs yet. |
| 80 | only counts .json files directly in the content folder as packs | `findGames` | `anime.json`, `notes.md`, and `drafts/old.json` | Only `anime.json` | Notes and drafts beside the packs aren't checked or loaded, matching the app's `content/*.json` pattern. |
| 81 | ignores files that are not game folders | `findGames` | A `README.md` in the games folder | No games | Only folders are games. |
| 82 | returns no games when the games folder does not exist yet | `findGames` | A folder path that doesn't exist | No games | The script must work before the first game exists. |

## Charades content

`src/games/charades/schema.test.ts`, testing `src/games/charades/schema.ts` and the real pack files in `src/games/charades/content/`. These are the first tests that belong to a game instead of the SDK.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 83 | needs only text, filling in no tags and describe-only | Defaults | `{ "text": "Puff puff" }` | Tags `[]`, modes `["describe"]` | Most items need nothing more, so contributors type as little as possible. |
| 84 | keeps tags and modes when they are given | Item schema | National Anthem with tag `ritual` and all three modes | The item unchanged | Defaults never overwrite what a contributor wrote. |
| 85 | rejects blank text and text longer than 50 characters | `text` | Spaces only; exactly 50 characters; 51 characters | Rejected; accepted; rejected | Every card needs words, and they must fit on a phone screen at arm's length. |
| 86 | checks tags are kebab-case and not repeated | `tags` | `street-game`; `Street Game`; `game` twice | Accepted; rejected at `tags.0`; rejected at `tags` | Consistent tags make filtering reliable; a repeated tag is a typo. |
| 87 | accepts only describe, act and sing as modes, at least one, not repeated | `modes` | `act`; `mime`; an empty list; `act` twice | Accepted; rejected at `modes.0`; rejected at `modes`; rejected at `modes` | The game only knows these three ways to clue. An empty list would make the item unplayable. |
| 88 | rejects an unknown field, such as the old available_types | Strict fields | An item with `available_types` | Rejected as an unknown field | Catches typos and field names from older formats instead of silently ignoring them. |
| 89 | identifies an item by its text | `itemKey` | Gala, with a tag and a mode | `"Gala"` | Duplicates are found by text only (step 3). |
| 90 | all pass the pack checks | Real packs | Every file in `content/`, loaded with `import.meta.glob` exactly as the app will | Loads without error and includes `back-to-school` | Checks the real content, the same way the app loads it. A broken pack makes this test file fail. |

## JSON Schemas (scripts)

`scripts/lib/jsonSchema.test.ts`, testing `scripts/lib/jsonSchema.ts` and the committed `schemas/` folder. The first four use a stand-in item schema with a required `text` and a `modes` field that has a default, like Charades.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 91 | requires the shared pack fields, but not $schema | `packJsonSchema` | The stand-in item schema | Required: id, name, description, language, maturity, contributors, items | Editors flag a missing field, but not a missing `$schema` line. |
| 92 | rejects unknown fields in packs and items, as the zod schema does | `packJsonSchema` | The stand-in item schema | `additionalProperties: false` on the pack and on items | Editors underline typos like `maturty`, matching what CI rejects. |
| 93 | makes item fields with a default optional, since contributors can leave them out | `packJsonSchema` | An item with `text` and a defaulted `modes` | Only `text` required | Editors must not demand `modes`, which contributors are told they can leave out. |
| 94 | names the game in its title | `packJsonSchema` | Game id `test` | Title `Ku Zo Wasa content pack: test` | Editors show which schema a file is using. |
| 95 | are named after the game | `schemaFileName` | `charades` | `charades.pack.schema.json` | Packs point at this exact name in `$schema`. |
| 96 | are written with 2-space indents and a final newline | `schemaFileText` | `{ a: 1 }` | Two-space indented JSON ending in a newline | Readable files whose changes show cleanly in pull requests. |
| 97 | matches the zod schemas (run `pnpm generate-schemas` if not) | Up-to-date check | Every game's `schema.ts`, and its file in `schemas/` | Each committed file equals a freshly generated one | If someone changes a schema without regenerating, editors would show old rules. This failing test names the fix. |
| 98 | has no schemas for games that no longer exist | Up-to-date check | The files in `schemas/` | Exactly one per game that has a `schema.ts` | Stops leftover files from a renamed or removed game. |

## Loading game schemas (scripts)

`scripts/lib/gameSchema.test.ts`, testing `scripts/lib/gameSchema.ts`.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 99 | returns itemSchema and itemKey when both are exported | `readGameSchema` | Exports with a zod schema, a key function and something else | The schema and the key | The two exports every game's `schema.ts` must have. |
| 100 | says when itemSchema is missing or is not a zod schema | `readGameSchema` | No `itemSchema`; an `itemSchema` that is a plain object | An error saying `schema.ts must export itemSchema` | A game developer's mistake gets a message saying what to add, not a crash deep inside zod. |
| 101 | says when itemKey is missing | `readGameSchema` | No `itemKey` | An error saying `schema.ts must export itemKey` | Same: a clear message for the developer. |
| 102 | loads a real game's schema.ts from a file path | `loadGameSchema` | The path of `src/games/charades/schema.ts` | A working schema (`{ text: "Gala" }` gets its defaults) and key | Proves scripts can load a game's `schema.ts` on its own, from a full path on any OS. |

## Friendly messages

`src/sdk/content/messages.test.ts`, testing `src/sdk/content/messages.ts`. Uses a stand-in schema with one field of each kind; each test changes one field of a valid object and checks the message.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 103 | says a field is missing | Missing fields | `name` left out | `"name" is missing` | zod's own message is `Invalid input: expected string, received undefined`. |
| 104 | names the expected kind of value and what was found | Wrong type | `count: "seven"`; `name: 7`; `tags: "x"` | `should be a number, found "seven"`; `should be text in quotes, found 7`; `should be a list in [ ], found "x"` | Says what to write, in words a non-coder knows. |
| 105 | names unknown fields and suggests a fix | Unknown fields | `maturty: "teen"` | `Unknown field "maturty": check the spelling, or remove it` | Points at the typo and says what to do. |
| 106 | lists the allowed values | Fixed values | `level: "kids"` | `"level" must be one of "everyone", "teen", "adult"` | The fix is in the message. |
| 107 | says a field with a fixed list of values is missing, rather than wrong | Missing fields | `level` left out | `"level" is missing` | zod reports this as a wrong value, which would send contributors looking for a value they never wrote. Happens whenever the field's name is misspelled. |
| 108 | names the list when an entry in it is wrong | List entries | `modes: ["act", "mime"]` | `Each entry in "modes" must be one of "describe", "act"` | A list entry has no name of its own; naming the list says where to look. |
| 109 | says text is empty, too short or too long | Text length | `""`; `"ab"` with a 3-character minimum; `"too long"` with a 5-character maximum | `can't be empty`; `needs at least 3 characters`; `is too long: at most 5 characters` | Replaces messages like `expected string to have >=1 characters`. |
| 110 | says how many entries a list needs | List length | An empty list needing 1; one entry where 2 are needed | `needs at least 1 entry`; `needs at least 2 entries` | Correct singular and plural. |
| 111 | keeps a message the schema wrote itself | Priority | An empty list whose schema says `Written by the schema` | `Written by the schema` | Messages written for a specific field (like "List at least one contributor") are better than general ones, so they win. |
| 112 | names the item, not its position, for a problem inside a list | Nested fields | An item missing `text`, inside `items` | `"text" is missing` | The message names the field; the path (`items.1.text`) says where. |

## Content check (scripts)

`scripts/lib/validate.test.ts`, testing `scripts/lib/validate.ts`, the per-file check behind `pnpm validate-content`. Uses a stand-in game with `{ text }` items keyed by text, and a pack file at `src/games/test/content/animals.json`.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 113 | reports the number of items in a valid pack | Valid packs | A valid pack with 2 items | 2 items, no problems | The script prints the count next to each valid pack. |
| 114 | reports a file that is not valid JSON, with where the mistake is | JSON syntax | `{ "id": "animals", }` (trailing comma) | One problem: `Not valid JSON: …` with the position | A stray comma is the most common JSON mistake; nothing else can be checked until it's fixed. |
| 115 | checks $schema points at the game's JSON Schema, and allows leaving it out | `$schema` | A wrong path; no `$schema` at all | A problem at `$schema` giving the right path; no problem | A wrong path silently turns off editor help, so it's caught. Leaving it out is allowed. |
| 116 | names the item in a problem, using the game's item key | Item names | Second item `Penguin` with an extra field | Problem at `items.1 ("Penguin")` | Contributors can search for the word instead of counting items from 0. |
| 117 | keeps the plain position when the item has no usable text | Item names | Second item with empty text | Problem at `items.1.text` | An item too broken to name still gets a clear position. |
| 118 | runs the same checks as the app, such as the id matching the file name | Same as the app | id `zoo` in `animals.json` | Problem at `id` | CI and the app use the same `checkPack`, so they agree. |

## Team-turns config

`src/sdk/formats/team-turns/config.test.ts`, testing `src/sdk/formats/team-turns/config.ts`, the settings every team-turns game shares. Starts from the least a setup screen sends (teams Lions and Eagles, pack `back-to-school`) and changes one setting at a time. "Rejected at X" means the error points at setting X.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 119 | fills in 3 rounds, 60 seconds and no tag filter | Defaults | Only teams and packs | Rounds 3, seconds 60, tags `[]` | Players can start a game after naming teams and picking a pack. |
| 120 | keeps every setting that is given | Config schema | Three teams, 5 rounds, 90 seconds, two packs, tag `snack` | Unchanged | Defaults never overwrite what players chose. |
| 121 | needs 2 to 10 teams | `teams` | 1 team; 10 teams; 11 teams | Rejected at `teams`; accepted; rejected at `teams` | A team game needs two sides, and more than 10 names won't fit the screens. |
| 122 | trims team names and rejects blank or long ones | `teams` | `"  Lions "`; a name of spaces; 20 characters; 21 characters | Trimmed to `Lions`; rejected at `teams.1`; accepted; rejected at `teams.1` | Names show on the handoff screen and leaderboard, at arm's length. |
| 123 | rejects two teams with the same name, ignoring case and spaces, pointing at the second | `teams` | Lions, Eagles, ` lions` | Rejected at `teams.2` | Two teams called the same would make the leaderboard ambiguous. Uses the same comparison as duplicate items. |
| 124 | accepts whole numbers of rounds from 1 to 10 and seconds from 10 to 300 | `rounds`, `seconds` | Rounds 1, 10; 0, 11, 2.5. Seconds 10, 300; 9, 301, 60.5 | Ends of each range accepted; the rest rejected | Keeps games playable: no zero-round games, no 3-second turns. |
| 125 | needs at least one pack, with pack ids written as in pack files, not repeated | `packs` | None; `Back To School`; `anime` twice | Rejected at `packs`; at `packs.0`; at `packs` | Every game needs items, and ids must match real pack files. |
| 126 | checks tags are kebab-case and not repeated | `tags` | `tv-show`; `TV Show`; `snack` twice | Accepted; rejected at `tags.0`; rejected at `tags` | Same tag rules as items, so a filter can match them. |
| 127 | rejects an unknown setting, such as a typo | Strict settings | `second: 90` | Rejected as an unknown setting | Catches typos, and settings left over from an older saved game. |
| 128 | can be extended with a game's own settings and stays strict | `extend` | A Charades-like config with `punishSkips` | Default `false` filled in; `punishSkip` (typo) rejected | Games add their own settings on top (chapter 05) without losing the checks. |
| 129 | types settings with defaults filled in, and the setup input with them optional | Types | `TeamTurnsConfig` and `TeamTurnsSetup` | Settings have every field; the setup input accepts only teams and packs | The machine never has to handle a missing setting. Checked by `pnpm typecheck`. |

## Item pool

`src/sdk/formats/team-turns/pool.test.ts`, testing `src/sdk/formats/team-turns/pool.ts`. Two packs: `food` (Jollof tagged `dish`, Puff puff tagged `snack`, Zobo) and `school` (Assembly, jollof tagged `party`). Items are keyed by text, so Jollof and jollof are the same item. The drawing tests use letters as items.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 130 | takes the chosen packs' items in the order the packs were chosen | `choosePoolItems` | Packs chosen as school, then food | Assembly, jollof, Puff puff, Zobo | The first pack chosen wins when items repeat, so the order must be the players'. |
| 131 | leaves out packs that were not chosen | `choosePoolItems` | Only school | Assembly, jollof | Players only get the packs they picked. |
| 132 | keeps an item in two chosen packs once, from the first pack chosen | `choosePoolItems` | food, then school | Jollof (tagged `dish`), Puff puff, Zobo, Assembly | ADR 0003: an item in two packs is drawn once, using the first pack's copy. |
| 133 | with tags chosen, keeps only items with at least one of them | Tag filter | Both packs, tags `snack` and `party` | Puff puff, jollof | Filtering happens before removing repeats, so the `party` copy of jollof survives when only it matches. |
| 134 | returns no items when nothing matches the tags | Tag filter | food, tag `sport` | An empty list | The setup screen can tell players nothing matches instead of starting an empty game. |
| 135 | throws for a pack that does not exist | `choosePoolItems` | Pack `anime` | Error naming `"anime"` | The setup screen only offers real packs, so this is a bug to surface, not hide. |
| 136 | shuffles every item into the pool, the same way for the same seed, without changing the list | `newPool` | a–e, seed 7, twice | Every item once, nothing drawn yet; same order both times; original list unchanged | Games are repeatable in tests and after a refresh. |
| 137 | draws in pool order, moving each item to drawn, without changing the pool passed in | `drawFrom` | Remaining a, b | Draws a; pool now b remaining, a drawn; the original unchanged | The pool is game data: never changed in place, like any action's context. |
| 138 | draws every item once before any repeats | `drawFrom` | 4 items, 4 draws | Each item exactly once | "Drawn without repeats" (standard §7). |
| 139 | when every item is drawn, shuffles them back in and keeps going | `drawFrom` | 3 items, 6 draws | First 3 draws are all three items; so are the next 3 | A long game never runs out of cards; repeats only start once everything has been seen. |
| 140 | never draws the item just shown first after shuffling back in | `drawFrom` | All of a–d drawn, d last; seeds 0–49 | Never d; d is last in the new order | Seeing the same card twice in a row would feel like a bug. |
| 141 | repeats the only item when the pool has one | `drawFrom` | One item, already drawn | Draws it again | Edge case that must not crash. |
| 142 | throws for a pool with no items at all | `drawFrom` | Nothing remaining or drawn | Error | A game with no items is a bug; the machine refuses to start one (step 6). |

## Team-turns guards and actions

`src/sdk/formats/team-turns/rules.test.ts`, testing `src/sdk/formats/team-turns/rules.ts`. A made-up game whose turn record is the list of words guessed, one point each. Three teams (Lions, Eagles, Sharks), two rounds, 60-second turns, a pool of `a` and `b`. Unless noted, Lions are playing in round 1. Team positions start at 0.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 143 | is true while teams are still to play this round, or rounds are left | `turnsRemaining` | Team 0 in round 1; team 2 in round 1; team 1 in round 2 | True for all three | The game goes on until every team has had every turn. |
| 144 | is false once the last team has played in the last round | `turnsRemaining` | Team 2 in round 2 | False | This is what sends the game to results. Off by one here would end a game a turn early or late. |
| 145 | starts a fresh turn record and sets the timer from now | `startTurn` | Last turn's record `['old']`, now = 1000 ms | Record empty; `turnEndsAt` 61000; the original unchanged | Each turn starts clean; the timer comes from the runner's `now`, never the clock. |
| 146 | puts the next item from the pool on screen | `drawItem` | Pool `a`, `b` | Item `a`; pool `b` remaining, `a` drawn; the original unchanged | The card on screen and the pool move together. |
| 147 | adds the turn's points to the current team only | `bankPoints` | Eagles (team 1) playing, scores 4, 2, 7, three words guessed | Scores 4, 5, 7; the original unchanged | Points go to the team that earned them. |
| 148 | leaves scores as they are for a turn worth nothing | `bankPoints` | Nothing guessed, scores 3, 1, 0 | Unchanged | A bad turn scores zero, not an error. |
| 149 | passes play to the next team in the same round | `advanceTeam` | Team 0, round 1 | Team 1, round 1 | Playing order is the order teams were entered. |
| 150 | after the last team, goes back to the first team in the next round | `advanceTeam` | Team 2, round 1 | Team 0, round 2; the original unchanged | A round is one turn for every team. |

## teamTurns (Word Duel)

`src/sdk/formats/team-turns/teamTurns.test.ts`, testing `src/sdk/formats/team-turns/teamTurns.ts`. Word Duel is built with `teamTurns`: two teams (Lions, Eagles), 2 rounds, 30-second turns, five words (sun, moon, star, rain, wind). Unless noted, each turn is: start, got, skip, got, time up, next.

### Runtime tests

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 151 | has no mistakes validateMachine can find | `validateMachine` | Word Duel | No problems | Every machine's tests must include this (standard §12), and the format's phases are part of every team-turns machine. |
| 152 | adds the format's phases, guards and actions to the game's | `teamTurns` | Word Duel | Phases handoff, turn, turn_summary, results; guard `turnsRemaining`; the game's two actions plus the format's four; starts at `handoff` | The game wrote only `turn`; everything else must come from the format. |
| 208 | keeps the game's points, for views to show what a turn is worth | `machine.points` | Two words got, one skipped | 2 | ADR 0005: summary views show `points(turn)`. |
| 153 | starts at the first team's handoff with scores at zero and the items shuffled | Starting context | Seed 1 | `handoff`, scores 0 and 0, team 0, round 1, nothing on screen, all five words in the pool | The format builds the starting context from the settings and items. |
| 154 | refuses to start with no items | Starting context | No items | Error | A game with nothing to draw can't be played; failing at the start is clearer than failing on the first draw. |
| 155 | starts a turn with the timer set and the first item on screen | `start` event | `start` at 5000 ms | Phase `turn`, `turnEndsAt` 35000, the first drawn word on screen | The handoff's `start` runs `startTurn` then `drawItem`. |
| 156 | records the turn as it goes and banks its points only when leaving the summary | Points (ADR 0004) | start, got, skip, time up, then next | In the summary: the turn record lists the word got and the word skipped, scores still 0 and 0. After next: scores 1 and 0, Eagles to play | Points are worked out from the turn record when players leave the summary, so a correction there (chapter 04) changes the score. |
| 157 | plays from the first handoff to the results | Full playthrough | Seed 2026, play until the game ends | 4 turns (2 teams × 2 rounds), back at the handoff between turns, ends in `results` with scores 4 and 4 | Proves the whole format loop works with a game plugged in. |
| 158 | reshuffles once every word has been drawn, so a long game never runs out | Item pool in play | 16 draws from 5 words | The pool still holds exactly the five words | The step 4 rule, working inside a real machine. |
| 159 | ignores events once the game has ended | Final phase | `start` after the results | The same state back | Late taps can't restart a finished game. |
| 160 | gives the same draws every time for the same seed | Determinism | Seed 2026, `start`, twice | Identical states; the first word is `sun` | Pins the draws. If the format, pool, runner or Rng changes, this changes, and someone has to decide whether that was intended. |
| 161 | finishes the same way after a save and reload halfway through | Saving | Two turns, saved to JSON and loaded back, then played to the end | The same end as without the save, and as a game played straight through | A refresh mid-game must not change anything. |
| 162 | works out the names from the game and adds the format's | Types | Word Duel's phase, guard and action names | Exactly the game's names plus the format's | Code using the machine (views, the app) knows every name. Checked by `pnpm typecheck`. |

### Compile-time checks

Each is a game passed to `teamTurns` with one mistake, and must be a type error on the game's own line (ADR 0004).

| # | Mistake | Example | Why |
|---|---|---|---|
| C15 | Moving to a phase that doesn't exist | `to: 'turn_sumary'` | The error must land on the game's line, the trap ADR 0002 warned about. |
| C16 | Unknown action name | `actions: ['markGott']` | As C15, for actions. |
| C17 | An action is used but never written | `actions: ['markGot']` with `actions: {}` | The game would crash the first time it ran. |
| C18 | Jumping straight to the results | `to: 'results'` | Only the format ends the game; a game can't skip its loop (standard §7). |
| C19 | No `turn` phase | `phases: { play: … }` | The format's handoff starts `turn`, so it must exist. |
| C20 | Writing one of the format's phases | `handoff: { … }` | A game can add phases but not replace the format's. |
| C21 | Writing one of the format's actions | `actions: { drawItem: … }` | Same, for actions: two `drawItem`s would silently replace one. |
| C22 | A final game phase | `final: true` | Only the format's `results` ends the game. |
| C23 | An event the game doesn't have | `on: { jump: … }` | As C12, inside a format game. |

## defineGame

`src/sdk/game/defineGame.test.ts`, testing `src/sdk/game/defineGame.ts`. A tiny team-turns game (`word-duel`) with `{ text }` items, two packs (`animals`, `food`), the plain `TeamTurnsConfig` schema, and one preset (`quick`: 1 round, 30 seconds, pack `food`). Each test changes one part. "Reports X" means the thrown error lists a problem at X.

### Runtime tests

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 163 | returns the game with the format's default views filled in | `defineGame`, views | The valid game, with a view for `turn` only | The same machine; views are the format's three defaults plus the game's `turn` | ADR 0005: games write views for their own phases and get the format's for free. |
| 164 | accepts a game without presets | Presets | No `presets` | No error | Presets are optional; core Charades has none yet. |
| 165 | reports problems in meta, with where each is | `meta` | Id `Word Duel`, complexity 6, players min 4 max 2, no contributors | One error naming the game, listing `meta.id`, `meta.complexity`, `meta.players` and `meta.contributors` | The library shows these; mistakes fail the game's tests instead of reaching players. All problems at once. |
| 166 | needs at least one pack | Content | No packs | Reports `content.packs` | A game without items can't be played. |
| 167 | checks a preset's settings against the game's config schema | Presets | Preset with 5-second turns | Reports `config.presets.0.config.seconds` | A preset is just settings, so the same rules apply as on the setup screen. |
| 168 | reports a preset that names a pack the game does not have | Presets | Preset with pack `anime` | Reports `config.presets.0.packs` naming `"anime"` | A typo in a pack id would give players an empty game. |
| 169 | reports two presets with the same id, and a preset without contributors | Presets | Two presets called `quick`, the second without contributors | Reports `config.presets.1.id` and `config.presets.1.contributors` | Preset ids are used in links; credit is required (§3). |
| 170 | keeps the item and settings types from the schemas | Types | The defined game | Packs typed `Pack<{ text: string }>[]`; settings typed `TeamTurnsConfig` | The app (chapter 04) works with a game's real types. Checked by `pnpm typecheck`. |
| 206 | uses a game's own view for a format phase instead of the default | Views | Views for `turn` and `turn_summary` | The game's summary view is used | A game can replace a format view (Charades lists the items got and skipped). |
| 207 | reports a phase without a view | Views | `views: {}` (types bypassed) | Reports `views: Phase "turn" has no view` | Types catch this; the check also covers code that bypasses them. |

### Compile-time checks

| # | Mistake | Example | Why |
|---|---|---|---|
| C24 | The machine plays different items from the packs | A machine for `{ word }` items with `{ text }` packs | The item schema, the packs and the machine must agree on what an item is. |
| C25 | A preset sets the teams | `config: { teams: ['A', 'B'] }` | Players always name their own teams. |
| C26 | A format that doesn't exist yet | `format: 'host-led'` | Only `team-turns` is built. |
| C27 | A game phase without a view | `views: { turn_summary: … }` with no `turn` | Players would see a blank screen in that phase. |
| C28 | A view for a phase the machine doesn't have | `views: { turn, steal }` | Usually a typo; the view would never be shown. |
| C29 | A view written for another game's items | A view reading `item.word` in a game whose items have `text` | It would show nothing, or crash, on the real items. |

## Charades machine

`src/games/charades/machine.test.ts`, testing `src/games/charades/machine.ts` and `index.ts`: core Charades on the team-turns format. Uses the real game: two teams (Lions, Eagles), 3 rounds, 60-second turns, and the items of the real Back to School pack, picked with `choosePoolItems` as the app will.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 171 | is a valid game with the Back to School pack | `index.ts` | The game's default export | Id `charades`, includes `back-to-school`, uses the Charades machine | Importing `index.ts` runs `defineGame`'s checks; a broken game fails here. |
| 172 | has no mistakes validateMachine can find | `validateMachine` | The Charades machine | No problems | Required for every game (standard §12). |
| 173 | got: records the item, shows the next one, and is worth a point | `got` | `got` on the first card, then time up and next | The card is in the turn's `got` list; a new card is on screen; Lions score 1 | The core rule: a correct guess scores. |
| 174 | skip: records the item and shows the next one, with no penalty | `skip` | `skip` on the first card, then time up and next | The card is in `skipped`; a new card is on screen; scores stay 0 and 0 | Core Charades has no skip penalty (that's an option in chapter 05). |
| 175 | time_up: ends the turn without counting the item on screen | `time_up` | `got`, then time up | Turn summary, one item got, none skipped | The card on screen when time runs out wasn't guessed or passed, so it isn't recorded. |
| 176 | ignores got and skip outside a turn | Ignored events | `got` at the handoff; `skip` on the summary | The same state back | A stray tap between turns can't score. |
| 177 | plays a full game from the first handoff to the results | Full playthrough | Seed 2026; each turn: start, got, got, skip, got, time up, next | 6 turns; ends in `results`; scores 9 and 9; 30 different items drawn | The whole game plays end to end with real content (standard §12). |
| 178 | markGot adds the item on screen to the items got, without changing the context passed in | `markGot` | Gala on screen, empty turn | Gala in `got`; the original unchanged | A test per action (standard §12). |
| 179 | markSkipped adds the item on screen to the items skipped, without changing the context passed in | `markSkipped` | Gala on screen, empty turn | Gala in `skipped`; the original unchanged | As above. |

## App

`src/app/App.test.tsx`, testing the pages in `src/app/` and which address shows which. Screen tests (happy-dom), each starting the app at an address with a `MemoryRouter`.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 180 | shows the library at /, and a game opens at its own address | Library, routing | Start at `/`; tap Charades | Heading Ku Zo Wasa; a Charades link to `/charades` showing "2–20 players"; after the tap, Charades' setup screen | The library lists the registry's games, and each link reaches its game. |
| 214, 215 | says "Page not found" at /chess and /charades/nope/extra, with a way back | Not-found page | A game that doesn't exist; an address with too many parts | "Page not found"; Back to games returns to the library | A mistyped or old link never shows a blank page. Runs once per address (`it.each`). |
| 216 | has an icon for every game in the registry | `gameIcons` | Every registered game's `meta.icon` | Listed in `gameIcons` | An unlisted icon would quietly show the fallback controller. |

## Theme tokens

`src/app/theme.test.ts`, testing the theme tokens in `src/app/index.css`. Reads the CSS file and every `.ts`/`.tsx` file in `src/` as text.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 181 | gives every color a value in both light and dark mode | Light and dark | The light and dark token lists | Every dark color is also set in light; light adds only `--radius`, `--font-body` and `--duration` | A color missing from dark mode would show the light value on a dark background. |
| 182 | makes every color token available to Tailwind classes | `@theme` | Each color token | A matching `--color-<name>: var(--<name>);` line | A token Tailwind doesn't know can't be used as a class. |
| 183 | is the only source of colors: no file uses a built-in Tailwind color | No raw colors | Every source file | No class like `bg-red-500` or `text-white` | Tailwind's palette is switched off, so such a class would silently do nothing; and themes (phase 2) can only change colors that come from tokens. |

## UI components

`src/ui/ui.test.tsx`, testing `src/ui/cn.ts`, `button.tsx` and `input.tsx`. Screen tests (happy-dom); taps and typing go through `user-event`, which acts like a player.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 184 | drops empty values and lets a later class win over an earlier one that sets the same thing | `cn` | `'bg-primary px-4'`, `false`, `undefined`, `'bg-secondary'` | `'px-4 bg-secondary'` | A caller's `className` can adjust a component without both colors fighting. |
| 185 | is a button that does not submit forms unless asked to | Button | `<Button>Start</Button>` | A button named Start with `type="button"` | A plain `<button>` inside a form submits it; the setup screen has a form. |
| 186 | calls onClick when tapped, and not when disabled | Button | Tap; then tap while disabled | Called once in total | Start must do nothing while setup is invalid. |
| 187 | uses theme colors for its variant, and lets the caller adjust it | Button | `variant="success"`, `className="w-full"` | Classes include `bg-success` and `w-full` | Variants come from tokens; screens can still size buttons. |
| 188 | is a text field that can be found by its label and typed into | Input | Labelled "Team 1", type `Lions` | Found by its label; value `Lions` | Team names are typed here; a field without a usable label is invisible to screen readers. |

## Game session

`src/sdk/game/useGameSession.test.ts`, testing `newGame` and `useGameSession` in `src/sdk/game/useGameSession.ts`. Runs the hook in a fake browser with Testing Library's `renderHook`. A tiny machine: `go` starts a clock from `now` and moves to `playing`, `roll` adds a die roll, `stop` ends the game; the input is the starting total. Each session starts from `newGame(machine, input, seed)` (ADR 0006).

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 189 | starts from the state it is given | Starting | `newGame` with input 10, seed 1 | Phase `ready`, total 10, not ended | The session plays the state it's handed, new or saved. |
| 190 | sends events with the current time and re-renders with the new state | `send` | `go` with a clock reading 5000 | Phase `playing`, clock started at 5000 | The time comes from the session, never from game logic. |
| 191 | plays the same way for the same seed | Determinism | Seed 7 twice: go, roll | The same total | Tests can pin a seed and get repeatable games. |
| 192 | keeps the same state when an event is ignored | Ignored events | `roll` in `ready` | The exact same state object | Nothing re-renders for a tap the phase doesn't handle. |
| 193 | says when the game has ended | `ended` | go, stop | `ended` is true | The play screen knows when to offer "Play again". |
| 194 | newGame picks a random seed, and restart starts over with a new one | Random seed, `newGame`, `restart` | `Math.random` returning 0.25 then 0.5; go, then restart with input 3 | Seeds 2^30, then 2^31; restart is back at `ready` with that input | Every game is different in real play, and "Play again" doesn't replay the same deck. |
| 225 | carries on a saved game exactly where it was | Resuming | A game after `go`, written to JSON and read back; then roll | The same state as rolling the original | A save is plain JSON, and resuming one draws what the original would have drawn (`rngState`). |
| 226 | reports every change to onChange, but not the starting state or ignored events | `onChange` | Start; an ignored roll; go; restart | No call, no call, one call with the new state, a second call at `ready` | The app saves on every change and only then. |
| 227 | keeps playing when the caller passes a new starting state on every render | First state only | A new `newGame` each render; go; re-render | Still `playing`; one change reported | A parent that rebuilds its props mustn't restart the game or report a change that didn't happen. |

## Interaction primitives

`src/sdk/interactions/interactions.test.tsx`, testing the primitives in `src/sdk/interactions/`. Screen tests (happy-dom). The Countdown tests use fake timers: the test moves the clock forward by hand, starting at 0 ms.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 195 | names who gets the phone, and calls onReady when they tap Start | Handoff | To Lions, "Round 2 of 3"; tap Start | Heading Lions, the detail line, onReady called once | The gate between turns: right team, one tap to begin. |
| 196 | shows the item and reports Got it and Skip | FlashCard | Puff puff, hint "Describe it"; tap Got it once, Skip twice | Text and hint shown; onGot once, onSkip twice | Each tap reports exactly one event. |
| 213 | shrinks the whole text when its longest word is long | FlashCard, `textSize` | Longest word 9, 14 and 20 letters; a card with a 17-letter word | `text-5xl`, `text-3xl`, `text-2xl`; the card drawn at `text-2xl` | A word can't wrap: too big, it would be broken mid-word on a small phone. The whole text shrinks, so one item never mixes sizes. |
| 197 | shows whole seconds left, rounded up, and counts down | Countdown | Ends at 60 s; after 1 s; after 59.5 s | 60, 59, 1 | Rounded up, it shows 0 only when time is really up. |
| 198 | calls onTimeUp once, when time runs out | Countdown | Ends at 3 s; check at 2.9 s, then at 7.9 s | Not called, then called once; shows 0 | `time_up` must be sent once, not on every tick after the end. |
| 199 | calls onTimeUp straight away if the time has already passed | Countdown | Ends at 5 s, shown at 10 s | Called once immediately | A turn whose time ran out while the phone was locked (or, from chapter 05, before a refresh) ends at once. |
| 200 | turns to the warning color from warnAt seconds left | Countdown | Ends at 15 s, warn at 10; after 5 s | No warning class, then `text-warning` | Players see time running out without reading the number. |
| 201 | vibrates when time runs out, on phones that can | Countdown | A phone with `vibrate`; ends at 1 s | `vibrate` called once | The team acting may not be looking at the screen. |

## Summary and Leaderboard

`src/sdk/interactions/summary.test.tsx`, testing `Summary.tsx` and `Leaderboard.tsx` in `src/sdk/interactions/`. Screen tests (happy-dom), except `rank`, which is a plain function.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 202 | shows who played, what they scored, and each list of items | Summary | Lions, 2 points, Got it: Gala, Zobo; Skipped: Assembly; tap Next | Heading Lions, "scored 2 points", both lists with their items, onNext once | Players see what happened in the turn before moving on. |
| 203 | says "1 point", and leaves out empty lists | Summary | Eagles, 1 point, an empty Skipped list | "scored 1 point"; no list shown | Small things players notice: grammar, and empty headings. |
| 204 | orders by score, gives tied scores the same place and skips the next, keeping tied entries in order | `rank` | A 7, B 10, C 10, D 3 | 1 B, 1 C, 3 A, 4 D; the original list unchanged | Two teams with the same score both came first; the next team is third, not second. |
| 205 | lists every team with its place and score, highest first, highlighting first place | Leaderboard | Lions 4, Eagles 9 | Eagles first (highlighted), then Lions | The results screen at a glance. |

## Team-turns views

`src/sdk/formats/team-turns/views/views.test.tsx`, testing the format's default views in `src/sdk/formats/team-turns/views/`. Screen tests (happy-dom). A made-up game whose turn record is a count of words guessed; Lions and Eagles, 2 rounds, Eagles playing, 3 words got.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 209 | handoff: names the team and the round, and Start sends start | `HandoffView` | Round 1 of 2; tap Start | Heading Eagles, "Round 1 of 2"; sends `start` | The view connects the Handoff primitive to the machine. |
| 210 | turn summary: shows the turn's points, and Next, or See results after the last turn | `TurnSummaryView` | Round 1; then round 2 (the last turn) | "scored 3 points" and Next (sends `next`); then See results | The button says where `next` will go, using the format's own `turnsRemaining`. |
| 211 | results: names the winner, or says it's a tie | `ResultsView` | Scores 5 and 8; then 6 and 6 | "Eagles won!"; then "It's a tie!" | A draw needs its own headline. |

## Game screen

`src/app/play/GameScreen.test.tsx`, testing `src/app/play/GameScreen.tsx` with the real Charades game from the registry: Lions and Eagles, 1 round, 30-second turns, Back to School, seed 2026. Fakes the clock and `setInterval` (not `setTimeout`, which Testing Library needs) so turns pass instantly. Drawn inside a `MemoryRouter`, because the screen has a link.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 212 | plays a whole game of Charades by tapping, from the first handoff to the results | Every view, end to end | Lions: Start, Got it ×2, Skip, 30 s pass, Next. Eagles: Start, Got it, 30 s pass, See results | Timer starts at 30; Lions' summary: 2 points, 2 got, 1 skipped; Eagles' summary: 1 point; "Lions won!", standings Lions 2, Eagles 1 | Proves the whole chain: buttons send the right events, the machine moves, and each phase's view appears. A view sending the wrong event fails here. |
| 224 | after the game, Play again starts over with the same teams, and Back to games leads to the library | Results actions | Two turns with nothing guessed, then tap Play again | No Play again during the game; "It's a tie!", Back to games links to `/`; then Lions' handoff, "Round 1 of 1", no Play again | The app's own buttons appear only once the game has ended, and Play again really restarts. |

## Setup screen

`src/app/setup/setup.test.tsx`, testing the setup screen in `src/app/setup/` and the play page's check for settings. Screen tests (happy-dom), each starting the app at an address with a `MemoryRouter`, with nothing saved on the device. Charades' one pack, Back to School, has 34 items.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 217 | starts with two teams and the default settings, and Start begins the game and remembers the teams | Setup, Start | Open `/charades`; rename Team 1 to Lions; tap Start | Team 1, Team 2; 3 rounds; 60 seconds; Back to School ticked; "34 items to play"; then "Pass the phone to" Lions; saved teams Lions, Team 2; a saved game with those teams | One tap from the library to a game with sensible defaults, and the next game starts with the same names. Start saves the game before the play page opens (ADR 0006). |
| 218 | fills in the teams saved on this device, and ignores a save it can't read | `loadTeams` | Saved Lions, Eagles, Hawks; then broken JSON; then one team | Three fields with those names; then nothing loaded, twice | Saved data can be old or edited by hand: a bad save means the defaults, never a crash. |
| 219 | adds and removes teams, from 2 up to 10 | Teams | Add a team; remove Team 1; add until 10 | Team 3 appears; Team 2 and Team 3 remain; no Remove at 2 teams, no Add team at 10 | The screen can't make a team count the schema rejects. |
| 220 | shows what's wrong with a team name next to it, and Start is off until it's fixed | Teams, errors | Empty Team 1; then "team 2"; then "team 2s" | "Give every team a name", field marked invalid, Start off; "Two teams have this name", Start off; Start on | The schema's own messages, shown where the problem is. |
| 221 | changes rounds and turn length with − and +, within their limits | `Stepper` | Turn length −; rounds − twice | 45 seconds; 1 round, its − button off | Values stay in range without typing. |
| 222 | counts the items a tag leaves, and needs at least one pack | Packs, tags | Pick snack; add song; untick Back to School | "5 items to play"; "7 items to play"; "Pick at least one pack", no tags offered, Start off | Players see what a filter leaves before they start. |
| 223 | sends the play page back to setup when there is no saved game, like a shared /charades/play link | Play page | Open `/charades/play` with nothing saved | Charades' setup screen | The play page only plays a save (ADR 0006): without one there's nothing to play. |

## Saved game

`src/app/play/savedGame.test.ts`, testing `src/app/play/savedGame.ts` (ADR 0006). Uses the fake browser's `localStorage`, emptied before each test. A new game of Charades: Lions and Eagles, 1 round, 30-second turns, Back to School, seed 2026. Some saves are written by hand, to test saves the app didn't write, or wrote long ago.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 228 | saves a game and loads it back exactly | `saveGame`, `loadGame` | The game after `start`, saved at 6000 | The same state, saved at 6000 | Resuming must continue the very same game. |
| 229 | finds nothing when nothing is saved, or after clearGame | `clearGame` | Nothing; then a save, cleared | Nothing, twice | Quit (step 5) deletes the save. |
| 230–236 | throws away a save with … , and says why | Checks on load | Not JSON · the wrong shape · an older version · a game that was removed · a phase that was renamed · the phase "toString" · 99 rounds | Discarded with the matching reason; the save is deleted | Every way a save can go stale, from ADR 0006. Never a crash, always a reason for the notice. "toString" exists on every object: a plain `in` check would let it through. Runs once per case (`it.each`). |
| 237 | reports a save for a different game without deleting it | `loadGame` | A Charades save, loaded for another game id | "other game", Charades; the save kept | Opening another game's play page mustn't destroy the Charades save. |
| 238 | summarizes the save for the library, and says when the game is finished | `summarizeSave` | A new game; then one played to the results | Teams, round 1 of 1, not finished; then finished | The library's Continue card (step 6) needs this, and hides finished games. |
| 239 | keeps playing when storage is switched off | Storage errors | A storage whose every call throws | Save, load and clear don't throw; nothing loaded | Some private-browsing modes switch storage off; the game must still play. |

## Play page

`src/app/play/PlayPage.test.tsx`, testing `src/app/play/PlayPage.tsx` the way a refresh reaches it: a game is saved, then the app opens at `/charades/play`. Screen tests (happy-dom) with a fake clock (`Date` and `setInterval` only). The saved game: Charades, Lions and Eagles, 1 round, 30-second turns, seed 2026; Lions' turn started at 0 ms (it ends at 30 000) and they got one item.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 240 | carries on a saved turn after a refresh, with the clock still running, and saves every move | Resume, saving | Open at 10 000 ms; tap Got it | Lions' turn, timer at 20; the save now has 2 items got | A refresh loses nothing but the seconds it took, and every move is saved. |
| 241 | ends the turn at once if its time ran out during the refresh | Resume after time ran out | Open at 45 000 ms | Lions' summary, "scored 1 point"; the save is at `turn_summary` | The turn ended while the page was gone; the game catches up instead of showing a timer below zero. |
