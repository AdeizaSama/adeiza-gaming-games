# 06 — Scoring and review

**Goal of this chapter:** Charades can mix up how cards are clued, scores each card by how it was clued, and lets a host fix mistakes before a turn's points count.

**Branch:** `chapter/06-scoring-and-review`

**Where this fits.** Chapter 05 made a game survive real life. This chapter and the next complete Charades. This one is about what happens during and right after a turn:

- **Two modes:** Describe, and Mix it up, where each card says whether to describe, act or sing it.
- **Points per result:** a correct describe, act or sing, and a skip, each have their own value, set in the settings.
- **A review screen** after every turn, where wrong taps get fixed.

Chapter 07 puts these settings on the setup screen, adds presets and the rules.

---

## Step 1: Deciding how a turn is reviewed

**What:** [ADR 0007](../decisions/0007-turn-review.md). No code yet.

**Why:** a review screen could go in two places: inside the format's turn summary, or as a separate step. That choice changes the Game Standard (the `Summary` primitive was planned as "editable") and the SDK (how a turn's points are worked out). Both are contracts, so they're decided first.

### Review is the game's phase, not the format's

The team-turns format already lets a game add phases between its turn and the summary (chapter 03). So the review needs no change to the format's loop:

```
handoff → turn → review → turn_summary → …
```

Only the screen is shared: a new `Review` primitive that Name Ten will reuse.

### Locked until Adjust

Review is on screen while the phone is passed around, so its results are locked until the host taps **Adjust**. Whether it's unlocked is screen state: it isn't saved, so a refresh locks it again. The changes themselves are machine events, so they're saved like every other move.

### Points need the settings

How much a card is worth now depends on the settings (a correct act might be worth 3, a skip −1). The game's `points` function only received the turn, so it now also receives the settings: `points(turn, config)`.

### How to verify

Read the ADR. The flow diagram and the result table are what steps 3 and 4 build.

---

## Step 2: Charades' own settings

**What:** `src/games/charades/config.ts`, the settings schema for Charades: the format's settings plus `mode` and `points`.

**Why:** both modes and the scoring are settings players choose, so they belong in the schema that checks setup (standard §5). The app uses the game's schema everywhere settings are checked: setup, presets and loading a saved game.

### Extending the format's schema

```ts
export const CharadesConfig = TeamTurnsConfig.extend({
  mode: z.enum(['describe', 'mix']).default('describe'),
  points: z.strictObject({ describe: …default(2), act: …default(3), sing: …default(3), skip: …default(1) }).prefault({}),
})
```

`extend` keeps everything the format checks (team names, rounds, packs) and stays strict, so a typo in a setting is still an error.

**`prefault` vs `default`.** `default(value)` is used *instead of* parsing when the field is missing, so it would need all four numbers written out again. `prefault({})` parses `{}` when the field is missing, which lets each number's own default fill itself in. Change one default and nothing else needs updating.

**Skip is a cost, written as a positive number.** `skip: 1` means a skip takes 1 point off. 0 turns the penalty off, so no separate on/off switch is needed.

### How to verify

`pnpm test src/games/charades/config.test.ts`: 5 tests. Change a default in `config.ts` and the first test fails.

---

## Step 3: The turn log and scoring by mode

**What:**

- **SDK:** `points(turn, config)` instead of `points(turn)`, and an optional `onStart` list in `teamTurns`.
- **Charades:** the turn record becomes a log of cards, each card gets a mode when it's drawn, and points come from the settings.
- **Saves:** `saveVersion` goes from 1 to 2.

**Why:** review (step 4) needs every card in the order it was played, with enough on each card to score it again after a correction.

### The log

```ts
interface CharadesEntry { item: CharadesItem; mode: 'describe' | 'act' | 'sing'; result: 'got' | 'skipped' }
interface CharadesTurn { entries: CharadesEntry[]; mode: CharadesMode } // mode: how the card on screen is clued
```

Got and Skip add the card on screen to `entries` with `turn.mode` and a result. A turn's points are the sum of its cards, never below 0:

```ts
points: (turn, config) => Math.max(0, turn.entries.reduce((sum, entry) => sum + entryPoints(entry, config.points), 0)),
```

With the defaults, two got and a skip is 2 + 2 − 1 = 3.

### Picking a mode, and why the format needed `onStart`

`pickMode` runs after every draw: `describe` in Describe mode, or a random one of the item's `modes` in Mix it up. It uses the machine's `rng`, never `Math.random`, so a resumed game shows the same modes (standard §4).

Charades writes the draws after Got and Skip itself, so it adds `pickMode` there. But the first card of every turn is drawn by the format's `start` transition, which belongs to the format. Without a change, the first card of a turn in Mix it up would have no mode. `teamTurns` now takes an optional `onStart: ['pickMode']`: the game's actions to run right after that first draw. A typo in it is a type error, like any other action name.

**Describe mode uses no random numbers for modes**, so the draws in a describe game are exactly the same as before this step. That's why the full-game test still draws the same 30 items; only its scores changed (9 → 15, because a got is now worth 2).

### Old saves

The turn record and the settings changed shape, so a game saved by chapter 05's code can't be loaded by this one. Following the version rule (ADR 0006), `saveVersion` goes to 2, with a comment listing what each version means. An old save is thrown away with the notice.

### How to verify

`pnpm test`: 268 tests. Remove `...onStart` from the format's `start` transition and the `onStart` test fails; put an unknown name in `onStart` and `pnpm typecheck` fails.

---

## Step 4: The Review primitive

**What:** `src/sdk/interactions/Review.tsx`, the shared screen for reviewing a turn, and its row in the standard's table of primitives (§6). `Summary` is now described as read-only for good.

**Why:** the plan had the review phase before this screen, but `defineGame` refuses a game that has a phase with no view (chapter 04). So the screen comes first, and the next step adds the phase and its Charades view together.

### What it knows, and what it doesn't

Like every primitive, `Review` takes plain props and knows nothing about machines or Charades (ADR 0005):

```ts
<Review title="Lions" rows={[{ text: 'Gala', detail: 'Acted', result: 'Got it', tone: 'good' }, …]} onToggle={(index) => …} onDone={…} />
```

- `tone` picks the result's color from the theme tokens: `good` (success), `bad` (destructive) or `none` (muted).
- `onToggle(index)` only says which card was tapped. What a tap changes is the game's rule, kept in its machine.

### Locked until Adjust

The screen starts locked: the cards are plain rows, not buttons, so a tap does nothing. **Adjust** turns every row into a button; **Lock** turns them back. That state lives in a `useState` inside the component, not in the game. A refresh locks the screen again, while the changes already made stay, because each one was a machine event.

### How to verify

`pnpm test src/sdk/interactions/review.test.tsx`: 3 tests. Change `useState(false)` to `useState(true)` in `Review.tsx` and all three fail.
