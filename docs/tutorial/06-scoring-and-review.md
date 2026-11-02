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
