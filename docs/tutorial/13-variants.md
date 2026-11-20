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

---

## Step 3: The content check reads variants

**What:** `pnpm validate-content` checks every `src/games/<game>/variants/*.json` file with `checkVariant` (and its `$schema` link), and `pnpm generate-schemas` writes `schemas/variant.schema.json` for editors. `findGames` lists each game's variant files.

**Why:** a variant is content: someone adding one should hear what's wrong from the check, in plain words, before the tests run.

One schema serves every game's variants, because it describes the shape only. `settings` is any object there: whether `"mode": "clock"` is a Charades setting is for `defineGame` to say, and the tests run it.

### How to verify

`pnpm validate-content` ends with "All packs, variants and themes are valid." `pnpm test`: 446 tests.

---

## Step 4: Settings views show only what's open

**What:** Charades', Name Ten's and the choice turn's settings views read `open` and show only those settings (`isOpen(open, 'mode')`). With no `open` list (a game's own setup), they show everything, as before.

**Why:** a variant's setup screen hands its game's settings view the variant's open settings; the view knows how its settings are laid out, so it's the one that hides them.

Two layouts needed care:

- Charades' points live behind **Advanced settings**, under the mode. A variant that opens points but not the mode gets them under their own **Points** heading.
- The choice turn's **Questions per turn** sits under the mode, and only in Set questions mode. Masculin ou féminin ? locks the mode but opens questions, so the stepper gets its own heading.

### How to verify

`pnpm test`: 449 tests. Show the order of the options whatever `open` says, and the choice view's test fails.

---

## Step 5: A variant's setup screen

**What:**

- `App.tsx`: a route `/:gameId/:variantId`, after `play` and `rules`, to `SetupPage`, which finds the variant (or shows Page not found).
- `SetupScreen.tsx` takes `variant`: its name and tagline at the top; teams; rounds and turn length only if open; the game's settings view with `open`; no packs or tags.
- `savedSetup.ts`: `loadVariantSetup` starts from the variant's settings and puts players' last changes on top, for open settings only. Kept under `ku-zo-wasa:setup:charades/naija-back-to-school`.
- `savedGame.ts`: a save remembers `variantId`, and `saveName` gives the variant's name or the game's. `saveGame` now takes its extras as options: `saveGame(game, state, { variantId })`.

**Why:** a variant is a way to play, so its setup is short: who's playing, and the few things it lets them change.

### Saving only what's open

A variant can change after players used it: a new turn length, or a setting closed. So the screen doesn't save "the settings" for a variant; on the next visit it starts from the variant as it is now and takes back only players' changes to settings that are still open.

### Old saves

`variantId` is optional in a save, so a game saved before this chapter still loads, without a new save version. A save whose variant has been removed since also loads; it's just called by the game's name.

### How to verify

`pnpm test`: 453 tests. Show the packs on a variant's setup, and the variant setup test fails.
