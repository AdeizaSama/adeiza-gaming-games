# 07 — Setup and rules

**Goal of this chapter:** players choose how to play Charades on the setup screen: a mode, points per result, a preset in one tap, and the rules to read first. Charades is then complete.

**Branch:** `chapter/07-setup-and-rules`

**Where this fits.** Chapter 06 gave Charades its modes and its scoring, but only tests could change them. This chapter puts them on the setup screen. It also adds presets (named groups of settings) and the game's rules.

---

## Step 1: Deciding how a game adds settings to setup

**What:** [ADR 0008](../decisions/0008-settings-and-presets.md). No code yet.

**Why:** the setup screen belongs to the app, and the app never imports a game. Charades' mode and points need a way onto that screen that the next games can use too. Presets were planned from the start but have never been shown. Both are contracts, so they're decided first.

### A settings view

A game gives `defineGame` an optional `config.view`. It's a component that gets the current settings and an `onChange` function, like a phase view gets `context` and `send`. The app shows it on setup, below the format's settings. How the settings look is up to the game.

### Presets are applied whole

A preset is the game's defaults plus its own changes. Tapping one sets every setting except teams, tags, and packs (unless the preset names some). A preset button is shown as selected only while the settings match it exactly. A preset no longer has to list packs: Quick, Classic and Party are about how to play, not what to play.

### How to verify

Read the ADR. Steps 2 to 4 build each section of its Decision in order.

---

## Step 2: One draft for every setting

**What:** the setup screen keeps all its settings in one object, and saves it per game with the game's own fields. `Stepper` moves from `src/app/setup/` to `src/ui/stepper.tsx`.

**Why:** until now setup had one piece of state per format setting (rounds, turn length, packs, tags), so a setting it didn't know about had nowhere to go. Charades' `mode` and `points` need to be kept, saved and checked like the rest (ADR 0008). `Stepper` moves because the next step's Charades settings use it, and a game can't import from `src/app/`.

### The draft starts from the schema

```ts
const [choices, setChoices] = useState(() => loadSetup(game) ?? defaultSetup(game))
```

`defaultSetup` asks the game's schema for its defaults (`schema.parse` with placeholder teams and every pack), so the screen can't disagree with the schema. Before this, setup read the format's defaults, which would have been wrong for a game that changes them.

`loadSetup` now returns the saved draft **as the schema parsed it**, not as it was saved. That one change means a draft saved before Charades had `mode` comes back with `mode: 'describe'`: the schema's default fills the gap. A draft with a setting the game no longer has fails the strict schema and is ignored, as before.

### Typing a change to one setting

The screen works for any game, so its settings type is generic: `Omit<Config, 'teams'>` for some `Config` that extends `TeamTurnsConfig`. TypeScript won't let you write `{ rounds: 4 }` straight into that type: a game *could* narrow `rounds`. Spreading is accepted:

```ts
const change = (changes: Partial<SetupChoices<TeamTurnsConfig>>) => setChoices((current) => ({ ...current, ...changes }))
```

### How to verify

`pnpm test src/app/setup`: test 281 saves Mix it up with custom points and gets them back, then loads a draft from before modes existed and gets the defaults. On a phone nothing looks different yet: change rounds, leave and come back, and it's kept as before.
