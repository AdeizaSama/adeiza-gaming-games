# Test catalog

Every automated test in the repo, in plain English: what it checks, what goes in, what must come out, and why it matters. Read this to understand what the tests protect without opening the code.

**Keep it in sync.** A pull request that adds, removes or changes a test updates this file in the same commit. The "Test" column is the test's name in the code, so you can search for it.

**Counts:** 503 runtime tests (`pnpm test`) and 31 compile-time checks (`pnpm typecheck`).

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
| [Multiple-choice options](#multiple-choice-options) | `src/sdk/content/choices.test.ts` | 5 | |
| [Loading packs](#loading-packs) | `src/sdk/content/loadPacks.test.ts` | 12 | |
| [Variant files](#variant-files) | `src/sdk/content/variant.test.ts` | 4 | |
| [Categories](#categories) | `src/sdk/content/categories.test.ts` | 2 | |
| [Finding games (scripts)](#finding-games-scripts) | `scripts/lib/games.test.ts` | 6 | |
| [Charades content](#charades-content) | `src/games/charades/schema.test.ts` | 8 | |
| [Name Ten content](#name-ten-content) | `src/games/name-ten/schema.test.ts` | 6 | |
| [Name Ten settings](#name-ten-settings) | `src/games/name-ten/config.test.ts` | 2 | |
| [Name Ten machine](#name-ten-machine) | `src/games/name-ten/machine.test.ts` | 15 | |
| [Name Ten views](#name-ten-views) | `src/games/name-ten/views/views.test.tsx` | 8 | |
| [Name Ten game](#name-ten-game) | `src/games/name-ten/game.test.ts` | 1 | |
| [Trivia Night content](#trivia-night-content) | `src/games/trivia-night/schema.test.ts` | 8 | |
| [Trivia Night settings](#trivia-night-settings) | `src/games/trivia-night/config.test.ts` | 2 | |
| [Choice turn settings](#choice-turn-settings) | `src/sdk/formats/team-turns/choice/config.test.ts` | 1 | |
| [Choice turn machine](#choice-turn-machine) | `src/sdk/formats/team-turns/choice/machine.test.ts` | 12 | |
| [Choice turn views](#choice-turn-views) | `src/sdk/formats/team-turns/choice/views.test.tsx` | 11 | |
| [Trivia Night machine](#trivia-night-machine) | `src/games/trivia-night/machine.test.ts` | 2 | |
| [Trivia Night game](#trivia-night-game) | `src/games/trivia-night/game.test.ts` | 2 | |
| [Pairs content](#pairs-content) | `src/games/pairs/schema.test.ts` | 3 | |
| [Pairs settings](#pairs-settings) | `src/games/pairs/config.test.ts` | 1 | |
| [Pairs machine](#pairs-machine) | `src/games/pairs/machine.test.ts` | 10 | |
| [Pairs views](#pairs-views) | `src/games/pairs/views/views.test.tsx` | 5 | |
| [Pairs game](#pairs-game) | `src/games/pairs/game.test.ts` | 2 | |
| [Charades settings](#charades-settings) | `src/games/charades/config.test.ts` | 5 | |
| [JSON Schemas (scripts)](#json-schemas-scripts) | `scripts/lib/jsonSchema.test.ts` | 9 | |
| [Loading game schemas (scripts)](#loading-game-schemas-scripts) | `scripts/lib/gameSchema.test.ts` | 4 | |
| [Content check (scripts)](#content-check-scripts) | `scripts/lib/validate.test.ts` | 10 | |
| [Themes](#themes) | `src/sdk/theme/theme.test.ts` | 7 | |
| [Contrast](#contrast) | `src/sdk/theme/contrast.test.ts` | 7 | |
| [Theme variables](#theme-variables) | `src/sdk/theme/apply.test.ts` | 4 | |
| [Team-turns config](#team-turns-config) | `src/sdk/formats/team-turns/config.test.ts` | 12 | |
| [Item pool](#item-pool) | `src/sdk/formats/team-turns/pool.test.ts` | 13 | |
| [Team-turns guards and actions](#team-turns-guards-and-actions) | `src/sdk/formats/team-turns/rules.test.ts` | 11 | |
| [teamTurns (Word Duel)](#teamturns-word-duel) | `src/sdk/formats/team-turns/teamTurns.test.ts` | 16 | 11 |
| [defineGame](#definegame) | `src/sdk/game/defineGame.test.ts` | 14 | 6 |
| [Settings and variants](#settings-and-variants) | `src/sdk/game/settings.test.ts` | 6 | |
| [Charades machine](#charades-machine) | `src/games/charades/machine.test.ts` | 22 | |
| [Charades views](#charades-views) | `src/games/charades/views/views.test.tsx` | 8 | |
| [App](#app) | `src/app/App.test.tsx` | 11 | |
| [Library cards](#library-cards) | `src/app/library/cards.test.tsx` | 4 | |
| [Browse](#browse) | `src/app/library/browse.test.tsx` | 4 | |
| [Custom game](#custom-game) | `src/app/library/custom.test.tsx` | 1 | |
| [Theme tokens](#theme-tokens) | `src/app/theme.test.ts` | 6 | |
| [Applying a theme](#applying-a-theme) | `src/app/theme/themes.test.tsx` | 4 | |
| [Bundled fonts](#bundled-fonts) | `src/app/theme/fonts.test.ts` | 2 | |
| [Theme picker](#theme-picker) | `src/app/theme/picker.test.tsx` | 2 | |
| [Theme parts](#theme-parts) | `src/app/theme/parts.test.ts` | 4 | |
| [UI components](#ui-components) | `src/ui/ui.test.tsx` | 8 | |
| [Game session](#game-session) | `src/sdk/game/useGameSession.test.ts` | 9 | |
| [Interaction primitives](#interaction-primitives) | `src/sdk/interactions/interactions.test.tsx` | 10 | |
| [Summary and Leaderboard](#summary-and-leaderboard) | `src/sdk/interactions/summary.test.tsx` | 5 | |
| [Review](#review) | `src/sdk/interactions/review.test.tsx` | 3 | |
| [PromptCard](#promptcard) | `src/sdk/interactions/promptcard.test.tsx` | 3 | |
| [MultipleChoice](#multiplechoice) | `src/sdk/interactions/multiplechoice.test.tsx` | 6 | |
| [FlipCard](#flipcard) | `src/sdk/interactions/flipcard.test.tsx` | 1 | |
| [PickCard](#pickcard) | `src/sdk/interactions/pickcard.test.tsx` | 2 | |
| [A pause after time runs out](#a-pause-after-time-runs-out) | `src/sdk/interactions/settle.test.tsx` | 3 | |
| [Markdown](#markdown) | `src/sdk/interactions/markdown.test.ts` | 5 | |
| [Instruction](#instruction) | `src/sdk/interactions/instruction.test.tsx` | 3 | |
| [Team-turns views](#team-turns-views) | `src/sdk/formats/team-turns/views/views.test.tsx` | 5 | |
| [Game screen](#game-screen) | `src/app/play/GameScreen.test.tsx` | 3 | |
| [Playing Name Ten](#playing-name-ten) | `src/app/play/nameTen.test.tsx` | 1 | |
| [Playing Pairs](#playing-pairs) | `src/app/play/pairs.test.tsx` | 1 | |
| [Playing Trivia Night](#playing-trivia-night) | `src/app/play/triviaNight.test.tsx` | 2 | |
| [Setup screen](#setup-screen) | `src/app/setup/setup.test.tsx` | 14 | |
| [Variant setup](#variant-setup) | `src/app/setup/variantSetup.test.tsx` | 5 | |
| [Saved game](#saved-game) | `src/app/play/savedGame.test.ts` | 13 | |
| [Play page](#play-page) | `src/app/play/PlayPage.test.tsx` | 3 | |
| [Continuing a saved game](#continuing-a-saved-game) | `src/app/library/continue.test.tsx` | 7 | |
| [Wake lock](#wake-lock) | `src/app/play/useWakeLock.test.ts` | 3 | |

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

## Multiple-choice options

`src/sdk/content/choices.test.ts`, testing `src/sdk/content/choices.ts` (ADR 0015). The rules any multiple-choice game's questions follow, and the order options are shown in.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 387 | takes 2 to 5 options, and refuses 1 or 6 | `Options` | 2, 5, 1 and 6 options | The first two pass; the others fail | Two is a this-or-that; five is the most that fits under a question on a small phone. |
| 388 | refuses an empty option, one over 80 characters, and a repeat that differs only in capitals | `Options` | `Lagos` with a blank; with 81 characters; `Lagos, Abuja, LAGOS` | A problem at the bad option's position each time | Two options that only differ in capitals look like the same answer to players. |
| 389 | passes an answer that is one of the options, and refuses one that isn't or is written differently | `checkAnswer` | Answer `Abuja`, `Kano`, `abuja` with options Lagos, Abuja | Passes; then a problem at `answer` twice | The machine compares a pick with the answer as written, so `abuja` would never be right. |
| 390 | shuffle: a new order from the machine's random numbers, the same for the same seed, the original unchanged | `orderOptions` | Six options, seed 7, twice | The same options; the same order both times; the original list unchanged | A saved game shows a question's options in the same order after a refresh. |
| 391 | alphabetical: A to Z ignoring capitals, numbers in number order | `orderOptions` | `Year 10, banana, Year 9, Apple, 12, 8` | `8, 12, Apple, banana, Year 9, Year 10` | A plain text sort puts 12 before 8 and Year 10 before Year 9. |

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

## Variant files

`src/sdk/content/variant.test.ts`, testing `src/sdk/content/variant.ts` (ADR 0018, 0021): a variant file's shape, checked by the app and the content check. The variant is `quick-food`: category `party`, pack `food`, 30-second turns, rounds open.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 444 | accepts a variant file, filling in no tags, no settings and no open settings | `checkVariant` | The variant; one with only id, name, tagline, categories, packs, contributors | The same with `tags: []` and `freePlay: false`; then `settings: {}`, `open: []` too | Only what makes a variant is required. |
| 445 | needs its id to be its file name, at least one pack, a name and contributors, and no unknown fields | `checkVariant` | File `food.json`; no packs; blank name, no contributors; a `presets` field | Problems at `id`; `packs`; `name` and `contributors`; one problem | The id is the address; a typo in a field name is caught. |
| 507 | needs at least one category, each from the list and listed once | `checkVariant` | No categories; an empty list; `nigerian`; `party` twice | A problem at `categories`; `categories`; `categories.0`; `categories` | Browse filters by category, and one list keeps the names consistent (ADR 0021). |
| 446 | loads every file, sorted by id, and throws one error listing every problem | `loadVariants` | Two good files; then a bad id and an empty pack list | `all-food`, `quick-food`; then one error naming both files | Every problem at once, like packs. |

## Categories

`src/sdk/content/categories.test.ts`, testing `src/sdk/content/categories.ts` and `categories.json` (ADR 0021): the list of categories variants can be in.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 508 | loads the shipped list, each id once with a label | The list | `categories.json`; the label for `school` | party, learning, trivia, words, school, french, naija, in that order; "Back to School" | The order is the filter's on Browse. |
| 509 | refuses a list with a bad id, a blank or long label, or an id used twice | `loadCategories` | `Party`; a blank label; a 33-character label; `party` twice; an empty list | Errors at `0.id`; `0.label`; "20 characters"; "used once"; "whole file" | A broken list stops the build, not Browse. |

## Finding games (scripts)

`scripts/lib/games.test.ts`, testing `scripts/lib/games.ts`. Each test creates a throwaway games folder in the system's temp directory and deletes it afterwards, so no test files are committed and the real `src/games` is never touched.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 77 | finds each game with its schema file, pack files and variant files, sorted | `findGames` | `trivia` (schema, 1 pack) and `charades` (schema, `movies.json`, `anime.json`, `variants/naija.json`) | Charades then Trivia, each with its `schema.ts` path, its packs in name order and its variants (none for Trivia) | The content scripts need every game and pack, in the same order on every computer. |
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

## Charades settings

`src/games/charades/config.test.ts`, testing `src/games/charades/config.ts`: Charades' own settings on top of the format's (ADR 0007).

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 255 | defaults to describe, with 2 for a describe, 3 for an act or a sing, and 1 off for a skip | Defaults | Only teams and packs | Mode `describe`, points 2 / 3 / 3 / 1, the format's 3 rounds | The defaults are the maintainer's scoring; most groups never change them. |
| 256 | fills in the point values that are left out | `points` | Only `act: 5` | Act 5, the other three at their defaults | Changing one value never resets the others. |
| 257 | accepts mix and rejects other modes | `mode` | `mix`; `act` | Accepted; rejected at `mode` | There are two modes; "always act" was dropped because most items can't be acted. |
| 258 | keeps points whole and between 1 and 5, and lets a skip cost nothing | Point limits | Skip 0; describe 0; sing 6; act 2.5 | Accepted; then rejected at each field | Whole numbers keep scores free of halves; a correct answer is always worth something; skip 0 turns the penalty off. |
| 259 | rejects unknown settings, like the format does | Strict fields | `punishSkips`; a `bonus` point value | Rejected at the top level; rejected at `points` | Catches typos and settings left over from older versions. |

## JSON Schemas (scripts)

`scripts/lib/jsonSchema.test.ts`, testing `scripts/lib/jsonSchema.ts` and the committed `schemas/` folder. The first four use a stand-in item schema with a required `text` and a `modes` field that has a default, like Charades.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 91 | requires the shared pack fields, but not $schema | `packJsonSchema` | The stand-in item schema | Required: id, name, description, language, maturity, contributors, items | Editors flag a missing field, but not a missing `$schema` line. |
| 92 | rejects unknown fields in packs and items, as the zod schema does | `packJsonSchema` | The stand-in item schema | `additionalProperties: false` on the pack and on items | Editors underline typos like `maturty`, matching what CI rejects. |
| 93 | makes item fields with a default optional, since contributors can leave them out | `packJsonSchema` | An item with `text` and a defaulted `modes` | Only `text` required | Editors must not demand `modes`, which contributors are told they can leave out. |
| 94 | names the game in its title | `packJsonSchema` | Game id `test` | Title `Ku Zo Wasa content pack: test` | Editors show which schema a file is using. |
| 310 | requires what a theme must say, and makes fields with a default optional | `themeJsonSchema` | The theme schema | Required: id, name, description, contributors, scheme, colors; no unknown fields; all 19 colors required | Editors ask for what CI demands and no more: fonts, radius and the rest can be left out. |
| 95 | are named after the game | `schemaFileName` | `charades` | `charades.pack.schema.json` | Packs point at this exact name in `$schema`. |
| 96 | are written with 2-space indents and a final newline | `schemaFileText` | `{ a: 1 }` | Two-space indented JSON ending in a newline | Readable files whose changes show cleanly in pull requests. |
| 97 | matches the zod schemas (run `pnpm generate-schemas` if not) | Up-to-date check | Every game's `schema.ts`, the variant schema and the theme schema, and their files in `schemas/` | Each committed file equals a freshly generated one | If someone changes a schema without regenerating, editors would show old rules. This failing test names the fix. |
| 98 | has no schemas for games that no longer exist | Up-to-date check | The files in `schemas/` | Exactly one per game that has a `schema.ts`, plus `theme.schema.json` and `variant.schema.json` | Stops leftover files from a renamed or removed game. |

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
| 311 | finds nothing wrong with a valid theme | `checkThemeFile` | A valid theme with the right `$schema` | No problems | The content check passes good themes. |
| 312 | reports text that isn't JSON, a wrong $schema link, and problems from the theme check | `checkThemeFile` | Broken JSON; `$schema: "theme.schema.json"` with radius 9 | "Not valid JSON…"; `$schema` should be `../../schemas/theme.schema.json`, and a `radius` problem | Same as for packs: a wrong link silently switches off editor help. |
| 317 | reports colors that are hard to read, once the theme's shape is right | `checkThemeFile`, contrast | The valid theme with `muted: "#555555"` | One problem at `colors.muted-foreground`, naming "muted-foreground on muted" | CI catches an unreadable theme, not only a malformed one (ADR 0010). |
| 456 | finds nothing wrong with a valid variant, and reports text that isn't JSON, a wrong $schema link and its problems | `checkVariantFile` | A valid variant; broken JSON; `$schema: "variant.schema.json"` with no packs; the variant in `anime.json` | Nothing; "Not valid JSON…"; the right `$schema` and a problem at `packs`; a problem at `id` | CI checks variant files the way it checks packs (ADR 0018). |

## Themes

`src/sdk/theme/theme.test.ts`, testing `color.ts`, `schema.ts` and `loadThemes.ts` in `src/sdk/theme/` (ADR 0010). The theme used is `themeData()` from `testTheme.ts`: `paper`, light, in black and white only (white surfaces with black text; black accents with white text), so it passes every contrast pair.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 303 | reads #rrggbb and oklch(L C H), with lightness as a number or a percentage | `parseColor` | `#ff8000`; `oklch(0.64 0.19 42)`; `oklch(64% .19 42)` | Red, green, blue 0–1; then lightness 0.64, chroma 0.19, hue 42, twice | Designers write hex or oklch; the contrast check needs numbers. |
| 304 | rejects other formats and values out of range | `parseColor` | `#f80`, `orange`, `rgb(…)`, lightness 1.2, chroma 0.6, hue 400, commas | Nothing read, every time | Only colors the contrast check can work out are allowed. |
| 305 | fills in every optional field with its default | `checkTheme` | A theme with only the required fields | System rounded fonts, radius 1, soft shadows, thin borders, 200 ms, no gradient, and every part plain (plain cards, solid buttons, flat page, no decorations, regular icons) | A first theme can be just colors. |
| 306 | reports a missing or unreadable color, an unknown field, a font not on the list and a scheme that isn't light or dark | `checkTheme` | No `ring`; `primary: "orange"`; font `comic-sans`; scheme `both`; a `colour` field | A problem at each, the color one saying how to write a color | Every mistake at once, where it is. |
| 307 | reports an id that isn't the file name, and a gradient from a color that isn't a token | `checkTheme` | Id `card` in `paper.json`; gradient to `sky` | The id problem; a `gradient.to` problem | Same id rule as packs. A gradient can only use the theme's own colors. |
| 308 | returns the themes sorted by id | `loadThemes` | `paper` and `ink` | `ink`, `paper` | The picker lists themes in the same order everywhere. |
| 309 | throws one error listing every problem in every file, and throws when there are no themes | `loadThemes` | Radius 5 in `paper.json`, a wrong id in `ink.json`; then no files | One error naming both files; "No themes found" | A broken theme is loud while it's being edited, and the app never starts without one. |

## Contrast

`src/sdk/theme/contrast.test.ts`, testing `src/sdk/theme/contrast.ts`: the contrast check every theme passes in CI (ADR 0010). Ratios use WCAG 2.2's formula; minimums are level AA.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 313 | matches WCAG's published values, in either order and in either color format | `contrastRatio` | Black and white; #777 on white; both orders; `oklch(1 0 0)` on black; pure red in hex and in oklch, on black; one color on itself | 21; 4.48; the same both ways; 21; 5.25 both times; 1 | The math matches the published numbers, and oklch colors (lightness, chroma and hue) come out the same as their hex twins. |
| 314 | passes black and white everywhere | `checkContrast` | The test theme | No problems | The pair list has no impossible pair. |
| 315 | reports each pair under its minimum at the color to change, with what it's for, its ratio and the minimum | `checkContrast` | Primary #999 with white text on it | Two problems: white on primary, and primary on the page, each 2.84 : 1, needing 4.5 : 1 | The message tells a designer exactly which color to change and by how much, without running the app. |
| 332 | checks the outlines of buttons against the page and dialogs, and of text fields against the page | `checkContrast`, outlines | Border and input #ddd on white | Three problems, each 1.35 : 1 needing 3 : 1: border on the page, border on a card, input on the page | An outline that's barely darker than the page doesn't show where the button is (WCAG's 3 : 1 for control edges). |
| 339 | checks the text on glass cards against the page behind them, and only for glass | `checkContrast`, glass | White text on black cards, on a white page; once with plain cards, once with glass | Glass adds exactly one problem: card-foreground on background, 1 : 1 | A glass card lets the page show through, so its text has to read against the page as well as the card (ADR 0011). |
| 340 | checks text on the page against both ends of a gradient | `checkContrast`, gradient | Muted #222 on a white test theme; no gradient, then a gradient from background to muted | No problems mentioning muted; then eight: every color drawn on the page (text, links, errors, the timer, the focus ring, outlines), on muted | A gradient makes the bottom of the page a different color, so everything drawn on the page must read there too. Found while making Space Travel. |
| 316 | lets large text and the focus ring pass at 3 : 1, but not below | `checkContrast` | Warning and ring #949494 (3.03 : 1); then warning #aaaaaa (2.32 : 1) | No problems; then one at `colors.warning` | WCAG allows less contrast for big text (the timer) and outlines than for body text. |

## Theme variables

`src/sdk/theme/apply.test.ts`, testing `themeVariables` in `src/sdk/theme/apply.ts`: the CSS variables a theme becomes (ADR 0010). Uses the test theme from `testTheme.ts`, with defaults filled in by `checkTheme`.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 324 | writes every color under its token's name, and the fonts as their families with fallbacks | Colors, fonts | Body Nunito, headings Caveat | `--primary` and `--card-foreground` as written; `"Nunito Variable", ui-rounded…` and `"Caveat Variable", ui-rounded…`; radius 1rem | Text shows in a system font while a bundled one loads, never in nothing. |
| 325 | turns shadow and border styles into CSS: none, soft or bold shadows, and 2px or 3px outlines | Shadows, outlines | Flat; the default (soft); bold; thin; thick | `none`; Tailwind's soft shadow; a hard offset shadow in the text color; 2px; 3px | Designers pick a word; the CSS is ours, so every theme's shadows stay in proportion. |
| 337 | names the theme's parts as attributes, and sets the icon line weight | `themeAttributes`, icons | Thin icons; the default; bold | `data-theme` and one attribute per part, all plain; icon stroke 1.5, 2, 2.75 | `parts.css` styles by these attributes, and every icon's weight follows the theme (ADR 0011). |
| 326 | fades the page from one color token to another, or leaves it plain | Gradient | No gradient; background to muted | `none`; `linear-gradient(to bottom, var(--background), var(--muted))` | A gradient can only use the theme's own colors, so it can't break contrast with anything off the list. |

## Team-turns config

`src/sdk/formats/team-turns/config.test.ts`, testing `src/sdk/formats/team-turns/config.ts`, the settings every team-turns game shares. Starts from the least a setup screen sends (teams Lions and Eagles, pack `back-to-school`) and changes one setting at a time. "Rejected at X" means the error points at setting X.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 119 | fills in 3 rounds, 60 seconds and no tag filter | Defaults | Only teams and packs | Rounds 3, seconds 60, tags `[]` | Players can start a game after naming teams and picking a pack. |
| 120 | keeps every setting that is given | Config schema | Three teams, 5 rounds, 90 seconds, two packs, tag `snack` | Unchanged | Defaults never overwrite what players chose. |
| 121 | needs 2 to 10 teams | `teams` | 1 team; 10 teams; 11 teams | Rejected at `teams`; accepted; rejected at `teams` | A team game needs two sides, and more than 10 names won't fit the screens. |
| 471 | Free Play: exactly one player; otherwise at least two teams, as before | `solo`, `timer` | One team with `solo` and `timer: false`; two teams with `solo`; one team without; `timer: "no"` | Accepted; "Free Play is for one player"; "Add at least two teams"; a problem at `timer` | One player only in Free Play (ADR 0019), and the teams rule unchanged otherwise. |
| 122 | trims team names and rejects blank or long ones | `teams` | `"  Lions "`; a name of spaces; 20 characters; 21 characters | Trimmed to `Lions`; rejected at `teams.1`; accepted; rejected at `teams.1` | Names show on the handoff screen and leaderboard, at arm's length. |
| 123 | rejects two teams with the same name, ignoring case and spaces, pointing at the second | `teams` | Lions, Eagles, ` lions` | Rejected at `teams.2` | Two teams called the same would make the leaderboard ambiguous. Uses the same comparison as duplicate items. |
| 124 | accepts whole numbers of rounds from 1 to 10 and seconds from 10 to 300 | `rounds`, `seconds` | Rounds 1, 10; 0, 11, 2.5. Seconds 10, 300; 9, 301, 60.5 | Ends of each range accepted; the rest rejected | Keeps games playable: no zero-round games, no 3-second turns. |
| 125 | needs at least one pack, with pack ids written as in pack files, not repeated | `packs` | None; `Back To School`; `anime` twice | Rejected at `packs`; at `packs.0`; at `packs` | Every game needs items, and ids must match real pack files. |
| 126 | checks tags are kebab-case and not repeated | `tags` | `tv-show`; `TV Show`; `snack` twice | Accepted; rejected at `tags.0`; rejected at `tags` | Same tag rules as items, so a filter can match them. |
| 127 | rejects an unknown setting, such as a typo | Strict settings | `second: 90` | Rejected as an unknown setting | Catches typos, and settings left over from an older saved game. |
| 128 | can be extended with a game's own settings and stays strict | `extend` | A Charades-like config with `punishSkips` | Default `false` filled in; `punishSkip` (typo) rejected | Games add their own settings on top (chapter 05) without losing the checks. |
| 129 | types settings with defaults filled in, and the setup input with them optional | Types | `TeamTurnsConfig` (with optional `solo` and `timer`) and `TeamTurnsSetup` | Settings have every field; the setup input accepts only teams and packs | The machine never has to handle a missing setting. Checked by `pnpm typecheck`. |

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
| 145 | resetTurn starts a fresh turn record, leaving the timer alone | `resetTurn` | Last turn's record `['old']`, timer at 5 | Record empty; timer still 5; the original unchanged | A phase before the turn starts a turn record without starting the clock (ADR 0014). |
| 378 | startTimer sets the turn to end the turn length from now, leaving the turn record alone | `startTimer` | Record `['kept']`, now = 1000 ms, 60-second turns | `turnEndsAt` 61 000; the record unchanged | The timer starts when the turn does, whoever starts it. |
| 472 | startTimer sets no end when the timer is off (Free Play) | `startTimer` | `timer: false` | `turnEndsAt` null | Free Play has no clock unless players ask for one. |
| 146 | puts the next item from the pool on screen | `drawItem` | Pool `a`, `b` | Item `a`; pool `b` remaining, `a` drawn; the original unchanged | The card on screen and the pool move together. |
| 147 | adds the turn's points to the current team only | `bankPoints` | Eagles (team 1) playing, scores 4, 2, 7, three words guessed | Scores 4, 5, 7; the original unchanged | Points go to the team that earned them. |
| 260 | scores the turn under the game's settings | `bankPoints` | A made-up rule worth one point per word per round; two words, 2 rounds | Lions score 4 | `points` receives the settings (ADR 0007), so a game can make its scoring a setting. |
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
| 208 | keeps the game's points, for views to show what a turn is worth | `machine.points` | Two words got, one skipped | 2 | ADR 0005: summary views show `points(turn, config)`. |
| 153 | starts at the first team's handoff with scores at zero and the items shuffled | Starting context | Seed 1 | `handoff`, scores 0 and 0, team 0, round 1, nothing on screen, all five words in the pool | The format builds the starting context from the settings and items. |
| 154 | refuses to start with no items | Starting context | No items | Error | A game with nothing to draw can't be played; failing at the start is clearer than failing on the first draw. |
| 155 | starts a turn with the timer set and the first item on screen | `start` event | `start` at 5000 ms | Phase `turn`, `turnEndsAt` 35000, the first drawn word on screen | The handoff's `start` runs `startTurn` then `drawItem`. |
| 379 | goes there from the handoff with the first item drawn and onStart run, but no timer, until the game starts it | `beforeTurn` | Ready Duel (a `ready` phase before the turn): start at 5 s; pass at 6 s; go at 7 s | `ready`, no timer, the onStart action run; a new word, the old one drawn for good; `turn`, ending at 37 s; no `validateMachine` problems | A game can show something before the clock runs (ADR 0014). |
| 380 | refuses a phase that could start the turn without its timer, or a phase the game doesn't have | `checkBeforeTurn` | `go` to `turn` without `startTimer`; `beforeTurn: 'steady'` | Errors naming the phase and event, and the missing phase | A turn that never ends would be a silent bug at a party; it fails when the machine is built instead. |
| 261 | runs the game's onStart actions after the first item is drawn | `onStart` (ADR 0007) | A game whose `onStart` marks the first word as got | After `start`, the word on screen is already in `got`; `validateMachine` finds nothing | The format's `start` draws the first item, so `onStart` is the only way a game can react to it (Charades picks its mode). |
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
| C30 | An unknown action in `onStart` | `onStart: ['pickMode']` with no `pickMode` | As C16, for the actions a turn starts with. |
| C33 | A phase before the turn that the game doesn't have | `beforeTurn: 'steady'` | The handoff would lead nowhere. |

## defineGame

`src/sdk/game/defineGame.test.ts`, testing `src/sdk/game/defineGame.ts`. A tiny team-turns game (`word-duel`) with `{ text }` items, two packs (`animals`, `food`), the plain `TeamTurnsConfig` schema, and one preset (`quick`: 1 round, 30 seconds, pack `food`). Each test changes one part. "Reports X" means the thrown error lists a problem at X.

### Runtime tests

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 163 | returns the game with the format's default views filled in | `defineGame`, views | The valid game, with a view for `turn` only | The same machine; views are the format's three defaults plus the game's `turn` | ADR 0005: games write views for their own phases and get the format's for free. |
| 165 | reports problems in meta, with where each is | `meta` | Id `Word Duel`, complexity 6, players min 4 max 2, no contributors | One error naming the game, listing `meta.id`, `meta.complexity`, `meta.players` and `meta.contributors` | The library shows these; mistakes fail the game's tests instead of reaching players. All problems at once. |
| 166 | needs at least one pack | Content | No packs | Reports `content.packs` | A game without items can't be played. |
| 451 | accepts a game without variants, and gives it an empty list | Variants | No `variants`; then `quick-food` | `[]`; then `quick-food` | Variants are optional, and the app can always read the list. |
| 452 | checks a variant's settings against the game's config schema | Variants | `quick-food` with 5-second turns | Reports `variants.0.settings.seconds` | A variant can't start a game the setup screen would refuse. |
| 453 | reports a variant that names a pack the game does not have | Variants | Pack `anime` | Reports `variants.0.packs` naming `anime` | Typos in pack ids are caught before players see an empty game. |
| 454 | reports a variant that opens a setting there isn't, or opens or sets teams, packs or tags | Variants | Open rounds, speed, packs; tags in settings | `speed` and `packs` reported with the settings it can open; tags belong at the top of the file | Open settings must be real; the content is never open (ADR 0018). |
| 476 | reports a variant offering Free Play in a game that has none, and accepts one in a game that does | Free Play | `freePlay: true` in Word Duel; then with a Free Play; then one starting at 5-second turns | "Word Duel can't be played alone"; accepted; a problem at `variants.0.freePlay.seconds` | A variant can't offer what its game can't do (ADR 0019). |
| 455 | reports two variants with the same id, and an id a page of the game already uses | Variants | Two `quick-food`; one `rules` | The second `quick-food`; `rules` is taken | A variant's id is its address, `/:gameId/:variantId`. |
| 510 | refuses a game id the library's own pages use | `meta.id` | Id `games`; id `custom` | Each is taken, naming its page | `/games` and `/custom` would hide a game with that id (ADR 0021). |
| 300 | needs rules, in the markdown the rules screen can show | Rules | Rules of only spaces; then a paragraph and a table | Reports `rules: Write how to play`; then `rules: Line 3: tables aren't supported; use a list` | Every game has rules (standard §13), and a construct the rules screen can't show fails CI instead of reaching players as raw symbols (ADR 0009). |
| 170 | keeps the item and settings types from the schemas | Types | The defined game | Packs typed `Pack<{ text: string }>[]`; settings typed `TeamTurnsConfig` | The app (chapter 04) works with a game's real types. Checked by `pnpm typecheck`. |
| 206 | uses a game's own view for a format phase instead of the default | Views | Views for `turn` and `turn_summary` | The game's summary view is used | A game can replace a format view when the default can't show what it needs. |
| 207 | reports a phase without a view | Views | `views: {}` (types bypassed) | Reports `views: Phase "turn" has no view` | Types catch this; the check also covers code that bypasses them. |

### Compile-time checks

| # | Mistake | Example | Why |
|---|---|---|---|
| C24 | The machine plays different items from the packs | A machine for `{ word }` items with `{ text }` packs | The item schema, the packs and the machine must agree on what an item is. |
| C26 | A format that doesn't exist yet | `format: 'host-led'` | Only `team-turns` is built. |
| C27 | A game phase without a view | `views: { turn_summary: … }` with no `turn` | Players would see a blank screen in that phase. |
| C28 | A view for a phase the machine doesn't have | `views: { turn, steal }` | Usually a typo; the view would never be shown. |
| C29 | A view written for another game's items | A view reading `item.word` in a game whose items have `text` | It would show nothing, or crash, on the real items. |
| C31 | A settings view for a setting the game doesn't have | `view` reading `settings.mode` in a game with only the format's settings | It would show a setting that's never saved or checked (ADR 0008). |

## Settings and variants

`src/sdk/game/settings.test.ts`, testing `src/sdk/game/settings.ts`: the rules for a game's settings on setup (ADR 0008) and a variant's (ADR 0018). The schema is `TeamTurnsConfig` plus a nested setting of the game's own, `bonus: { got }` (default 1), like Charades' points. The variant `quick`: 1 round, 30 seconds, pack `food`, tag `fruit`.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 286 | defaultSettings: the schema's defaults for these packs, without teams | `defaultSettings` | Pack `food` | 3 rounds, 60 seconds, `food`, no tags, bonus 1; no teams | Setup starts from the schema's defaults, the game's own included, so the screen can't disagree with the schema. |
| 447 | openableSettings: every setting but teams, packs and tags | `openableSettings` | The schema | rounds, seconds, bonus | What a variant may open: players always name their teams, and the content is the variant. |
| 448 | variantSettings: the defaults plus the variant's changes, packs and tags, and throws on settings that fail | `variantSettings` | `quick`; then 5-second turns | 1 round, 30 s, `food`, `fruit`, bonus 1; then an error | A variant's setup starts from its own settings. |
| 449 | withOpenChanges: takes players' changes to open settings only, never packs or tags | `withOpenChanges` | Changes to rounds, seconds, packs, tags, bonus; open rounds and packs; then nothing open | Only rounds changed; then nothing | A remembered change to a setting the variant closes later doesn't leak through. |
| 477 | freePlaySettings: the variant's, then Free Play's start, then players' changes; always one round, solo, its content | `freePlaySettings` | `quick` with Free Play at 45 s, no timer; then changes to seconds, rounds, packs; then a change that fails | 1 round, 45 s, `food`, `fruit`, solo, no timer; 90 s but still 1 round and `food`; 45 s | Free Play is one round with the variant's content, whatever was saved. |
| 450 | isOpen: every setting on a game's own setup, only the open ones on a variant's | `isOpen` | No list; `['rounds']` | true; true for rounds, false for mode | Settings views ask it which settings to show. |

## Charades machine

`src/games/charades/machine.test.ts`, testing `src/games/charades/machine.ts` and `index.ts`: Charades on the team-turns format. Uses the real game: two teams (Lions, Eagles), 3 rounds, 60-second turns, the default points (describe 2, act 3, sing 3, skip 1), and the items of the real Back to School pack, picked with `choosePoolItems` as the app will.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 171 | is a valid game with the Back to School pack and its own settings | `index.ts` | The game's default export | Id `charades`, includes `back-to-school`, uses the Charades machine and settings schema | Importing `index.ts` runs `defineGame`'s checks; a broken game fails here. |
| 172 | has no mistakes validateMachine can find | `validateMachine` | The Charades machine | No problems | Required for every game (standard §12). |
| 173 | got: logs the card as got with its mode, shows the next one, and is worth the describe points | `got` | `got` on the first card, then time up, done and next | One entry: the card, `describe`, played `got`, not changed; a new card on screen; Lions score 2 | The core rule: a correct guess scores its mode's points. |
| 174 | skip: logs the card as skipped and shows the next one; a turn never scores below 0 | `skip` | `skip` on the first card, then time up, done and next | One entry, played `skipped`; a new card on screen; scores stay 0 and 0 | A skip costs points, but a bad turn can't take away earlier turns' points (ADR 0007). |
| 262 | scores a turn as the sum of its cards: two got and a skip is 2 + 2 − 1 | Points | got, got, skip, time up, done, next | Lions score 3 | Each card counts on its own, so a review can change one card's result. |
| 175 | time_up: logs the card on screen as not counted and goes to review; done goes on to the summary | `time_up`, `done` | `got`, time up, then done | Review, with the results got and not counted; the card on screen is the one logged; no new card drawn; then the summary, worth 2 | The card on screen when time ran out is kept, so review can count it if the team said it as the buzzer went (ADR 0007). |
| 272 | review: a correction changes what the turn is worth, and a second one undoes it | `toggle` | got, skip, time up (worth 1); toggle the skip; toggle the last card; toggle it again; done, next | 4 (the skip now got); 6 (the last card got); back to 4; Lions bank 6 | The whole point of review: a corrected card scores as if it had been tapped right. |
| 273 | review: ignores a correction for a card that wasn't played, and corrections outside review | `isEntry`, ignored events | Toggle card 2 and −1 of two; toggle in a turn; toggle on the summary | The same state back each time | A bad index can't crash or score, and nothing changes a turn once its review is done. |
| 176 | ignores got and skip outside a turn | Ignored events | `got` at the handoff; `skip` in review | The same state back | A stray tap between turns can't score. |
| 263 | describe: plays every card as describe, even items that can be acted or sung | Describe mode | A full game, seed 2026 | Some cards could be acted; every card is `describe` | Describe is the default way to play: the card shows no mode. |
| 264 | mix it up: gives each card one of its item's modes, so describe-only items are still described | Mix it up | A full game in mix, seed 2026, 4 cards a turn | 24 cards, each in one of its item's modes; some acted; some multi-mode items still described | A card is never asked to be acted unless its pack says it can be. |
| 265 | mix it up: picks the first card's mode too, and the same seed picks the same modes | `onStart`, determinism | 11 cards from seed 7, twice | The same modes both times, more than one kind | The first card is drawn by the format, so `onStart` picks its mode; modes come from the machine's `rng`, so a resumed game shows the same ones. |
| 177 | plays a full game from the first handoff to the results | Full playthrough | Seed 2026; each turn: start, got, got, skip, got, time up, done, next | 6 turns; ends in `results`; scores 15 and 15; 30 different items drawn | The whole game plays end to end with real content (standard §12). |
| 274 | resultOf: a correction swaps got and skipped, and counts the card on screen at time up as got | `resultOf` | Each of got, skipped and time up, as played and corrected | got, skipped, not counted; corrected: skipped, got, got | The one rule for what a correction means, in one function the views and scoring share. |
| 266 | entryPoints: a got card earns its mode's points, a skipped card costs the skip points, not counted is 0 | `entryPoints` | Points 1 / 4 / 5 / 2; got in describe and act; a skipped sing corrected to got; a skipped act; an act at time up | 1, 4, 5; −2; 0 | Every mode reads its own setting; a corrected card scores by its new result. |
| 267 | points: adds up the turn's cards under the game's settings, never below 0 | `points` | Act + sing − skip; describe at 4; two skips; nothing | 5; 4; 0; 0 | The settings decide the score; a turn's floor is 0 (ADR 0007). |
| 178 | markGot logs the card on screen as got, in its mode, without changing the context passed in | `markGot` | Gala on screen, mode sing, empty turn | One entry: Gala, `sing`, played `got`, not changed; the original unchanged | A test per action (standard §12). |
| 179 | markSkipped logs the card on screen as skipped, in its mode, without changing the context passed in | `markSkipped` | Gala on screen, mode describe, empty turn | One entry: Gala, `describe`, played `skipped`, not changed; the original unchanged | As above. |
| 275 | markTimeUp logs the card on screen as played at time up, after the cards before it | `markTimeUp` | Zobo already logged; Gala on screen, mode sing | Zobo, then Gala played at `time_up`; the original unchanged | As above. |
| 276 | toggleEntry corrects only the card named, and a second toggle undoes it | `toggleEntry` | Two cards; toggle card 1 twice | Only card 1 changed; then neither; the original unchanged | As above. |
| 277 | isEntry is true only for a toggle naming a card played this turn | `isEntry` | Two cards; toggles for 0, 1, 2, −1 and 0.5; a `done` | True, true; false for the rest | A test per guard (standard §12). Events come from views, so a bad index is checked, not trusted. |
| 268 | pickMode picks describe in describe mode, and one of the item's modes in mix it up | `pickMode` | Gala (describe, sing); describe; then mix with seeds 1–8 | `describe`; then both `describe` and `sing`, nothing else | As above. |

## Charades views

`src/games/charades/views/views.test.tsx`, testing `TurnView.tsx`, `ReviewView.tsx` and `SettingsView.tsx` in `src/games/charades/views/`: what Charades adds on top of the primitives. The turn and settings views are drawn in happy-dom; review rows are checked as plain data (`reviewRow`), since `Review` itself is tested in the SDK. The settings view gets its settings from a bit of state standing in for the setup screen.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 278 | says how to clue the card in Mix it up, with its icon and color, and nothing in Describe mode | Mode on the card | Gala, picked to be acted; in mix, then in describe | "Act it out" in the warning color with the person icon; then the card with no mode line | In Mix it up the card must say how to clue it; in Describe mode everything is described, so saying so is noise. |
| 470 | gives each mode its own icon and color, none of them got-it green or skip red | `modeLooks` | The three modes | Three different icons and three different tones, none success or destructive | Players tell the modes apart at a glance, by icon as well as color, without confusing them with Got it or Skip. |
| 279 | names each result, and marks a corrected card | `reviewRow` | Gala got; at time up; got then corrected | Got it (good); Not counted (neutral); Skipped (bad), changed | The words and colors players see in review come from the one `resultOf` rule. |
| 280 | shows how the card was clued only in Mix it up, and a free skip as neutral | `reviewRow` | Gala acted, in mix; a skip with skip points 0 | Detail "Acted"; Skipped in neutral | The mode matters for scoring only in Mix it up; a skip that costs nothing shouldn't look like a loss. |
| 283 | picks the mode, Describe to start with | Mode | Default settings; tap Mix it up | Describe picked; then Mix it up | Describe is the game most people know; one tap changes it. |
| 284 | changes points in Advanced settings within their limits, and resets them | Advanced settings | Mix it up; open Advanced settings; Acted + twice; Skipped −; Reset to defaults; Done | Reset off at first; Acted "5 points" with + off; Skipped "No penalty" with − off; summary "Describe 2 · Act 5 · Sing 3 · Skip 0"; after Reset "… Act 3 … Skip −1"; the dialog closes | The steppers can't leave the schema's ranges (1–5, skip 0–5), and a host who got lost can get back to the defaults in one tap. |
| 285 | says acted and sung points only count in Mix it up, when Describe is picked | Advanced settings | Describe; open Advanced settings; Done; pick Mix it up; open again | The note; then no note | In Describe mode the acted and sung points never apply, so a host changing them should know. |
| 457 | shows only the open settings: the mode alone, points alone under their own heading, or nothing | Settings view on a variant | Open rounds and mode; open points; nothing open | The mode, no Advanced; a Points heading with Advanced, no mode; neither | A variant shows only what it lets players change (ADR 0018). |

## Name Ten content

`src/games/name-ten/schema.test.ts`, testing `src/games/name-ten/schema.ts` (a category and its answers, ADR 0012) and the packs in `src/games/name-ten/content/`. "Numbers" with the answers Zero to Nine stands in for a category.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 344 | needs a category and its answers, filling in no tags | Item schema | Numbers, ten answers | The same, with `tags: []` | Tags are optional. |
| 345 | needs 10 to 20 answers, each 1 to 50 characters, and a category of at most 60 | Limits | 9 answers; 21; a blank answer; a 51-character one; a 61-character category | A problem at `answers` saying "at least 10", then "at most 20"; then at `answers.9` twice; then at `category` | A board deals up to 15, so fewer than 10 answers runs dry; more than 20 means the board will miss answers people say. |
| 346 | reports an answer listed twice, ignoring case and spaces, where the copy is | Repeats | Zero to Eight, then " zero " | One problem at `answers.9` naming `answers.0` | The same answer twice would be two tiles on the board for one shout. |
| 347 | checks tags, and rejects an unknown field | Tags, strict | Tag `Maths`; an `items` field | A problem at `tags.0`; one problem | Same rules as every game's items. |
| 348 | names a category by its name | `itemKey` | Numbers | `Numbers` | Two categories with the same name are duplicates in a pack. |
| 349 | ships a valid Back to School pack, every category with 10 to 20 answers | Content | The pack files | Back to School loads, with at least 30 categories, each with 10+ answers | The game has content that passes its own rules. |

## Name Ten settings

`src/games/name-ten/config.test.ts`, testing `src/games/name-ten/config.ts`: the format's settings plus `shown`, the number of answers on the judge's board. Starts from the least setup sends: teams Lions and Eagles, pack `back-to-school`.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 350 | puts 10 answers on the board unless asked, with the format's defaults for the rest | Defaults | The least setup | 3 rounds, 60 seconds, no tags, 10 answers shown | Ten is the game's name. |
| 351 | takes 10 to 15 answers on the board, in whole numbers | `shown` | 15; then 9, 16 and 12.5 | Accepted; then rejected, each | Every category has at least 10 answers, so a board of 10 is never short; more than 15 is too long to scan in a minute. |

## Name Ten machine

`src/games/name-ten/machine.test.ts`, testing `src/games/name-ten/machine.ts` (ADR 0012). Games use the real Back to School pack and the default settings (Lions and Eagles, 3 rounds, 10 answers on the board). The unit tests use "Numbers", a category with twelve answers, 0 to 11.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 352 | has no mistakes validateMachine can find | `validateMachine` | The machine | No problems | Required for every game (standard §12). |
| 353 | start: deals the setting's number of the category's answers onto the board (all of them if it has fewer), none ticked | `dealBoard` via `onStart` | Start a turn; then with 15 on the board | 10 different answers from the category, none ticked; then 15, or all of a shorter category's answers | A board is the setting's size where the category allows, and never invents answers. |
| 354 | start: the same seed deals the same board, and another seed shuffles it differently | Determinism | Seed 7 twice; seeds 7 and 8 | The same turn twice; a different category or order | A saved game resumes on the same board (ADR 0006). |
| 355 | toggle: ticks and unticks the answer named, and the turn is worth one point per tick | `toggle`, `points` | Tick answers 0, 3, 5, then 3 again | Ticked: 0 and 5; worth 2 | The judge can fix a mis-tap during the turn. |
| 356 | lock_in and time_up both end the turn in review, where a correction counts and done goes on to the summary | Review | Tick 0, end early; or let time run out; in review tick 9 and untick 0; done; next | Review both ways; worth 1; the summary; Lions bank 1 | The judge can end early when the team gives up, and review fixes the last answers (ADR 0007). |
| 357 | ignores a toggle for an answer not on the board, and toggles outside a turn or review | `isAnswer`, ignored events | Toggle 10, −1 and 2.5 in a turn; toggle at the handoff; toggle on the summary | The same state back each time | Bad indexes can't change a score, and a turn can't change after its review. |
| 381 | category: shows the category with its board dealt but no clock, and play starts the turn on it | `category`, `play` | Start; play at 5 s | `category`, no timer, 10 answers dealt; then `turn` ending at 65 s, on the same category and board | The team chooses before the clock runs (ADR 0014). |
| 382 | category: skip draws the next category and deals its board, three times at most, and a skipped one is gone for good | `skip` | Skip; two more; a fourth | A new category with its own board, 1 skip used; then 3; the fourth ignored; the first three categories in the pool's drawn list | Three skips a turn, and a skipped category doesn't come back. |
| 383 | category: a new turn gets its skips back, and play and skip are ignored once the turn has started | Skips per turn | Skip, play; skip during the turn; finish and start the next turn | 1 skip used; the skip ignored; the next team's category with 0 skips used | Skips belong to a turn, and can't be used once the clock runs. |
| 358 | plays a full game from the first handoff to the results | Full game | Seed 2026; each turn: skip a category, play the next, tick 3, end early, count a fourth in review, done, next | 6 turns, results, 12 points each, 12 different categories drawn | A whole game runs to the end with the format's loop (standard §12). |
| 359 | deal: takes each answer at most once, in a shuffled order | `deal` | Numbers' 12 answers, 10 dealt, seed 3, twice | 10 different answers, not in the written order; the same both times | A fair, repeatable shuffle, with the machine's random numbers (`rng.shuffle`). |
| 360 | dealBoard deals the setting's number of answers, none ticked, without changing the context passed in | `dealBoard` | Numbers, 2 skips used | 10 answers, none ticked, still 2 skips; the original unchanged | A test per action (standard §12); actions never change their input. |
| 361 | toggleAnswer flips only the answer named, without changing the context passed in | `toggleAnswer` | Board 0, 1, 2 with 1 ticked, 2 skips used; toggle 1 | None ticked, still 2 skips; the original still has 1 ticked | As above. |
| 384 | countSkip counts one more skip, and canSkip is true only while skips are left | `countSkip`, `canSkip` | 2 skips used; then 0, 2, 3 | 3, the original still 2; true, true, false | A test per guard and action (standard §12). |
| 362 | isAnswer is true only for a toggle naming an answer on the board | `isAnswer` | Toggles for 0, 2, 3, −1 and 0.5; `lock_in` | True, true; false for the rest | A test per guard. Events come from views, so a bad index is checked, not trusted. |

## Name Ten views

`src/games/name-ten/views/views.test.tsx`, testing the views in `src/games/name-ten/views/`. Screen tests (happy-dom). Contexts come from the real machine: teams Lions, Eagles and Hawks, with "Numbers" (answers 0 to 11) as the only category.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 366 | names the next team as the judge, the first judging the last | `judgeOf` | Lions playing; Hawks playing | Eagles; Lions | Every team judges exactly one other team each round (ADR 0012). |
| 367 | asks for the phone to go to a judge from the next team, and says who is up | Handoff | The first handoff; tap Start | "Hand the phone to a judge from", Eagles, "Lions are up · Round 1 of 3"; `start` sent | The guessing team mustn't see the board. |
| 385 | shows the team its category, never the answers, and plays it or skips it | Category view | The first category; tap Skip; tap Play this | "Lions, here's your category", Numbers, no answer from the board, "3 skips left…"; `skip` sent; `play` sent | The judge can show the screen to the team: the board stays hidden until the turn. |
| 386 | counts skips down, and turns Skip off when none are left | `skipsLeftText`, Skip button | 0, 2 and 3 skips used; the view with 3 used | "3 skips left…", "1 skip left…", "No skips left: play this one."; Skip off | Players see how many skips they have, and can't tap one they don't. |
| 368 | shows the category and its board, reports taps by position, and can end early | Turn | A turn on Numbers; tap the fifth answer; tap End turn early | The category heading; the board's answers in order; `toggle` 4; `lock_in` | The judge ticks what's said and can stop when the team gives up. |
| 369 | lists the board as got or missed, and talks about answers, not cards | Review | A board with Biro got and Ruler missed; the review view | Got it (good), Missed (neutral); "Check the answers before they count."; a list named "Answers this turn" | Review reuses Charades' screen, in Name Ten's words. |
| 370 | sets the answers on the board from 10 to 15 | Settings | The default; More six times | Less off at 10; 15, with More off | The stepper can't leave the schema's range. |
| 458 | shows answers on the board only when the variant opens it | Settings view on a variant | Open rounds; open shown | No stepper; the stepper | A variant shows only what it lets players change. |

## Name Ten game

`src/games/name-ten/game.test.ts`, testing `src/games/name-ten/index.ts`: the game's single `defineGame` export.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 371 | is a valid game with the Back to School pack, its own settings, and its own handoff | `index.ts` | The game's default export | Id `name-ten`; Back to School; its machine and settings; its own handoff view; rules with "## A turn" | `defineGame` checked everything (meta, packs, presets, rules, a view per phase) when the file loaded; this checks Name Ten wired its own parts in. |

## Trivia Night content

`src/games/trivia-night/schema.test.ts`, testing `src/games/trivia-night/schema.ts` and its packs (ADR 0015). The question in most tests is "What is the capital of Nigeria?" with Abuja, Lagos, Kano, Ibadan; the answer is Abuja.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 396 | needs a question, its options and the answer, filling in no tags | Item schema | The question, no tags | The same, with `tags: []` | Tags are optional for contributors. |
| 397 | checks the options with the SDK's rules, and the answer is one of them | `Options`, `checkAnswer` | One option; `abuja` repeated; answer Port Harcourt | Problems at `options`, `options.2`, `answer` | The game uses the shared rules, so every multiple-choice game checks the same way. |
| 398 | keeps the question to 150 characters, checks tags, and rejects an unknown field | Item schema | 151 characters; tag `Maths`; a `difficulty` field | Problems at `question`, `tags.0`; one problem | A question has to fit above its options; `difficulty` isn't a field yet (ADR 0015). |
| 429 | takes an optional subtitle of up to 100 characters | `subtitle` | "Hint: not Lagos"; 101 characters; a blank | Kept; problems at `subtitle` twice | Optional, short, and never empty. |
| 399 | names a question by its wording | `itemKey` | The question | Its wording | Two packs with the same question play it once. |
| 400 | ships a valid Back to School pack, every question tagged with its subject | The shipped pack | `content/*.json` | Back to School loads, with at least 100 questions, each with exactly one of maths, science, social-studies, entertainment, general | Players filter by subject. |
| 437 | ships Masculin ou féminin ?: French words, each with its meaning, the same two options, and both answers often | The Masculin ou féminin ? pack | `content/*.json` | Named "Masculin ou féminin ?", in French, at least 200 words, each with Masculin and Féminin, a subtitle, and tagged noun or adjective; between 40% and 60% féminin | A pack where one answer wins most of the time teaches nothing. |
| 438 | never shows an article in Masculin ou féminin ?, which would give the answer away | The Masculin ou féminin ? pack | Every question | None starts with le, la, les, un, une or l' | "la chaise" answers its own question. |

## Trivia Night settings

`src/games/trivia-night/config.test.ts`, testing `src/games/trivia-night/config.ts` (ADR 0015). The least settings: teams Lions and Eagles, pack Back to School.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 401 | plays one question a 30-second turn for 1 point, options shuffled, unless asked | Defaults | The least settings | 3 rounds, 30 seconds, no tags, `questions` mode, 1 question, 1 point, `shuffle` | One question a turn is the default way to play, with 30 seconds for it. |
| 402 | takes against the clock, 1 to 50 questions, 1 to 5 points and A to Z, and keeps the format's turn limits | Limits | Clock, 10, 5, alphabetical, 300 s; then 0 and 51 questions, 0, 6 and 1.5 points, `random`, `steal`, 5 and 301 seconds | The first kept as given; every other refused | Only the default turn changes, not the format's 10–300 second limits. |

## Choice turn settings

`src/sdk/formats/team-turns/choice/config.test.ts`, testing `choiceConfig` in `config.ts` next to it (ADR 0017).

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 432 | takes a game's own defaults for any choice setting, keeping the limits, and its own for the rest | `choiceConfig` | 60 s, 10 questions, A to Z; then no defaults; then 51 questions, 5 s, 6 points | 60, questions, 10, 1 point, A to Z; 30, questions, 1, 1, shuffle; each refused | Each multiple-choice game picks its defaults without copying the limits. |

## Choice turn machine

`src/sdk/formats/team-turns/choice/machine.test.ts`, testing `choiceTurns` in `machine.ts` next to it (ADR 0015, 0017), on a stand-in game: eight questions of four options each. Moved from Trivia Night's tests when its turn moved into the SDK. Teams Lions and Eagles; the defaults unless a test says otherwise (one question a 30-second turn, 1 point, shuffled). "Answer it" taps the right option on screen, or a wrong one.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 403 | has no mistakes validateMachine can find | Machine | The machine | No mistakes | Every phase, guard and action it names exists. |
| 404 | start: shows the first question with its options shuffled, nothing picked, and a 30-second clock | `start`, `dealOptions` | Start at 1 s; seeds 1 to 5 | `turn` ending at 31 s; the question's own options; nothing picked, no results; more than one option order across seeds | The clock starts with the question, and the order changes each game. |
| 405 | answer: a right pick is worth the points setting, a wrong one nothing, and both show the result | `answer`, points | Answer right; wrong; right with 3 points | `reveal`, the pick kept, `[true]` and 1 point; `[false]` and 0; 3 | Scoring by the setting, and a wrong answer costs nothing. |
| 406 | ignores an answer for no option, a second answer, and an answer outside the turn | `isOption` | Positions −1, 4, 1.5; an answer in `reveal`; one in the turn summary | Nothing changes each time | Events come from views; a team can't change its pick after the result. |
| 407 | one question a turn: continue after the result ends the turn | `continue` | Answer, continue | `turn_summary` | The default way to play. |
| 408 | a set number: continue draws the next question until that many are answered, then ends the turn | `moreQuestions`, `drawItem` | 3 a turn: right, wrong, right | Back to `turn` twice with nothing picked; 3 different questions; `[true, false, true]`, 2 points; then `turn_summary` | Questions mode with more than one. |
| 409 | against the clock: questions keep coming, and time_up ends the turn from a question or a result | Clock mode, `time_up` | 12 right answers with `questions: 1` set; then `time_up` on a question and on a result | Still in `turn`, 12 points; `turn_summary` both times | Against the clock ignores the question count; only time ends the turn. |
| 410 | A to Z: the options in alphabetical order | `order` | Alphabetical | The options sorted A to Z, numbers in number order | The setting reaches the card. |
| 411 | plays a full game from the first handoff to the results | Whole game | Seed 2026; 6 turns of one question, Lions right, Eagles wrong | Final; scores 3 and 0; 6 different questions drawn | The format and the game work together end to end. |
| 412 | dealOptions puts the options in the order set, nothing picked, keeping the results, without changing the context passed in | `dealOptions` | Capital? Lagos, Abuja, Kano, with option 1 picked; shuffled and A to Z | The same three, nothing picked, results kept; Abuja, Kano, Lagos; the original unchanged | A test per action (standard §12). |
| 413 | pick records the option and whether it was the answer, without changing the context passed in | `pick` | Answer 1 (Abuja), answer 0 (Kano), after one right | Picked 1, `[true, true]`; `[true, false]`; the original unchanged | Right is decided by the answer as written. |
| 414 | isOption is true only for an answer naming an option; moreQuestions follows the mode and the count | Guards | Positions 0, 2, 3, −1, 0.5; one answered with 1, 2 a turn, and against the clock | true, true, false, false, false; false, true, true | A test per guard. |

## Choice turn views

`src/sdk/formats/team-turns/choice/views.test.tsx`, testing `TurnView.tsx` (`choiceTurnView`) and `SettingsView.tsx` next to it (ADR 0015, 0017). Moved from Trivia Night's tests. Screen tests (happy-dom), with real states from the machine on one question: "What is the capital of Nigeria?" (Lagos, Abuja, Kano, Ibadan; the answer is Abuja). `questionCount` is a plain function.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 415 | shows the team, the clock and the question with its options in the order dealt, and reports the pick | Turn view | The first question; tap the third option | Lions, a timer, the question, the options in the turn's order; `answer` with index 2; the turn's button hidden | The team sees what to answer, and the machine gets the position tapped. |
| 416 | after a pick, shows the result and ends the turn on its last question, without the clock | Result | Lagos picked, one question a turn; tap End turn | "Not quite: it's Abuja.", no timer; `continue` sent | Time running out mustn't cut the last result short (ADR 0015). |
| 417 | with more to come, keeps the clock and offers the next question | Result | Abuja picked, 3 a turn | `reveal`; "Right!", a timer, Next question | The clock still matters while questions are left. |
| 418 | counts questions: of a set, against the clock, and not at all for one | `questionCount` | One answered, open, 5 a turn; one answered and picked; against the clock; one a turn | "Question 2 of 5", "Question 1 of 5", "Question 2", nothing | The team knows how far into the turn it is. |
| 430 | shows the result for 0.75 seconds, then goes on by itself, with no button to tap | Against the clock | Lagos picked; the fake clock moved 749 ms, then 1 ms | The result; Next question hidden; nothing sent, then `continue` once | The team keeps its eyes on the questions, and the next one comes as soon as the result is seen. |
| 431 | waits for a tap in a set of questions, and fades each new question in | A set of questions | Abuja picked, 3 a turn; 5 s pass | No `continue` sent; the card inside `animate-fade-in` | Only against the clock does play go on by itself. |
| 419 | picks the mode, with questions per turn only for a set number, 1 to 10 | Settings view | Tap More 12 times; then Against the clock | 1, then 10 at most; the stepper gone | The count only means something for a set number. |
| 420 | sets points from 1 to 5, and the order of the options | Settings view | Tap More 6 times on points; tap A to Z | "1 point", then "5 points" at most; Shuffled checked, then A to Z | Every setting can be set on setup. |
| 459 | shows only the open settings, with questions per turn on its own when the mode is closed | Settings view on a variant | Open questions; open mode, questions, order against the clock; open rounds | Questions per turn under its own heading, nothing else; the mode and order, no questions (it's against the clock); nothing | Masculin ou féminin ? locks the mode but lets players set how many words a turn. |
| 474 | reads and sets the length: 10, 20 or 50 questions with no clock, or against the clock | `lengthOf`, `lengthSettings`, `choiceFreePlay` | 20 questions; the clock; 7 questions; 50; the clock; the Free Play start | 20, clock, none; 50 with no timer; clock with the timer; 10 | Free Play's lengths map onto the choice turn's own settings (ADR 0019). |
| 475 | offers the lengths, and the clock's time only against the clock | `ChoiceFreePlayView` | The Free Play start; tap Against the clock | 10 questions checked, no Time stepper; then Time at 30 seconds | The clock's length matters only when there's a clock. |

## Trivia Night machine

`src/games/trivia-night/machine.test.ts`, testing `src/games/trivia-night/machine.ts`: the SDK's choice turn on Trivia Night's questions (ADR 0017), with the real settings and Back to School pack. The choice turn's own tests are in the SDK.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 433 | has no mistakes validateMachine can find | Machine | The machine | No mistakes | Every phase, guard and action it names exists. |
| 434 | plays a full game on the Back to School pack, one question a turn, from the first handoff to the results | Whole game | Seed 2026; 6 turns, each answered right | Final; 3 points each | The shared turn works on the game's real content and defaults. |

## Trivia Night game

`src/games/trivia-night/game.test.ts`, testing `src/games/trivia-night/index.ts`: the game's single `defineGame` export.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 421 | is a valid game with the Back to School pack, its settings and one view for turn and result | `index.ts` | The game's default export | Id `trivia-night`; Back to School; its machine and settings; `TurnView` for `turn` and `reveal`; rules with "## Ways to play" | `defineGame` checked the parts when the file loaded; this checks Trivia Night wired its own parts in. |
| 464 | has Back to School Trivia, and Masculin ou féminin ?: ten words a minute, A to Z, Set questions only; both offer Free Play | Variants | The game's variants | `back-to-school` and `masculin-feminin`; the French one plays 10 questions, 60 s, A to Z, on its own pack, with mode closed; the choice Free Play, and both variants offering it | The variant the home page lists plays the way it's meant to (ADR 0018). |

## Pairs content

`src/games/pairs/schema.test.ts`, testing `src/games/pairs/schema.ts` and its packs (ADR 0020).

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 482 | needs a front and a back of at most 60 characters, filling in no tags, and rejects an unknown field | Item schema | le chat / cat; a blank front and a 61-character back; an extra field; the key | Tags filled in; problems at `front` and `back`; one problem; `le chat` | A pair is two short sides. |
| 483 | ships Français–anglais: two-way, every English meaning one word's, every noun with its article | The two-way pack | `francais-anglais` | At least 150 pairs; no English meaning twice; every front starts with le, la or l' | Match-up marks a tile right only if it's one word's partner; the article teaches the gender. |
| 484 | ships Les thèmes: one-way, every theme with at least 7 words, so odd-one-out always has a full group | The one-way pack | `les-themes` | At least 5 themes, each with 7 or more words | An odd-one-out round is 7 words of a group and 3 from others. |

## Pairs settings

`src/games/pairs/config.test.ts`, testing `src/games/pairs/config.ts` (ADR 0020).

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 485 | plays two-way flip cards, ten a 60-second turn, unless asked, and takes 1 to 50 cards and the three ways to play | Defaults, limits | The least settings; odd, one-way, 50; 0 and 51 cards, `snap`, `"yes"`; one player in Free Play | flip, two-way, 10, 60 s; kept; each refused; accepted | The three ways to play are one setting, and Free Play works as for any team-turns game. |

## Pairs machine

`src/games/pairs/machine.test.ts`, testing `src/games/pairs/machine.ts` (ADR 0020) with the real packs: Français–anglais for flip and match, Les thèmes for odd-one-out. Teams Lions and Eagles; the defaults unless a test says otherwise.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 489 | has no mistakes validateMachine can find | Machine | The machine | No mistakes | Every phase, guard and action it names exists. |
| 490 | flip: shows a card, flips it, and scores Knew it 1 and Not yet 0, then ends the turn after the cards | Flip | 2 cards; flip, knew; flip, not yet | A card whose sides are partners; `reveal`, revealed; a new card, `[1]`, not revealed; then `turn_summary`, `[1, 0]`, 1 point | Self-marking is the score. |
| 491 | flip: two-way shows either side first across cards; one-way always the front | `twoWay` | 20 seeds each way | Both sides first in two-way; always the French side in one-way | Two-way practises both directions. |
| 492 | match: three prompts, ten distinct tiles, their three partners among them, and no other tile any prompt's partner | Match deal | 5 seeds | 3 prompts, 10 different tiles, the 3 answers are the prompts' partners, no other tile is | A right pick is never marked wrong. |
| 493 | odd: a group, seven of its words and three from other groups to find | Odd deal | 3 seeds, Les thèmes | 1 group, 10 tiles, 3 answers; every tile is in the group unless it's an answer | The three to find are exactly the ones not in the group. |
| 494 | pick: tiles toggle, never more than three, Check only with three, and a point for each right one | `pick`, `check`, `continue` | 2 sets; toggle twice; three and a fourth; check with one; bad positions; two right and one wrong; continue; all right | Off again; the fourth ignored; no check; ignored; `[2]` and revealed; a new set with nothing picked; 5 points and the summary | Picking and scoring as ADR 0020 says. |
| 495 | ignores events for the other way of playing, and ends the turn when time runs out, from a card or a result | Guards, `time_up` | Pick and check on a flip card; knew before flipping; flip on a match set; time up in each | Nothing changes; then `turn_summary` both times | Views send what their way of playing allows; the clock still ends turns. |
| 496 | plays a whole game of Free Play flip cards: ten known cards, then the score | Free Play | One player, no timer, 1 round; 10 flips and Knew it; next | No end time; final; score 10 | Pairs works with Free Play (ADR 0019). |
| 497 | dealRound: the same seed deals the same round, and match draws its prompts from the pool so they don't repeat | `dealRound` | The same item, pool and seed twice | The same round; two more items drawn | A refresh deals the same; prompts come out of the pool like any item. |
| 498 | canPick and allPicked follow the round's tiles and how many are picked | Guards | Picks of 0, 3 and 3 including the tile; position 10; 2 and 3 picked | true, false, true, false; false, true | A test per guard (standard §12). |

## Pairs views

`src/games/pairs/views/views.test.tsx`, testing `TurnView.tsx` and `SettingsView.tsx` (with the Free Play view) in `src/games/pairs/views/` (ADR 0020). Screen tests (happy-dom) with real states from the machine, on a small one-way stand-in pack of twelve pairs.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 499 | flip: the card's front and Show the answer; once flipped, its back, Not yet and Knew it | Turn view, flip | The first card; tap Show the answer; the flipped state; tap Knew it | "Card 1 of 10", a timer; `flip` sent; the back shown; `knew` sent | The view follows the machine's `revealed`, so a refresh keeps the card as it was. |
| 500 | match: the tiles and their prompts, picks and Check sent; after Check, Next set, or End turn after the last | Turn view, match | One set a turn; tap a tile; the right three checked; tap End turn | "Find their partners", ten tiles; `pick` 0 sent; "3 of 3 right", no timer; `continue` sent | The last result isn't cut short by the clock. |
| 501 | counts cards and sets, and says what to find | `roundCount`, `pickLabel` | A fresh flip turn; a checked first set; match and odd | "Card 1 of 10"; "Set 1 of 10"; "Find their partners", "Find the 3 that don't belong" | Players know where they are and what to do. |
| 502 | picks the way to play, both ways, and cards a turn, and shows only open ones on a variant | Settings view | Tap Odd one out and Either side first; then only cards open | Both set, 10 cards a turn; then only the cards stepper | Each setting can be set; a variant shows its open ones (ADR 0018). |
| 503 | Free Play: 10, 20 or 50 cards, starting at 10 with no clock | Free Play view | The Free Play start; tap 50 cards | 10 cards, no timer; 10 checked; then 50 | Free Play's length (ADR 0019). |

## Pairs game

`src/games/pairs/game.test.ts`, testing `src/games/pairs/index.ts` and its variants (ADR 0020).

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 504 | is a valid game with both French packs, its settings and Free Play, and one view for card and answer | `index.ts` | The game's default export | Id `pairs`; Français–anglais and Les thèmes; its machine, settings and Free Play; one view for `turn` and `reveal`; rules with "## Odd one out" | `defineGame` checked the parts; this checks Pairs wired its own in. |
| 505 | has a variant for each way to play, each on the pack that suits it, and each with Free Play | Variants | Each variant's settings | French Flash Cards: flip, two-way, Français–anglais; French Match-Up: match, two-way, the same; L'intrus: odd, one-way, Les thèmes; all Free Play | Match-up needs a two-way pack and odd-one-out a one-way one (ADR 0020). |

## Library cards

`src/app/library/cards.test.tsx`, testing `src/app/registry/images.ts` and `src/app/library/GameCard.tsx` (ADR 0021): the pictures on the library's cards, and the card itself. Screen test (happy-dom) for the card.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 511 | finds each game's picture and its variants', by file name | `indexImages`, `cardImage` | Charades' `game.webp` and `naija-back-to-school.png`; Pairs' `french-match-up.webp` | No problems; Naija Charades its own; Charades' card the game's; French Match-Up its own; L'intrus none | A variant's own picture wins, then its game's; with neither the card draws one. |
| 512 | reports a picture named after nothing, outside a game, or a second one with the same name | `indexImages` | `naija.webp`; a picture in `chess`; `game.webp` and `game.png` | Three problems, the first listing Charades' variant ids | A typo in a file name would quietly show no picture. |
| 513 | has no picture in the games' folders named after nothing | The shipped pictures | Every file in `src/games/*/images/` | No problems | CI catches a misnamed picture. |
| 514 | shows its picture, or the game's icon on theme colors, and tells the setup where to go back to | `GameCard` | A card with a picture and its back link; one without | The `img`; the stand-in with Pairs' colors and its layers icon; after a tap, the back link arrives at the page opened | Every card looks finished before pictures exist; the setup's back link returns to where the player was. |

## Browse

`src/app/library/browse.test.tsx`, testing `src/app/library/BrowsePage.tsx` and `src/app/setup/backLink.ts` (ADR 0021): every variant at `/games`, filtered by category. Screen tests (happy-dom), starting the app at an address.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 515 | lists every variant at /games, with a filter of the categories they use | Browse | Start at `/games` | The heading; All and the seven categories, in the list's order, All pressed; the seven variants, the first linking to `/charades/naija-back-to-school` with "Charades · 2–20 players" | Every way to play in one place; only filters that show something. |
| 516 | filters by category, and a setup's back link returns to the same filter | Filter, back link | Tap Back to School; open Back to School Trivia; tap Games; tap All | Three variants; the setup's Games link to `/games?category=school`; Back to School still pressed with three; then all seven | The filter lives in the address, so coming back from a setup doesn't lose it. |
| 517 | shows every game for a category it doesn't offer | Filter | Start at `/games?category=chess` | All pressed; seven variants | An old or mistyped link still shows the games. |
| 518 | sends a setup opened by its address back to Browse for a variant, Custom game for a game, unless the card said where | `backLink` | No state for a variant; none for a game; other state; a link off the site; a card's link home | `/games` "Games"; `/custom` "Custom game"; the same; `/games`; `/` "Home" | Navigation state can be anything: only a link inside the app is followed. |

## Custom game

`src/app/library/custom.test.tsx`, testing `src/app/library/CustomPage.tsx` (ADR 0021). Screen test (happy-dom).

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 519 | lists every game at /custom, each opening its own setup, which leads back here | Custom game | Start at `/custom`; tap Charades; tap Custom game; tap Home | Charades, Name Ten, Trivia Night, Pairs, linking to their setups, with players; Charades' setup; Custom game again; home | The full setup of every game, away from the home page; each page leads back the way it came. |

## App

`src/app/App.test.tsx`, testing the pages in `src/app/` and which address shows which. Screen tests (happy-dom), each starting the app at an address with a `MemoryRouter`.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 465 | shows two featured variants at /, then Browse games and Custom game | Home page | Start at `/`; tap Back to School Trivia; tap Home; tap Browse games | Featured: Naija Charades (`/charades/naija-back-to-school`, "Charades · 2–20 players") and Back to School Trivia; links to `/games` and `/custom`; its setup; home; Browse | The home page stays short: two games to start with, and a page each to find more or set up your own (ADR 0021). |
| 520 | features two variants that exist | `featured` | `featuredIds` | Two, and both found in the registry | A renamed or removed variant would quietly drop off the home page. |
| 466 | opens a variant's setup: Masculin ou féminin ? asks for teams, rounds, turn length and words a turn, nothing else | Variant setup | Start at `/games`; tap Masculin ou féminin ? | Its heading; 10 questions a turn; 60 seconds; no mode or order choice; no packs; "282 items to play" | The variant's open settings are the only ones shown. |
| 180 | shows a game at its own address, from Custom game | Library, routing | Start at `/custom`; tap Charades | A link to `/charades` showing "2–20 players"; after the tap, Charades' setup screen | Each game's own setup is one tap from Custom game. |
| 372 | lists Name Ten too, with its own icon, players and setup | Library, registry | Open `/custom`; tap Name Ten | A link to `/name-ten` with its tagline and the list-checks icon; then Name Ten's setup, with "Answers on the board" and "38 items to play" | A game added to the registry appears in the library and gets the shared setup screen with its own settings. |
| 422 | lists Trivia Night too, with its own icon and setup | Library, registry | Open `/custom`; tap Trivia Night | A link to `/trivia-night` with the lightbulb icon; then its setup, with Against the clock, Questions per turn, a 30-second turn and "430 items to play" (every pack, the French one included) | The third game reaches the library and the shared setup, with its own default turn length. |
| 214, 215, 460 | says "Page not found" at /chess, /charades/nope and /charades/nope/extra, with a way back | Not-found page | A game that doesn't exist; a variant that doesn't exist; an address with too many parts | "Page not found"; Back to games returns to the library | A mistyped or old link never shows a blank page. Runs once per address (`it.each`). |
| 216 | has an icon for every game in the registry | `gameIcons` | Every registered game's `meta.icon` | Listed in `gameIcons` | An unlisted icon would quietly show the fallback controller. |
| 468 | starts each new page at the top, but leaves the first page and going back alone | `ScrollToTop` | Open `/` (window.scrollTo watched); tap Browse games | Not called on the first page; called with 0, 0 after the tap | A page opened from far down another starts at its top, not halfway down. |

## Applying a theme

`src/app/theme/themes.test.tsx`, testing `applyTheme` (`src/sdk/theme/apply.ts`) and `startingTheme` and `pickTheme` (`src/app/theme/themes.ts`), with the shipped Sunrise and Sunset themes. Screen tests (happy-dom); storage and the page's style are cleared before each.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 318 | writes the theme's variables, color scheme, name and address-bar color on the page | `applyTheme` | Apply Sunset, then Sunrise | Sunset's primary, radius 1rem, 200ms, scheme dark, `data-theme="sunset"`, its background as `theme-color`; then Sunrise's values and scheme light, still one `theme-color` tag | Every token reaches the page, and a new theme replaces the old one completely. |
| 319 | starts a first visit on Sunrise or Sunset by the phone's setting, and after that on the theme picked | `startingTheme` | Nothing saved, phone dark; phone light; Sunrise picked, phone dark; a saved theme that no longer exists, phone dark | Sunset; Sunrise; Sunrise; Sunset | The phone's setting is read once; after that the theme never changes on its own. A removed theme falls back instead of breaking. |
| 320 | opens on the phone's setting when storage is switched off | `startingTheme` | Storage that throws, phone dark | Sunset | Private browsing mustn't stop the app opening. |
| 321 | remembers the look, and index.html puts it back before the app starts | No flash | A chapter 08 style left in storage; pick Sunset; clear every attribute on the page; run the script in `index.html` | The saved look is the page's style and its attributes (theme, surface, button, background, decoration); the old key is gone; after the script, Sunset's primary, `data-theme` and `data-surface` are back | The first paint already has the right colors and parts, before the app's code has loaded. |

## Bundled fonts

`src/app/theme/fonts.test.ts`, testing the font list (`src/sdk/theme/fonts.ts`) against `src/app/theme/fonts.ts` and each font's own files in `node_modules/@fontsource-variable/` or `node_modules/@fontsource/` (ADR 0010).

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 322 | are each imported, so their files are served | Font imports | Every bundled font in the list | An `import '<package>'` line for each in `src/app/theme/fonts.ts` | A font on the list but not imported would silently fall back to a system font. |
| 323 | use the family name their CSS declares, and are under the license the font states | Font names, licenses | Each bundled font's `index.css` and `metadata.json` | Our `family` starts with the declared name (e.g. `"Caveat Variable"`); the font's license is `OFL-1.1` | A one-letter typo in a family name falls back silently too. Only fonts whose own license allows bundling can be on the list. |

## Theme picker

`src/app/theme/picker.test.tsx`, testing `src/app/theme/ThemePicker.tsx` in the library header. Screen tests (happy-dom), starting the app at `/`; storage and the page's style are cleared before each.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 329 | opens from the library header and lists every theme, with the one in use picked | Picker | Sunset picked; open the library; tap Theme | A "Theme" dialog listing every theme (Chalkboard, Space Travel, Sticky Notes, Sunrise, Sunset) with its description, in id order; Sunset picked | Players see every theme by name, and which one they're on. |
| 330 | applies a theme as soon as it's tapped, and remembers it | Picker | Sunrise in use; tap Theme, then Sunset, then Done; open the library again and tap Theme | The page is Sunset (dark) straight away; the dialog closes; Sunset still picked | The theme shows behind the dialog, so players see it before they decide, and it stays picked. |

## Theme parts

`src/app/theme/parts.test.ts`, testing `paintOnlyProblems` (`src/app/theme/paintOnly.ts`) and the theme parts CSS (`src/app/theme/parts.css`, read as text) against ADR 0011.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 333 | passes paint: colors, gradients, edges, shadows, tilt, and decorations that take no space | `paintOnlyProblems` | A card with a gradient, border color, shadow, tilt and `position: relative`; a sized, absolute decoration; a fixed background layer animated inside the reduced-motion query; keyframes moving background and opacity | No problems | Everything a part needs to look like paper or glass is allowed. |
| 334 | reports layout changes, decorations that could take space or taps, and motion that ignores reduced motion | `paintOnlyProblems` | A card setting padding, font size, border width and absolute position; a decoration that isn't absolute and takes taps; an animation outside the query; keyframes animating width | One message for each, in order | Each rule of ADR 0011 is checked, so the check on `parts.css` means something. |
| 335 | only paints | `parts.css` | The file | No problems | A theme can't move, resize or crowd anything, or animate for players who asked their phone not to. |
| 336 | has CSS for every option a theme can pick, except each part's plain default | `parts.css`, `themeParts` | Every option of surface, button, background and decoration | A selector like `[data-surface='paper']` for each | An option in the schema without CSS would let a theme pick a look that does nothing. |

## Theme tokens

`src/app/theme.test.ts`, testing how `src/app/index.css` maps the theme tokens to Tailwind, and the themes that ship (`src/themes/`). Reads the CSS file and every `.ts`/`.tsx` file in `src/` as text.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 181 | declares no values of its own, and makes every color token available to Tailwind classes | `@theme`, no values | `index.css`; each color token in the theme schema | No oklch or hex color and no dark-mode query; a `--color-<name>: var(--<name>);` line for every token | Values come only from theme files (ADR 0010); a token Tailwind doesn't know can't be used as a class. |
| 182 | ships themes that pass the contrast check, and first-visit themes that are light and dark | Shipped themes | Every file in `src/themes/`; the first-visit ids | No contrast problems; Sunrise is light, Sunset is dark | The app's own themes meet the same bar as contributed ones, and a first visit can follow the phone's setting. |
| 327 | maps the theme's fonts, shadows and outline width to classes, and puts headings in the heading font | `@theme`, utilities | `index.css` | `shadow-sm`/`shadow-lg` read `--elevation-sm`/`-lg`; `border-line` reads `--line`; `font-heading` reads `--font-heading`; h1–h5 use it; the body has `--page-gradient` | Each new token reaches the classes components already use, so components didn't need to learn about themes. |
| 183 | is the only source of colors: no file uses a built-in Tailwind color | No raw colors | Every source file | No class like `bg-red-500` or `text-white` | Tailwind's palette is switched off, so such a class would silently do nothing; and themes (phase 2) can only change colors that come from tokens. |
| 328 | leaves outline widths to the theme: no file uses a fixed width like border-2 | No fixed widths | Every `.tsx` component in `src/` (not tests) | No `border-2`, `border-t-4` or the like | A fixed width would ignore a thick-outline theme. `border-line` is the one to use. |
| 341 | lets the page pattern show everywhere: no component paints a solid strip of page color | No solid page-color strips | Every `.tsx` component in `src/` (not tests) | No `bg-background` without an opacity (`bg-background/75` behind the item count and `backdrop:bg-background/80` are fine) | A solid strip of page color hides lined paper, stars or chalk dust and shows as a box. Found in the look check of chapter 09. |

## UI components

`src/ui/ui.test.tsx`, testing `src/ui/cn.ts`, `button.tsx`, `input.tsx` and `dialog.tsx`. Screen tests (happy-dom); taps and typing go through `user-event`, which acts like a player.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 184 | drops empty values and lets a later class win over an earlier one that sets the same thing | `cn` | `'bg-primary px-4'`, `false`, `undefined`, `'bg-secondary'` | `'px-4 bg-secondary'` | A caller's `className` can adjust a component without both colors fighting. |
| 331 | knows our own utilities: keeps the theme's outline width next to a border color, on outline buttons and text fields | `cn`, Button, Input | `border-line border-border`; `border-2` then `border-line`; `font-sans` then `font-heading font-bold`; an outline Button and an Input | Both border classes kept; `border-line` wins; `font-heading font-bold`; the button has `border-line` and `shadow-sm`, the field `border-line` | tailwind-merge didn't know `border-line`, took it for a color and dropped it, so outline buttons and fields lost their borders in chapter 08. |
| 185 | is a button that does not submit forms unless asked to | Button | `<Button>Start</Button>` | A button named Start with `type="button"` | A plain `<button>` inside a form submits it; the setup screen has a form. |
| 186 | calls onClick when tapped, and not when disabled | Button | Tap; then tap while disabled | Called once in total | Start must do nothing while setup is invalid. |
| 338 | marks its variant, so theme parts can style filled and outline buttons differently | Button | A default button and an outline one | `data-variant` primary and outline | A sticker or glass look belongs on filled buttons, not on ghost ones (ADR 0011). |
| 187 | uses theme colors for its variant, and lets the caller adjust it | Button | `variant="success"`, `className="w-full"` | Classes include `bg-success` and `w-full` | Variants come from tokens; screens can still size buttons. |
| 188 | is a text field that can be found by its label and typed into | Input | Labelled "Team 1", type `Lions` | Found by its label; value `Lions` | Team names are typed here; a field without a usable label is invisible to screen readers. |
| 242 | opens as a modal with its title and buttons, and asks to close on a tap outside it | Dialog | Closed; then open, titled "Quit this game?"; tap its button; tap outside | No dialog; then a dialog by that name, with a description marked `data-feature` for decorations, and unable to scroll sideways; `onClose` not called for the button, called once for the outside tap | The browser's `<dialog>` is opened by a method, not an attribute: the component must turn the `open` prop into calls. A tap outside is a natural "never mind". |

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
| 363 | says "Pass the phone to" above the name, unless given another line | Handoff `lead` | No lead; then "Hand the phone to a judge from" | The default line; then the given line, and not the default | Name Ten passes the phone to a judge, not to the team playing (ADR 0012). |
| 196 | shows the item and reports Got it and Skip | FlashCard | Puff puff, hint "Describe it"; tap Got it once, Skip twice | Text and hint shown, on a card marked `data-feature`; onGot once, onSkip twice | Each tap reports exactly one event. The card is where a theme's decorations go (ADR 0011). |
| 213 | shrinks the whole text when its longest word is long | FlashCard, `textSize` | Longest word 9, 14 and 20 letters; a card with a 17-letter word | `text-5xl`, `text-3xl`, `text-2xl`; the card drawn at `text-2xl` | A word can't wrap: too big, it would be broken mid-word on a small phone. The whole text shrinks, so one item never mixes sizes. |
| 197 | shows whole seconds left, rounded up, and counts down | Countdown | Ends at 60 s; after 1 s; after 59.5 s | 60, 59, 1 | Rounded up, it shows 0 only when time is really up. |
| 198 | calls onTimeUp once, when time runs out | Countdown | Ends at 3 s; check at 2.9 s, then at 7.9 s | Not called, then called once; shows 0 | `time_up` must be sent once, not on every tick after the end. |
| 199 | calls onTimeUp straight away if the time has already passed | Countdown | Ends at 5 s, shown at 10 s | Called once immediately | A turn whose time ran out while the phone was locked (or, from chapter 05, before a refresh) ends at once. |
| 200 | turns to the warning color from warnAt seconds left | Countdown | Ends at 15 s, warn at 10; after 5 s | No warning class, then `text-warning` | Players see time running out without reading the number. |
| 201 | vibrates when time runs out, on phones that can | Countdown | A phone with `vibrate`; ends at 1 s | `vibrate` called once | The team acting may not be looking at the screen. |
| 469 | shows a toned hint as a badge in that color with its icon, and outlines the card in it; a plain hint stays plain | `FlashCard` `tone`, `icon` | Gala, "Sing or hum it", primary, music icon; then "Category" with no tone | A badge in primary with the music icon, the card outlined in primary; then muted text and no outline | Cards that are played differently look different; Name Ten's category card doesn't change. |

## Summary and Leaderboard

`src/sdk/interactions/summary.test.tsx`, testing `Summary.tsx` and `Leaderboard.tsx` in `src/sdk/interactions/`. Screen tests (happy-dom), except `rank`, which is a plain function.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 202 | shows who played, what they scored, and each list of items | Summary | Lions, 2 points, Got it: Gala, Zobo; Skipped: Assembly; tap Next | Heading Lions, "scored 2 points", both lists with their items, onNext once | Players see what happened in the turn before moving on. |
| 376 | lists every team's score so far, a dot per round filled for each played, and marks the team that just played | `Summary` standings | Lions 13, 1 of 3 played, current; Eagles 0, 0 of 3 | Rows "Lions 13" and "Eagles 0"; dots labelled "1 of 3 rounds played" and "0 of 3", one filled for Lions; Lions marked current | Every turn ends with the state of the game (ADR 0013). |
| 203 | says "1 point", and leaves out empty lists | Summary | Eagles, 1 point, an empty Skipped list | "scored 1 point"; no list shown | Small things players notice: grammar, and empty headings. |
| 204 | orders by score, gives tied scores the same place and skips the next, keeping tied entries in order | `rank` | A 7, B 10, C 10, D 3 | 1 B, 1 C, 3 A, 4 D; the original list unchanged | Two teams with the same score both came first; the next team is third, not second. |
| 205 | lists every team with its place and score, highest first, highlighting first place | Leaderboard | Lions 4, Eagles 9 | Eagles first (highlighted), then Lions | The results screen at a glance. |

## PromptCard

`src/sdk/interactions/promptcard.test.tsx`, testing `src/sdk/interactions/PromptCard.tsx` (ADR 0012). Screen tests (happy-dom). "Things Found in a School Bag" with Biro, Ruler and Eraser, Ruler ticked; a bit of state stands in for the machine.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 364 | shows the prompt with its label and a running count, and every answer with whether it's ticked | Board | The board | "Category"; the prompt as a heading on a `data-feature` card; "1 of 3"; Ruler pressed, the others not | The judge sees what to read out, how the team is doing, and what's been said. |
| 365 | reports which answer was tapped, and the count follows | Taps | Tap Biro, Eraser, then Ruler; then a card labelled "Question" with one answer, tapped | "3 of 3", then "2 of 3", Ruler unpressed; then "Question" shown and `onToggle(0)` | A tap is reported by position; the count always matches the ticks. |
| 374 | lays the board out as two columns of tiles that share the height, never under 44px, scrolling only then | Layout | The board | A two-column grid, rows `minmax(2.75rem, 1fr)`, scrolling when full | Ten answers fit on a phone without scrolling, and no tile is too small to tap (ADR 0013). Class names, because happy-dom doesn't lay pages out. |

## MultipleChoice

`src/sdk/interactions/multiplechoice.test.tsx`, testing `src/sdk/interactions/MultipleChoice.tsx` (ADR 0015). Screen tests (happy-dom), except `resultText`, a plain function. The machine's part is played by a bit of state: the first tap is the pick.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 392 | shows the question with its label on the card, and every option in order, none marked | `MultipleChoice` | "What is the capital of Nigeria?", Lagos, Abuja, Kano, Ibadan | The label Question; the question on the theme's card; four outlined options in order | Nothing gives the answer away before a tap. |
| 393 | reports the tap, then shows the answer in green and a wrong pick in red, and ignores later taps | Picking | Tap Lagos; then Abuja | `onPick(0)`; "Not quite: it's Abuja."; Abuja green with "The answer", Lagos red with "Your pick", Kano plain; the second tap not reported | A team sees at once what the answer was, and can't change its pick. |
| 394 | says Right! when the pick is the answer, and takes 2 or 5 options | `resultText`; two options | Answer 1 picked 1, and picked 3; Masculin or Féminin with Féminin picked | "Right!", "Not quite: it's Abuja."; the label Gender, Right!, two options | The same card serves a this-or-that game. |
| 428 | shows a subtitle in smaller text right under the question, and nothing without one | `subtitle` | chaise with subtitle chair; then without | "chair" right after the heading, in the muted color; then no text there | A hint or a translation sits with the question it belongs to. |
| 395 | shares the height about 65 : 35, with options at least 44px and the question giving way | Layout | The card, four options | The question `flex-[13_1_0%] min-h-0`; the options `flex-[7_0_0%]`, two columns, rows `minmax(2.75rem,1fr)`; no tile spanning a row | Pins the layout ADR 0015 chose: 2x2 for four (happy-dom doesn't lay pages out). |
| 424 | lays out 2 as 2x1, and gives the last of an odd number the whole row | `spansRow`, layout | 2, 3 and 5 options; the card with A, B, C | Only the last of 3 and of 5 spans; C's tile has `col-span-2` | An odd number of tiles leaves no empty cell. |

## A pause after time runs out

`src/sdk/interactions/settle.test.tsx`, testing `useSettled.ts`, and its use in `Summary.tsx` and `Review.tsx`, in `src/sdk/interactions/` (ADR 0016). The delay is 0 in every other test (`src/testSetup.ts`); here it's 2000 ms, with a fake clock.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 425 | is false for the delay after the component first shows, then true; with no delay, true at once | `useSettled` | Shown; after 1999 ms; after 2000 ms; with 0 | false, false, true; true | The pause ends exactly when set, and a delay of 0 means none. |
| 426 | keeps the turn summary's Next off for 2 seconds | `Summary` | Shown; after 2 s | Next off; then on | A tap aimed at the last second of a turn doesn't skip the score. |
| 427 | keeps review's Adjust and Done off for 2 seconds | `Review` | One row; shown; after 2 s | Adjust and Done off; then on | A late tap doesn't count a turn before it's checked. |

## FlipCard

`src/sdk/interactions/flipcard.test.tsx`, testing `src/sdk/interactions/FlipCard.tsx` (ADR 0020). A screen test (happy-dom); the machine's part (whether it's flipped) is a bit of state.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 486 | shows the front and Show the answer; after the flip, the back, Not yet and Knew it | `FlipCard` | le chat / cat; tap Show the answer, Not yet, Knew it | The label and le chat on the theme's card, no cat, no marking buttons; then cat, no Show the answer; each marking reported once | The answer stays hidden until players have had a go. |

## PickCard

`src/sdk/interactions/pickcard.test.tsx`, testing `src/sdk/interactions/PickCard.tsx` (ADR 0020). Screen tests (happy-dom), with the machine's part played by state; three prompts, five tiles (cat, dog, house, tree, car), the answers cat, dog and house. `pickResult` is a plain function.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 487 | shows the prompts and tiles, picks up to the number needed, and checks only when enough are picked | Picking | Tap cat twice; then cat, dog, tree, and car | The three prompts; Check off; cat off again; car not picked; "3 of 3 picked"; Check on | Players pick exactly the number asked. |
| 488 | after Check: right picks green, wrong red, missed ones outlined, the rest faded, and the count right | The result | Pick cat, dog, tree; Check | "2 of 3 right"; cat and dog green, tree red, house outlined in green and marked Missed, car faded; no Check; `pickResult` 1 of 3 | Players see what they got, what they got wrong, and what they missed. |

## Review

`src/sdk/interactions/review.test.tsx`, testing `src/sdk/interactions/Review.tsx`: the turn card by card, before its points count (ADR 0007). Screen tests (happy-dom) with three cards: Gala (acted, got), Zobo (skipped, changed), Assembly (not counted).

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 269 | lists every card with its result, locked: tapping a card does nothing | Locked list | Show the three cards; tap Gala | Heading Lions; each card with its detail, result and "changed" mark; no buttons on the cards; `onToggle` not called; the hint says "Check the cards before they count." (cards unless a game names its rows) | Review is on screen while the phone goes round; a stray tap there must not change a score. |
| 270 | Adjust unlocks the cards, a tap reports which one, and Lock locks them again | Adjust | Adjust; tap the third card; Lock | The hint changes; `onToggle(2)`; after Lock, no buttons and no more calls | Changing a result is a deliberate two-step act, and the game decides what a tap means. |
| 271 | Done finishes the review, locked or not, and an empty turn has nothing to adjust | Done | Done label "Count it": tap it locked and unlocked; then no cards | `onDone` twice; then "Nothing was played this turn." and no Adjust | Done never needs Adjust first; nothing to adjust means no Adjust button. |

## Markdown

`src/sdk/interactions/markdown.test.ts`, testing `parseMarkdown` in `src/sdk/interactions/markdown.ts`: the small part of markdown rules are written in (ADR 0009). Blocks are compared as data: a heading, paragraph or list, made of plain and bold runs of text.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 293 | reads headings, paragraphs, both kinds of list and bold | `parseMarkdown` | A `#` heading; two lines of text with `**clock**`; a `##` heading; a numbered list with bold; a bulleted list | Five blocks: the paragraph's lines joined with a space, bold as its own run; no problems | Everything rules may use, read the way GitHub shows it. |
| 294 | carries a list item on to the next line, starts a new list when the kind changes, and ends a paragraph at a heading | `parseMarkdown` | A bullet then a plain line; a numbered item then a plain line; a `###` heading with no blank line; Windows line ends | Two lists of one item each, with the lines joined; the heading; a paragraph | Long items wrap onto the next line in an editor; writers shouldn't need blank lines everywhere. |
| 295 | reports every line that starts something unsupported, with its line number | Problems | A table, quote, code fence, `*` item, `####`, `#Title`, an indented line, a divider, `<div>` | One message per line, each with its number and what to do instead | Anything unsupported would show as raw symbols; CI says where and how to fix it. |
| 296 | reports unsupported text inside a line on that line, and an unclosed ** where its block starts | Problems | A paragraph whose lines hold a link, an image, code, `*aside*`, `_aside_`, a tag; then an item with an unclosed `**` | Each on its own line (an image is also a link); the `**` on the item's line | The line number points at the mistake, not at the start of the paragraph. |
| 297 | leaves ordinary text alone | No false alarms | `5 < 10`, `snake_case`, an apostrophe, bold, a dash; empty text | No problems; no blocks | Rules are ordinary writing: the checks only catch markdown we don't show. |

## Instruction

`src/sdk/interactions/instruction.test.tsx`, testing `src/sdk/interactions/Instruction.tsx`: the `Instruction` primitive and the `Markdown` it shows. Screen tests (happy-dom).

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 298 | shows the title and the text as headings, paragraphs, lists and bold, and the button carries on | `Instruction` | Title "How to play"; a `##` heading, bold, a numbered list; tap Got it | Title as a level-2 heading, the `##` as level 4; bold in `<strong>`; a numbered list (`<ol>`) of two items; `onAction` called once | Each block becomes its own element, one heading level below the title, so screen readers can move through the rules. |
| 342 | keeps its button at the bottom with nothing painted around it, so the page shows through | Bottom bar | An Instruction | The button's bar is sticky, with no background or blur | The space around the button is spacing, not a box: over a theme's pattern, a painted bar looks like a bug. |
| 299 | never turns text into HTML | Safety | Text with `<b>` and an `<img onerror>` | No `<b>` or `<img>` on the page; the text shown as written | Rules come from files anyone can propose a change to. Nothing in them can become HTML on the page (ADR 0009). |

## Team-turns views

`src/sdk/formats/team-turns/views/views.test.tsx`, testing the format's default views in `src/sdk/formats/team-turns/views/`. Screen tests (happy-dom). A made-up game whose turn record is a count of words guessed; Lions and Eagles, 2 rounds, Eagles playing, 3 words got.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 209 | handoff: names the team and the round, and Start sends start | `HandoffView` | Round 1 of 2; tap Start | Heading Eagles, "Round 1 of 2"; sends `start` | The view connects the Handoff primitive to the machine. |
| 473 | handoff and turn summary go on by themselves and show nothing; the results show the score | Free Play | One player "You", score 7, `solo` | The hand-off sends `start` and shows nothing; the summary sends `next` and shows nothing; the results say "Your score" 7, no winner | With one player there's no one to pass the phone to and no one to beat (ADR 0019). |
| 210 | turn summary: shows the turn's points, and Next, or See results after the last turn | `TurnSummaryView` | Round 1; then round 2 (the last turn) | "scored 3 points" and Next (sends `next`); then See results | The button says where `next` will go, using the format's own `turnsRemaining`. |
| 377 | turn summary: every team's score so far, this turn included, and the rounds each has played | `standingsOf` | Lions, Eagles, Hawks: round 2, Eagles just scored 4 on 5; then the first turn, 3 points | Lions 6 (2 played), Eagles 9 (2, current), Hawks 2 (1); then 3/1, 0/0, 0/0 | Teams play in order, so the round counts for the team that just played and everyone before it; this turn's points show before the format banks them (ADR 0013). |
| 211 | results: names the winner, or says it's a tie | `ResultsView` | Scores 5 and 8; then 6 and 6 | "Eagles won!"; then "It's a tie!" | A draw needs its own headline. |

## Playing Name Ten

`src/app/play/nameTen.test.tsx`, the whole app at `/name-ten` with nothing saved, the way a player taps through it (ADR 0012). Fake clock and intervals, as in the game screen tests.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 373 | goes from setup to a judge, a board, review and the summary, by tapping | Name Ten, end to end | Start; Start; Skip; Play this; tick two answers; End turn early; Adjust; tick a third; Done | "Hand the phone to a judge from" Team 2, "Team 1 are up · Round 1 of 3"; after Skip "2 skips left" and a different category; ten answers, "2 of 10"; review in answers' words; the summary says 3, with scores so far Team 1: 3, Team 2: 0 | Every Name Ten screen in order, through the shared setup, save and play pages. |

## Playing Pairs

`src/app/play/pairs.test.tsx`, the whole app at `/pairs/l-intrus` with nothing saved (ADR 0020). The test knows each word's theme from the Les thèmes pack, through the registry.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 506 | plays L'intrus alone: ten sets, picking the three that don't belong each time, then the score | Pairs, Free Play, end to end | Free Play; Start; in each set, tap the tiles not in the group, Check, go on | "Set 1 of 10" to "10 of 10", "3 of 3 right" every time; then "Your score" 30 | Odd-one-out from setup to the score, through the real app. |

## Playing Trivia Night

`src/app/play/triviaNight.test.tsx`, the whole app at `/trivia-night` with nothing saved, the way a player taps through it (ADR 0015). Fake clock and intervals, as in the game screen tests.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 423 | goes from setup to a question, its result and the summary, by tapping | Trivia Night, end to end | 2 questions a turn; Start; Start; tap the first option, Next question; tap the first option, End turn | Team 1's handoff; "Question 1 of 2", a result line, then "Question 2 of 2" and a result; the summary with both teams' scores | Every Trivia Night screen in order, through the shared setup, save and play pages. |
| 481 | plays Masculin ou féminin ? alone, in Free Play: no hand-off, no clock, ten words, then the score | Free Play, end to end | Open `/trivia-night/masculin-feminin`; Free Play; Start; tap the first option and go on, ten times | No hand-off; "Question 1 of 10" to "10 of 10", no timer, Féminin then Masculin each time; then "Your score", no winner | Free Play from the setup tab to the score, through the real app (ADR 0019). |

## Game screen

`src/app/play/GameScreen.test.tsx`, testing `src/app/play/GameScreen.tsx` with the real Charades game from the registry: Lions and Eagles, 1 round, 30-second turns, Back to School, seed 2026. Fakes the clock and `setInterval` (not `setTimeout`, which Testing Library needs) so turns pass instantly. Drawn inside a `MemoryRouter`, because the screen has a link.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 375 | is exactly the screen's height, with a play area that scrolls on its own, so a view can fill the screen | Layout | The game screen | `main` is `h-dvh`; the play area scrolls (`overflow-y-auto`) | Name Ten's board fills what's left under the quit bar; a taller view scrolls without moving the quit bar (ADR 0013). |
| 212 | plays a whole game of Charades by tapping, from the first handoff to the results | Every view, end to end | Lions: Start, Got it ×2, Skip, 30 s pass; in review Adjust, tap the last card, Done; Next. Eagles: Start, Got it, 30 s pass, Done, See results | Timer starts at 30; review shows 4 cards, the last not counted, then "Got it" and changed; Lions' summary: 5 points (2 + 2 − 1 + 2); Eagles' summary: 2 points; "Lions won!", standings Lions 5, Eagles 2 | Proves the whole chain: buttons send the right events, the machine moves, and each phase's view appears. A view sending the wrong event fails here. |
| 224 | after the game, Play again starts over with the same teams, and Back to games leads to the library | Results actions | Two turns with nothing guessed, then tap Play again | No Play again during the game; "It's a tie!", no Quit, Back to games links to `/`; then Lions' handoff, "Round 1 of 1", no Play again | The app's own buttons appear only once the game has ended, and Play again really restarts. |

## Setup screen

`src/app/setup/setup.test.tsx`, testing the setup screen in `src/app/setup/`, the rules page (`src/app/rules/RulesPage.tsx`) and the play page's check for settings. Screen tests (happy-dom), each starting the app at an address with a `MemoryRouter`, with nothing saved on the device. Charades' one pack, Back to School, has 34 items.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 217 | starts with two teams and the default settings, and Start begins the game and remembers the teams | Setup, Start | Open `/charades`; rename Team 1 to Lions; tap Start | Team 1, Team 2; 3 rounds; 60 seconds; Back to School ticked; "34 items to play"; then "Pass the phone to" Lions; saved teams Lions, Team 2; a saved game with those teams | One tap from the library to a game with sensible defaults, and the next game starts with the same names. Start saves the game before the play page opens (ADR 0006). |
| 218 | fills in the teams saved on this device, and ignores a save it can't read | `loadTeams` | Saved Lions, Eagles, Hawks; then broken JSON; then one team | Three fields with those names; then nothing loaded, twice | Saved data can be old or edited by hand: a bad save means the defaults, never a crash. |
| 219 | adds and removes teams, from 2 up to 10 | Teams | Add a team; remove Team 1; add until 10 | Team 3 appears; Team 2 and Team 3 remain; no Remove at 2 teams, no Add team at 10 | The screen can't make a team count the schema rejects. |
| 220 | shows what's wrong with a team name next to it, and Start is off until it's fixed | Teams, errors | Empty Team 1; then "team 2"; then "team 2s" | "Give every team a name", field marked invalid, Start off; "Two teams have this name", Start off; Start on | The schema's own messages, shown where the problem is. |
| 221 | changes rounds and turn length with − and +, within their limits | `Stepper` | Turn length −; rounds − twice | 45 seconds; 1 round, its − button off | Values stay in range without typing. |
| 222 | counts the items a tag leaves, and needs at least one pack | Packs, tags | Pick snack; add song; untick Back to School | "5 items to play"; "7 items to play"; "Pick at least one pack", no tags offered, Start off | Players see what a filter leaves before they start. |
| 343 | keeps Start at the bottom with nothing painted around it, and a backdrop only behind the item count | Bottom bar | Open `/charades` | Start's bar has no background or blur; "34 items to play" has its own `bg-background/75` | Only the words need covering to stay readable over cards scrolling under them. |
| 301 | How to play opens the game's rules, and Back to setup returns to setup | Rules page | Tap How to play; tap Back to setup | "How to play Charades" with the rules' "A turn" heading; then Charades' setup | Players can read the rules before they start, and get back with one tap. |
| 302 | opens the rules from a link too, where Back to setup goes to setup; a game that doesn't exist has no rules | Rules page | Open `/charades/rules` and tap Back to setup; open `/anime/rules` | Setup with its Start button; "Page not found" | A shared rules link has no setup to go back to, so the button goes to setup instead of leaving the site. |
| 223 | sends the play page back to setup when there is no saved game, like a shared /charades/play link | Play page | Open `/charades/play` with nothing saved | Charades' setup screen | The play page only plays a save (ADR 0006): without one there's nothing to play. |
| 250 | remembers setup choices as they are made, so leaving setup loses nothing | Setup draft | Rename Team 1 to Lions, rounds +, turn length +, pick snack; leave; open setup again | Lions, 4 rounds, 75 seconds, snack picked, "5 items to play" | A back swipe or refresh mid-setup keeps everything, not only after Start (ADR 0006). |
| 251 | drops remembered packs that no longer exist, and ignores choices that are no longer allowed | `loadSetup` | Saved packs: one existing, one removed; then only a removed pack; then 99 rounds; then broken JSON | The existing pack kept, with every other setting as saved; then nothing loaded, three times | A pack can be deleted while a phone remembers it: picking it would crash the item pool. |
| 282 | shows the game's own settings, keeps them in the draft, and Start plays them | Settings view on setup | Pick Mix it up; in Advanced settings, skip −; Done; leave and come back; Start | Mix it up still picked, "Describe 2 · Act 3 · Sing 3 · Skip 0"; the saved game plays mode `mix` with skip 0 | The game's settings go through the same draft and the same Start as the format's (ADR 0008). |
| 281 | keeps the game's own settings in the draft, and gives a setting added since the save its default | `loadSetup`, `saveSetup` | Mix it up with points 1/4/5/0; then a draft saved before Charades had modes; then one with a setting Charades doesn't have | The same back; then 5 rounds with mode `describe` and points 2/3/3/1; then nothing loaded | The draft holds every setting, the game's own too (ADR 0008). A game can add settings without breaking drafts on players' phones; the schema's defaults fill the gap. |

## Variant setup

`src/app/setup/variantSetup.test.tsx`, testing `SetupScreen.tsx` with a variant, and `loadVariantSetup` and the Free Play saves in `savedSetup.ts` (ADR 0018, 0019). Screen tests (happy-dom). The variant is made up: Snack Attack, Charades with 90-second turns and Mix it up, snacks only, rounds and mode open.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 462 | shows the variant's name, the teams and only its open settings, and starts with its settings and content | Variant setup | Open the screen; tap More: Rounds; Start | Heading Snack Attack and its tagline; teams, Rounds, Mix it up checked; no Turn length, Packs, Only play or Advanced; Start sends 4 rounds, 90 s, mix, Back to School, snack | Players change only what the variant allows, and get its content. |
| 463 | remembers what players changed, per variant, and only for open settings | `saveSetup`, `loadVariantSetup` | Tap Describe; then a saved setup with 5 rounds, 15 s, another pack | Saved under `charades/snack-attack`, not `charades`; loads describe, 5 rounds, but 90 s and the variant's pack and tag | A remembered change to a closed setting or the content never leaks in. |
| 478 | offers Competitive and Free Play; Free Play asks only for its length and starts one player, one round, no clock | Free Play tab | Trivia given the choice Free Play, a variant offering it; tap Free Play; Start | Competitive selected, with teams; then no teams or rounds, 10 questions checked; Start sends solo, You, 1 round, 10 questions, no timer, the variant's pack | Playing alone asks only what matters alone (ADR 0019). |
| 479 | remembers the tab and Free Play's own choices, apart from Competitive's | Free Play tab | Free Play, 20 questions; open the screen again | Free Play still selected, 20 checked; Competitive's saved setup not 20 | Each tab keeps its own settings. |
| 480 | shows no tabs on a variant that doesn't offer Free Play | Free Play tab | The same variant with `freePlay: false` | No tab list | Only variants that say so offer Free Play. |

## Saved game

`src/app/play/savedGame.test.ts`, testing `src/app/play/savedGame.ts` (ADR 0006). Uses the fake browser's `localStorage`, emptied before each test. A new game of Charades: Lions and Eagles, 1 round, 30-second turns, Back to School, seed 2026. Some saves are written by hand, to test saves the app didn't write, or wrote long ago.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 228 | saves a game and loads it back exactly | `saveGame`, `loadGame` | The game after `start`, saved at 6000 | The same state, saved at 6000 | Resuming must continue the very same game. |
| 461 | keeps the variant a game was started from, and still loads one whose variant is gone, under the game's name | `variantId`, `saveName` | Saved with variant `no-such-variant`; a summary with a variant named Snack Attack | `variantId` in the save; it loads; named Charades; then Snack Attack | Continue names the variant (ADR 0018); a variant removed later doesn't throw away a game in progress. |
| 229 | finds nothing when nothing is saved, or after clearGame | `clearGame` | Nothing; then a save, cleared | Nothing, twice | Quit (step 5) deletes the save. |
| 230–236 | throws away a save with … , and says why | Checks on load | Not JSON · the wrong shape · an older version · a game that was removed · a phase that was renamed · the phase "toString" · 99 rounds | Discarded with the matching reason; the save is deleted | Every way a save can go stale, from ADR 0006. Never a crash, always a reason for the notice. "toString" exists on every object: a plain `in` check would let it through. Runs once per case (`it.each`). |
| 237 | reports a save for a different game without deleting it | `loadGame` | A Charades save, loaded for another game id | "other game", Charades; the save kept | Opening another game's play page mustn't destroy the Charades save. |
| 238 | summarizes the save for the library, and says when the game is finished | `summarizeSave` | A new game; then one played to the results | Teams, round 1 of 1, not finished; then finished | The library's Continue card (step 6) needs this, and hides finished games. |
| 239 | keeps playing when storage is switched off | Storage errors | A storage whose every call throws | Save, load and clear don't throw; nothing loaded | Some private-browsing modes switch storage off; the game must still play. |

## Play page

`src/app/play/PlayPage.test.tsx`, testing `src/app/play/PlayPage.tsx` the way a refresh reaches it: a game is saved, then the app opens at `/charades/play`. Screen tests (happy-dom) with a fake clock (`Date` and `setInterval` only). The saved game: Charades, Lions and Eagles, 1 round, 30-second turns, seed 2026; Lions' turn started at 0 ms (it ends at 30 000) and they got one item.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 240 | carries on a saved turn after a refresh, with the clock still running, and saves every move | Resume, saving | Open at 10 000 ms; tap Got it | Lions' turn, timer at 20; the save now has 2 cards logged | A refresh loses nothing but the seconds it took, and every move is saved. |
| 241 | ends the turn at once if its time ran out during the refresh | Resume after time ran out | Open at 45 000 ms | Lions' review; the save is at `review` | The turn ended while the page was gone; the game catches up instead of showing a timer below zero. |
| 243 | asks before quitting: Keep playing carries on, Quit game deletes the save and goes to the library | Quit | A new saved game; Quit, Keep playing; Quit, Quit game | The dialog; then the handoff again; then the library, and nothing saved | One stray tap mustn't end a game, and a deliberate quit mustn't leave a save behind. |

## Continuing a saved game

`src/app/library/continue.test.tsx`, testing the library's Continue card and notice (`src/app/library/LibraryPage.tsx`), the setup screen's "Replace your saved game?" (`src/app/setup/SetupPage.tsx`) and `describeSave`. Screen tests (happy-dom), starting the app at an address with a `MemoryRouter`; `localStorage` emptied before each. The saved game: Charades, Lions and Eagles, 2 rounds, seed 2026, played with nothing guessed: after 2 turns it's round 2, after 4 it's finished.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 244 | describes a save by its teams and round, or as Free Play for one player | `describeSave` | 2 teams, round 2 of 3; 3 teams, round 1 of 1; one player | "Lions vs Eagles · Round 2 of 3"; "Lions, Eagles and Hawks · Round 1 of 1"; "Free Play" | Players recognise their game by who's playing and how far along it is. |
| 245 | offers the unfinished game first in the library, and Continue carries on with it | Continue card | A save in round 2; open `/`; tap Continue | A "Continue Charades" link with the teams and round; then the handoff, "Round 2 of 2" | After a back swipe or a closed tab, getting back is one tap. |
| 467 | names the variant a game was started from, and keeps it as the game is played | Continue, variants | Start Naija Charades from its setup; Start the turn; open `/` again | The save remembers `naija-back-to-school` after the play page saves; "Continue Naija Charades (Back to School Edition)" | Players see the name they picked, and the play page's saves don't drop it. |
| 246 | offers nothing to continue for a finished game | Continue card | A save at the results | No Continue link | There's nothing left to play in a finished game (ADR 0006). |
| 247 | says when a save couldn't be restored, found by the library or by the play page | Discarded notice | An old-version save, opening `/`; then a save with an unknown phase, opening `/charades/play` | The notice with "older version of the app"; then the library with the notice naming the phase | A lost game is explained wherever it's found, never silent. The play page sends the reason to the library. |
| 248 | asks before Start replaces an unfinished game: Continue saved game keeps it, Start new game replaces it | Replace question | A save in round 2; Start; Continue saved game | "Replace your saved game?" naming the teams and round; then the saved game, round 2 | One save per device: starting a new game must never silently destroy the old one. |
| 249 | replaces the saved game after Start new game, and without asking when the saved game is finished | Replace question | A save in round 2; Start, Start new game; then a finished save, Start | A new game in round 1, saved; then no question, and a new unfinished save | Replacing is the answer's job; a finished game isn't worth asking about. |

## Wake lock

`src/app/play/useWakeLock.test.ts`, testing `src/app/play/useWakeLock.ts`. Runs the hook with `renderHook` in happy-dom, which has no wake lock of its own: tests give `navigator` a fake one whose requests succeed (or fail), and set the page's visibility by hand.

| # | Test | Feature | Input | Expected output | Why |
|---|---|---|---|---|---|
| 252 | keeps the screen on while shown, and lets it go when the page closes | Request, release | Show the hook; then remove it | A `'screen'` lock requested; then released once | The screen stays on during play, and only during play. |
| 253 | asks again when the page comes back after being hidden | Visibility | Hide the page; show it again | One request while hidden; a second when visible | Browsers drop the lock whenever the page is hidden (another app, the lock button); without asking again it would only last until the first interruption. |
| 254 | carries on without it where it is missing or refused | No support | No wake lock at all; then one that refuses | No error either way | Older phones lack it and battery savers refuse it: the game must play regardless. |
