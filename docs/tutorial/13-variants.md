# 13 — Variants

**Goal of this chapter:** the home page lists ways to play, not rule sets: "Naija Charades (Back to School Edition)", "Masculin ou féminin ?". Each is a variant: a game with set content and settings, in a JSON file. Below them, "Make your own" opens a game's full setup.

**Branch:** `chapter/13-variants`

**Where this fits.** The Game Standard always had three levels: format, game, variant (§1). Variants existed only as preset buttons on setup. This chapter gives them the home page, replaces presets with them, and folds This or That back into Trivia Night, which is what it always was.

---

## Step 1: Deciding what a variant is

**What:** [ADR 0018](../decisions/0018-variants.md). No code yet.

**Why:** a variant is content (a JSON file anyone can add), so its shape has to be settled before code reads it.

| Decision | Why |
|---|---|
| A variant is `src/games/<game>/variants/<id>.json` | Adding a way to play needs no code, like adding a pack |
| It lists its packs, settings, and `open`: the settings players may change | "Masculin ou féminin ?" is Set questions only; Naija Charades lets players pick the mode |
| The home page lists variants first, then "Make your own" | Players pick something to play, not a rule set |
| Presets go | Variants are presets with a name on the home page; two names for one idea would confuse everyone |
| This or That becomes a Trivia Night variant | Same rules, its own content and defaults |

### How to verify

Read the ADR.

---

## Step 2: Variants in the SDK, and presets gone

**What:**

- `src/sdk/content/variant.ts`: `VariantFile` (the shape of a variant file), `checkVariant` and `loadVariants`, built like `checkPack` and `loadPacks`.
- `src/sdk/game/defineGame.ts`: `variants` instead of `config.presets`, with its checks.
- `src/sdk/game/settings.ts`: `variantSettings`, `withOpenChanges`, `openableSettings`, `isOpen`, and `open` on a settings view's props; `presetSettings` and `matchesPreset` removed.
- Presets removed from every game and from the setup screen.

**Why:** the app needs to read variants before it can show them.

### Two checks, in two places

A variant file is content, so the content check can read it without the game. But whether `"mode": "clock"` is a real setting depends on the game. So the checks split:

| Checked by | What |
|---|---|
| `checkVariant` (the app and the content check) | The shape: fields, types, at least one pack, the id is the file name |
| `defineGame` (the tests) | Against the game: packs exist, settings pass the game's schema, `open` names real settings, no id twice, no id `play` or `rules` |

`openableSettings` reads the names of a game's settings from its schema's defaults, so a game never lists them by hand: Charades' are rounds, seconds, mode and points.

### A bug the tests found

`openableSettings` parses the schema's defaults, which need a pack. A game with no packs made it throw before `defineGame` could report "A game needs at least one pack". Any pack id will do for reading setting names, so a stand-in id fixes it.

### How to verify

`pnpm test`: 445 tests; `pnpm typecheck`: 31 compile-time checks (the two about what a preset could set went with presets). Turn off the settings check in `defineGame`, and the "checks a variant's settings" test fails.
