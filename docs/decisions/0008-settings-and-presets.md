# 0008. Game settings and presets on setup

- **Status:** Accepted
- **Date:** 2026-11-02

## Context

The setup screen belongs to the app and shows the format's settings: teams, rounds, turn length, packs and tags (standard §7). Chapter 06 gave Charades settings of its own, `mode` and `points` (ADR 0007), and there's no way yet for players to change them: setup doesn't know they exist.

Every team-turns game will have settings like these, and they differ by game: Charades has modes and points per result, Trivia Night will have difficulty. The app can't know them all.

Presets (standard §1, "Variant") were planned from the start but nothing shows them yet. The first ones, Quick, Classic and Party, are about rounds, turn length and mode, not content. A preset must list at least one pack today, so each would have to name Charades' packs and be updated every time a pack is added.

Constraints:

- **The app never imports a game** (standard §9). It gets everything through the game's definition.
- **The game's config schema stays the one source of truth** for what's allowed and what the defaults are (standard §3).
- **Settings must stay correct after a refresh** (ADR 0006): the setup draft is saved per game as players go.

## Decision

### A game shows its own settings with a settings view

`defineGame` gets an optional `config.view`: a React component the setup screen shows below the format's settings. It receives:

- `settings`: the current settings, the game's own fields included.
- `onChange(changes)`: called with the fields that changed, e.g. `{ mode: 'mix' }`.

The game decides how its settings look. Charades shows a mode choice and an Advanced settings button that opens a dialog with the points. A game with no settings of its own leaves `view` out.

The view is checked against the game's types, like a phase view (ADR 0005): it can't set a field the schema doesn't have. The settings it produces are still checked by the schema before Start is allowed.

We rejected a declarative list of fields (`{ key: 'mode', type: 'choice', options: [...] }`) rendered by the app. It reads well for one choice, but grouping settings into a dialog, explaining a choice or hiding one that doesn't apply would each need a new field type in the SDK. Games are written in code already, and the shared parts (`Stepper`, `Dialog`, `Button`) are in `src/ui/` for them to use.

### The setup draft holds every setting

Setup keeps one draft object: the schema's defaults, then what was saved for this game on this device, then each change. It's saved per game with the game's own fields. A draft saved before a game added a field still loads: the schema's default fills in the missing field. A draft that no longer passes the schema is ignored, as before.

### Presets are applied whole

A preset is the game's defaults plus the preset's own changes. Tapping one sets **every** setting except:

- teams: players always name their own;
- packs, unless the preset names some;
- tags, which only make sense for the packs chosen.

So tapping Party after setting act to 5 points puts act back to 3. A preset button is shown as selected only while the settings equal the preset exactly. A selected button always means "these are the preset's settings", never "these are close".

We rejected applying only the fields a preset names. Custom points would survive a tap on Party, and Party would still look selected with points nobody chose for it.

### A preset's packs are optional

`packs` on a preset becomes optional. A preset without packs keeps the players' pack choice. A preset with packs still has them checked: at least one, and each must exist. Quick, Classic and Party name no packs, so adding a pack never means editing them.

## Consequences

- **Easier:** a game adds settings with its schema and one view. The setup screen, saving, presets and Start's check work for them unchanged.
- **Easier:** presets about how to play, not what to play, need no pack list.
- **Harder:** a settings view is code, so a new kind of setting needs a developer. Presets and packs, which non-coders write, are unchanged.
- **Harder:** the app trusts a game's view to call `onChange` only with valid fields. The schema check before Start is the safety net.
- **SDK change:** `defineGame`'s `config` gets `view`; `Preset.packs` becomes optional. The preset rules (apply whole, match exactly) live in the SDK, so every game and screen uses the same ones.
