# 05 — Survives real life

**Goal of this chapter:** a refresh, a locked phone, a back swipe or a closed tab never loses a game, and quitting one is deliberate.

**Branch:** `chapter/05-survives-real-life`

**Where this fits.** Chapter 04 made Charades playable, but only in memory: anything that reloads the page starts over. That's fine at a desk and fatal at a party, where phones get locked, swiped and passed to someone who taps the wrong thing. This chapter makes a game outlast all of that:

- **Saving and resuming** a game.
- **Continue** from the library.
- **Quit** with a confirmation.
- **Remembered setup choices.**
- **Keeping the screen awake** during play.

---

## Step 1: Deciding how games are saved

**What:** [ADR 0006](../decisions/0006-save-and-resume.md), the design for saving and resuming. No code yet.

**Why:** a save outlives the code that wrote it. Whatever we save today has to be loadable, or safely rejected, by every later version of the app. That's a contract, so it's decided and written down before it's built.

### Where a website can keep things: `localStorage`

Each website gets a small store on the device, `localStorage`: text values under names (keys), kept until the site or the user deletes them. Chapter 04 already used it for team names (`ku-zo-wasa:teams`). It survives refreshes, closed tabs and restarts, never leaves the phone, and holds about 5 MB per site; a game is a few kilobytes.

The ADR lists what we didn't pick and why. The address bar is long and editable. `sessionStorage` is the same store but cleared when the tab closes, which is exactly what we're protecting against. IndexedDB is a full database, more than we need.

### What's saved: everything

The runner's whole state, `{ phase, context, rngState }`, plus a version number, the game's id and the time:

```json
{
  "version": 1,
  "gameId": "charades",
  "savedAt": 1793370000000,
  "state": { "phase": "turn", "context": { "scores": [2, 1], "turnEndsAt": 1793370042000, "…": "…" }, "rngState": 2843021 }
}
```

Saving `rngState` means a resumed game keeps the same "random" card order it would have had. That works because all randomness comes from the seeded Rng (chapter 01): the Rng's state is a single number, so it can be saved like anything else.

For this to work, a game's context has to survive being written as JSON and read back. Strings, numbers, arrays and plain objects do; a `Date` or a function doesn't. Contexts were already plain data; the standard will now require it.

### Old saves: check, and throw away what doesn't fit

The app will change while saves sit on phones. A save from last month might name a phase that's since been renamed, a game that was removed, or settings in an old shape. Loading it blindly would crash or show nonsense, so every load checks:

1. Is it readable, and the right shape?
2. Is its `version` today's version?
3. Is its game still in the registry?
4. Does that game's machine still have its phase?
5. Do its settings still pass the game's config schema?

Any "no" deletes the save and the library says "Your last game couldn't be restored." Losing an unfinished game after an update is a pity; crashing is worse.

The **version rule** covers what the checks can't see: any change to the shape of a saved context bumps the version, and every older save is discarded.

### Start saves, the play page loads

The play page will only ever play a save. Start creates the new game, saves it, and goes to the play page, which loads it. A refresh loads it too, and so does the library's Continue card: three ways in, one path. Each change during the game saves again.

This changes one thing from chapter 04: the setup screen stops passing settings along with the navigation (step 11). And `useGameSession` changes shape: it now plays a state it's given (new or saved) and reports every change, and a separate `newGame` creates new games. That's step 2.

### Files changed

- `docs/decisions/0006-save-and-resume.md` (new), and its row in `docs/decisions/README.md`.
- `docs/tutorial/05-survives-real-life.md` (new): this file.

### How to verify

Read ADR 0006. Each of the five checks should match a way a save can go stale that you can imagine happening. If you can think of a sixth, it belongs in the ADR before step 3 builds the checks.

---

## Step 2: A session that can resume

**What:** `useGameSession` now plays a state it's given, and reports every change. A new function, `newGame`, creates new games.

```ts
// Before (chapter 04): the hook created the game.
useGameSession(machine, input, { seed })

// Now: create the game separately, or load a saved one, and hand it over.
const game = newGame(machine, input)                      // or: the saved state
const { state, send, restart, ended } = useGameSession(machine, game, { onChange: save })
restart(input)                                            // Play again
```

**Why:** ADR 0006. To resume, the session must accept a saved state, not only create a new one. To save, someone must hear about each change. The hook still saves nothing itself; the SDK stays storage-free.

### `onChange`: after drawing, not during the update

A save writes to storage: a **side effect**, something outside React. React's state updates must have none: React may run an update twice to check that (chapter 04, step 6). So the save happens in an **effect**, which React runs after it has drawn the new state:

```ts
useEffect(() => {
  if (state !== first) reportChange(state)
}, [state, first])
```

The effect runs whenever `state` changes. An event the phase ignores returns the same state object, so it doesn't run, and nothing is saved for a tap that did nothing. The starting state isn't reported: whoever passed it in already has it (the app will have just saved it).

`reportChange` is an **effect event** (`useEffectEvent`, as in the countdown): it always calls the latest `onChange`, without a new `onChange` function being a reason to run the effect.

### "Only the first one counts"

```ts
const [first] = useState(initial)
const [state, setState] = useState(first)
```

`useState` keeps its first value and ignores the argument on later renders. Holding `initial` this way means a parent that builds a new starting object every render (as the play page does) doesn't confuse the hook. Without it, the effect would see a "new" starting state on every render and report a change that never happened. A test (227) does exactly that.

### Seeds stay in one file

`newGame` picks the random seed, and `restart` uses `newGame`. Both live in `useGameSession.ts`, so it's still the only file that chooses seeds (standard §4). Tests pass a fixed seed as the third argument: `newGame(machine, input, 2026)`.

### Files changed

- `src/sdk/game/useGameSession.ts`: `newGame`; the hook takes a state; `onChange`; `restart(input)`.
- `src/sdk/game/useGameSession.test.ts`: the six tests use `newGame`; three new.
- `src/app/play/GameScreen.tsx`: takes `initial` (the game to play) and `input` (for Play again). `src/app/play/PlayPage.tsx`: creates the game with `newGame` for now; step 4 moves that to Start. `GameScreen.test.tsx`: `newGame(…, 2026)` instead of the `seed` option.
- `docs/game-standard.md` §4: the new hook.
- `docs/tests.md`: the session tests; counts updated to 227.

### How to verify

1. `pnpm test` reports `227 passed`. `pnpm typecheck` and `pnpm lint` pass.
2. In `useGameSession.ts`, use `initial` instead of `first` (in `useState(first)` and both places in the effect) and run `pnpm test`. "keeps playing when the caller passes a new starting state on every render" fails: two changes reported instead of one. Change it back.
3. Play a game with `pnpm dev`: nothing looks different. Saving isn't connected yet.

---

## Step 3: The save store

**What:** `src/app/play/savedGame.ts`, which reads and writes the one saved game:

| Function | Does |
|---|---|
| `saveGame(game, state)` | Saves the game, replacing any other. |
| `loadGame(game)` | The save for this game: `ok` with its state, `none`, `other game`, or `discarded` with a reason. |
| `summarizeSave()` | For the library: which game, the teams, the round, whether it's finished. |
| `clearGame()` | Deletes the save. |

Nothing uses them yet; step 4 connects them.

**Why:** ADR 0006's checks, in one place, tested against every kind of stale save before any screen relies on them.

### Reading is checking

`read` turns whatever is in storage into a result, in the order of ADR 0006:

```ts
if (version !== saveVersion) return discard(`the save is from an older version of the app (save version ${version})`)
const game = findGame(gameId)
if (!game) return discard(`there's no game "${gameId}" any more`)
```

Each failed check deletes the save and returns a reason, so a bad save is reported once and never again. The reasons are written for players; step 6 shows them in the library.

**The shape check is shallow on purpose.** zod checks the outside (`version`, `gameId`, `savedAt`, `state` with a `phase`, `context` and `rngState`), and the settings inside the context against the game's schema. Everything else in the context is covered by the version rule (ADR 0006), not by a schema per game.

**`Object.hasOwn`, not `in`.** `'turn' in phases` asks "does this object have a `turn`?", and it also looks at what every JavaScript object inherits: `'toString' in {}` is `true`. A save naming the phase "toString" would pass and then crash the runner. `Object.hasOwn` only looks at the object's own keys. A test checks this case.

### One cast, after the checks

Storage gives back text, and TypeScript can't know that text is a Charades state. After the checks, `loadGame` tells it so:

```ts
// The checks in `read` passed for this game, and the version rule covers the rest of the context (ADR 0006).
return { status: 'ok', state: saved.state as unknown as StateOf<G>, savedAt: saved.savedAt }
```

`as` is a promise to TypeScript, not a check. It's acceptable here because it comes right after the checks that justify it, and the comment says which. `StateOf<G>` works out a game's state type from the game itself: its context type (what `machine.context` returns) and its phase names (the keys of `machine.phases`). So adding a game needs no new types here.

### Storage that's off

Some private-browsing modes throw an error on any storage call. Every call here is wrapped: saving fails quietly and the game goes on unsaved, exactly as before this chapter. A test passes a storage that throws on everything.

### Files changed

- `src/app/play/savedGame.ts`, `savedGame.test.ts` (new).
- `docs/tests.md`: the saved-game tests; counts updated to 239.

### How to verify

1. `pnpm test` reports `239 passed`. `pnpm typecheck` and `pnpm lint` pass.
2. In `savedGame.ts`, change `!Object.hasOwn(game.machine.phases, state.phase)` to `!(state.phase in game.machine.phases)` and run `pnpm test`. "throws away a save with a phase name every object has" fails. Change it back.

---

## Step 4: Start saves, the play page loads

**What:** games are now saved and resumed.

- **Start** creates the game with `newGame`, saves it, and opens `/charades/play` without passing anything along.
- **The play page** loads the save and plays it. It saves again after every change, through the session's `onChange`.
- **No save for this game?** The play page goes back to setup.

**Why:** this is the step that makes a refresh harmless. Everything before it was groundwork.

### Three ways in, one path

```tsx
const [saved] = useState(() => (game ? loadGame(game) : undefined))
if (saved.status !== 'ok') return <Navigate to={`/${game.meta.id}`} replace />
return <GameScreen initial={saved.state} options={{ onChange: (state) => saveGame(game, state) }} … />
```

Arriving from Start, refreshing, and (step 6) tapping Continue all land here. Each finds a save and plays it. Chapter 04's navigation state is gone, so there's no second way for a game to arrive that could behave differently.

**Read once.** `loadGame` runs inside `useState`'s starting function, so it runs when the page opens and not on every redraw. That matters because loading can *delete* a stale save: reading storage is fine anywhere, but changing it on every render isn't.

**Play again after a refresh.** It needs the original input (settings and items). The settings are in the save (`context.config`); the items are chosen again from them with `choosePoolItems`. Play again is a new game anyway, so today's packs are the right ones to use.

### Refreshing mid-turn

Nothing special was needed: chapter 04 built the pieces.

- The turn's end is a moment (`turnEndsAt`), saved with the game.
- After a refresh, the countdown shows the time left until that moment.
- If the moment has passed, the countdown sends `time_up` as soon as it appears (chapter 04, step 7), and the turn ends.

Two tests prove it with a fake clock:

- Reopening 10 seconds into a 30-second turn shows 20 seconds left.
- Reopening 15 seconds after the end shows the turn summary.

### Files changed

- `src/app/setup/SetupPage.tsx`: Start creates and saves the game.
- `src/app/play/PlayPage.tsx`: plays the save, and saves each change. `PlayPage.test.tsx` (new).
- `src/app/setup/setup.test.tsx`: Start saves a game; the play page without a save goes to setup.
- `docs/tests.md`: the play page tests, and two setup rows; counts updated to 241.

### How to verify

1. `pnpm test` reports `241 passed`. `pnpm typecheck` and `pnpm lint` pass.
2. In `PlayPage.tsx`, change `options={{ onChange: … }}` to `options={{}}` and run `pnpm test`. Both play page tests fail: moves aren't saved any more. Change it back.
3. On a phone (`pnpm dev --host`):
   - Start a game and get one item in the first turn, then refresh: the same team, the same item, and the timer still counting.
   - Lock the phone mid-turn for longer than the turn has left, then unlock: the turn summary.
   - Close the tab and reopen `/charades/play`: the game is still there.
