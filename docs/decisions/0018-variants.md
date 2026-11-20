# 0018. Variants

- **Status:** Accepted
- **Date:** 2026-11-20

## Context

The Game Standard has three levels (§1): a format, a game, and a **variant**: the same rules with set content and settings ("Anime Charades with 90-second turns"). Until now the home page listed games, and variants only existed as presets: buttons on a game's setup screen that set several settings at once (ADR 0008).

That made the home page a list of rule sets, not of things to play. Players first had to understand "Charades", then pick packs, then a preset. And a new named way to play, like This or That, had no place to go but a new game (ADR 0017), even though it was Trivia Night with two-option questions and different defaults.

## Decision

### The home page lists variants

A variant is what players pick: "Naija Charades (Back to School Edition)", "Masculin ou féminin ?". The home page lists every variant first, then a **Make your own** section with each game, which opens the game's full setup screen, as today.

### A variant is a JSON file

`src/games/<game>/variants/<id>.json`, like a pack, so adding one needs no code (goals 2 and 3):

```json
{
  "$schema": "../../../../schemas/variant.schema.json",
  "id": "naija-back-to-school",
  "name": "Naija Charades (Back to School Edition)",
  "tagline": "Nigerian school days, acted, described and sung.",
  "packs": ["back-to-school"],
  "settings": {},
  "open": ["rounds", "seconds", "mode"],
  "contributors": ["AdeizaSama"]
}
```

| Field | What it is |
|---|---|
| `id` | The file name; with the game's id, its address: `/charades/naija-back-to-school` |
| `name`, `tagline` | What the home page shows |
| `packs`, `tags` | The content: which packs, and optionally only items with these tags |
| `settings` | The settings that differ from the game's defaults, e.g. `{ "mode": "clock" }` |
| `open` | The settings players may change on the variant's setup screen. Teams are always open; packs and tags never are |
| `contributors` | GitHub usernames |

Two checks, both run on every pull request:

- **The content check** (`pnpm validate-content`) checks each file's shape and that its id is its file name.
- **`defineGame`** (run by the tests) checks it against its game: the packs exist, `settings` pass the game's settings schema, `open` names real settings, and the id isn't `play` or `rules` (those addresses are taken). A test checks no two variants of a game share an id.

### A variant's setup screen

Teams, then only the open settings. Rounds and turn length are shown by the setup screen when open; a game's own settings view gets the open settings too, and shows only those. Packs and tags aren't shown. What players change is remembered per variant, on top of the variant's settings, so a variant that changes later still applies.

A saved game remembers its variant, so Continue says "Continue Naija Charades (Back to School Edition)". Saves from before have no variant and still load (the version doesn't change: the field is optional).

### Presets are dropped

Variants are curated presets with a name on the home page. Two ways to name a set of settings would confuse players and contributors, so presets and the preset buttons on setup go. The game's full setup screen shows every setting. This replaces the preset parts of ADR 0008; its settings view and the rest stand.

### This or That folds into Trivia Night

Masculin ou féminin ? becomes a Trivia Night variant: its pack moves to Trivia Night, with ten questions a turn, 60 seconds, A to Z, and Set questions only (mode isn't open). The This or That game goes. The choice turn stays in the SDK (ADR 0017), for the next multiple-choice game that needs rules of its own.

## Consequences

- **Easier:** a new way to play is a JSON file. The home page says what's fun to play, not what the rules are called.
- **Harder:** a game's settings view must hide settings that aren't open. A variant's settings are checked by the tests, not the content check, because the content check reads only a game's `schema.ts`.
- **Amends:** ADR 0008 (presets are replaced by variants) and ADR 0017 (This or That is a variant, not a game).
