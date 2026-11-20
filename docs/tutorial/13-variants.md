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
