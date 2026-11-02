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

---

## Step 3: A game's own settings on setup

**What:**

- `src/sdk/game/settings.ts`: the `SettingsView` type.
- `config.view` in `defineGame`.
- Charades' `views/SettingsView.tsx`: a mode choice, and an **Advanced settings** dialog with the points.
- `Section` moves to `src/ui/section.tsx`, like `Stepper` did.

**Why:** ADR 0008. The setup screen draws a game's settings view below the format's settings and passes it the draft from step 2.

### The contract

```ts
export interface SettingsViewProps<Config> {
  settings: Settings<Config>   // every setting but the teams
  onChange: (changes: Partial<Settings<Config>>) => void
}
```

On setup it's one line:

```tsx
{SettingsView && <SettingsView settings={choices} onChange={(changes) => setChoices((current) => ({ ...current, ...changes }))} />}
```

`defineGame` types `view` with `NoInfer`, like phase views: `Config` comes from the schema, and the view is checked against it. A view reading a setting the schema doesn't have is a compile error (C31).

### Charades' settings

- **Mode:** two radio cards, Describe and Mix it up, each with one line saying what it means.
- **Advanced settings:** a button with the points summed up under it ("Describe 2 · Act 3 · Sing 3 · Skip −1"). It opens a dialog with one stepper per result:
  - Described, Acted, and Sung or hummed: 1–5 points each.
  - Skipped: 0–5, where 0 shows as "No penalty".

  The stepper limits are the schema's limits, so the dialog can't produce a setting Start would reject. **Reset to defaults** is off while the points are already the defaults. In Describe mode a note says acted and sung cards only come up in Mix it up.

The defaults come from the schema itself, not from numbers copied into the view:

```ts
const defaultPoints = CharadesConfig.shape.points.parse(undefined)
```

### How to verify

- `pnpm test src/games/charades/views src/app/setup`. Test 282 picks Mix it up, sets skips to cost nothing, leaves setup and comes back, then starts a game with those settings.
- On a phone, run `pnpm dev --host`. On Charades' setup, pick Mix it up and play a turn: each card says how to clue it. Then set Skipped to "No penalty" in Advanced settings and check that a skip costs nothing in review.

---

## Step 4: Presets

**What:**

- `presetSettings` and `matchesPreset` in `src/sdk/game/settings.ts`.
- A preset's `packs` becomes optional in `defineGame`.
- Charades gets three presets: Quick, Classic and Party.
- Setup shows them as buttons under Teams.

**Why:** most players never open Advanced settings: they want "a quick game" or "a party game". Presets are those choices, made once by whoever wrote the game (ADR 0008).

### Charades' presets

```ts
presets: [
  { id: 'quick', name: 'Quick', contributors: ['AdeizaSama'], config: { rounds: 2, seconds: 45 } },
  { id: 'classic', name: 'Classic', contributors: ['AdeizaSama'], config: {} }, // the defaults
  { id: 'party', name: 'Party', contributors: ['AdeizaSama'], config: { mode: 'mix' } },
],
```

None of them lists packs, so adding a pack never means editing a preset. `defineGame` still checks each preset's settings against the schema, standing in the game's first pack for the packs players will choose.

### Applying a preset whole

```ts
const settings = schema.parse({ ...preset.config, teams: placeholderTeams, packs: preset.packs ?? placeholderPacks })
return { ...withoutTeams(settings), packs: preset.packs ?? current.packs, tags: current.tags }
```

The schema fills in every default, then the preset's own changes win. Only packs and tags come from what players had. So tapping Party after changing points puts the points back.

### Selected only when exact

`matchesPreset` compares every setting with what the preset would set, objects (like `points`) included. Packs count only if the preset names some, in any order. So with the defaults, Classic is lit; change anything and no preset is lit. A lit button always tells the truth.

### How to verify

- `pnpm test src/sdk/game src/app/setup`. Tests 286–290 are the rules; test 292 taps through the presets on the setup screen.
- On a phone: Classic is lit when setup opens. Tap Party, then open Advanced settings and change a point: Party goes dark.

---

## Step 5: Rules in a small part of markdown

**What:**

- [ADR 0009](../decisions/0009-rules.md).
- `src/sdk/interactions/markdown.ts`: `parseMarkdown`.
- `src/sdk/interactions/Instruction.tsx`: the `Instruction` primitive and `Markdown`.

**Why:** every game needs rules players can read, and rules are text that non-coders should be able to fix. Markdown is how GitHub shows text, so a contributor sees their change as players will. We support only what rules need, and report everything else.

### What's supported

`#`, `##` and `###` headings; paragraphs; `- ` and `1. ` lists; `**bold**`. That's the whole list.

### Parse to data, render as elements

`parseMarkdown` returns blocks, not HTML:

```ts
type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: Span[] }
  | { type: 'paragraph'; text: Span[] }
  | { type: 'list'; ordered: boolean; items: Span[][] }
```

`Markdown` maps each block to a React element (`<h3>`, `<p>`, `<ol>`…), with text as text. React escapes text, so a rules file that contains `<img onerror=…>` shows those characters and nothing runs (test 299). A library that produces an HTML string would need `dangerouslySetInnerHTML` to show it.

### Problems, with line numbers

The parser goes line by line. A line that starts something unsupported (a table, a quote, a code fence, an indented line…) becomes a problem like `Line 7: tables aren’t supported; use a list`. Text inside a line is checked too: links, images, code, italics, HTML. Step 6 makes `defineGame` throw on any problem, so a mistake fails CI instead of showing raw symbols to players.

### How to verify

`pnpm test src/sdk/interactions`. To see a problem reported, add a line like `| a | b |` to the rules in test 293 and run it again.

---

## Step 6: Charades' rules, and How to play

**What:**

- `rules` becomes a required field of `defineGame`, checked with `parseMarkdown`.
- Charades gets `src/games/charades/rules.md`.
- A How to play page at `/:gameId/rules` (`src/app/rules/RulesPage.tsx`), with a link to it on setup.

**Why:** every game must have rules (standard §13). ADR 0009 says a construct the screen can't show fails the tests. `defineGame` is where every game's other mistakes are already caught, so the check goes there too.

### Importing a text file

```ts
import rules from './rules.md?raw'
```

`?raw` asks Vite for the file's contents as a string, instead of treating it as a module. The rules end up in the bundle as text: no request at run time, and nothing to load offline.

### The check

```ts
if (game.rules.trim() === '') report('rules', 'Write how to play')
for (const problem of parseMarkdown(game.rules).problems) report('rules', problem)
```

Put a table in `rules.md` and every test that imports Charades fails with `rules: Line 31: tables aren’t supported; use a list`.

### A page, not a dialog

The rules are a screen of text. A page scrolls like any page, and a back swipe on a phone returns to setup. The setup link passes `state: { fromSetup: true }`, so **Back to setup** goes back in the history instead of adding setup to it again. Opened from a shared link, it goes to setup instead, because going back would leave the site.

### The rules themselves

They cover a turn, the two modes, points and two tips, and the points are the defaults ("Unless you change them in Advanced settings"). They use the same words as the buttons players see: **Start**, **Got it**, **Skip**, **Adjust**, **Done**.

### How to verify

- `pnpm test`: tests 300–302.
- On a phone: on Charades' setup, tap **How to play**, read to the end, then tap **Back to setup** (or swipe back).

---

## Step 7: Charades is complete

**What:**

- `src/games/charades/README.md`: the rules in short, content guidelines, and what each file is.
- The Definition of Done (standard §13), checked item by item.
- The root README's status.

**Why:** the Definition of Done is what "complete" means for a game. A game's README is where a contributor starts: what the game is, and what a good item looks like.

### Content guidelines: Describe first

Most games are played in Describe mode, so every item has to work when talked about. `modes` is optional and defaults to `["describe"]`. An item lists `act` or `sing` only when it's also good to act or sing. The README gives examples of each.

### The Definition of Done

| Item | Where it's met |
|---|---|
| Fits an existing format | `team-turns` |
| `defineGame` with meta, content, config schema and presets, rules, machine, views | `src/games/charades/index.ts`; `defineGame` throws if any part is wrong |
| Deterministic guards and actions; full-playthrough, `validateMachine`, per-guard and per-action tests | `machine.test.ts`: a full game with a fixed seed; `validateMachine`; a test each for `isEntry`, `pickMode`, `markGot`, `markSkipped`, `markTimeUp` and `toggleEntry` |
| At least one valid content pack | Back to School (`pnpm validate-content`) |
| Views use primitives | Turn: `FlashCard` and `Countdown`. Review: `Review`. Handoff, summary and results: the format's views. The settings view is a setup form, not a phase, and is built from `src/ui/` parts (`Section`, `Stepper`, `Dialog`, `Button`) |
| Setup → turns → results on a phone, with resume after refresh | Checked by hand on a phone (below), and covered by screen tests since chapter 05 |
| Looks right under every shipped theme, light and dark | One theme ships, with a dark scheme. Checked by hand (below). Phase 2's themes must be checked again |
| A README for the game | `src/games/charades/README.md` |

Two items can only be checked by eye, on a real phone:

1. Run `pnpm dev --host` and open the address it prints on a phone on the same Wi-Fi.
2. Pick a preset, read How to play, and play a game to the results. Refresh mid-turn and in review, and lock the phone during a turn.
3. Switch the phone to dark mode and look at every screen again: setup, Advanced settings, How to play, handoff, turn, review, summary and results.

---

## Chapter summary

Charades is complete.

| Step | What | Contract |
|---|---|---|
| 1 | ADR 0008: settings and presets on setup | Yes |
| 2 | One setup draft for every setting, the game's own included | |
| 3 | `config.view`; Charades' mode and Advanced settings | Yes: `defineGame` |
| 4 | Presets, applied whole and selected only when exact; packs optional | Yes: presets |
| 5 | ADR 0009; `parseMarkdown`; the `Instruction` primitive | Yes: primitives |
| 6 | `rules` in `defineGame`; Charades' rules; How to play | Yes: `defineGame` |
| 7 | Charades' README; the Definition of Done | |

**What we learned:**

- A setting a game adds later shouldn't break what's saved on players' phones. Loading the draft *through the schema* fills the gap with the default, at no cost.
- "Selected" on a preset is a promise. Comparing every setting exactly, rather than only the ones the preset names, keeps it.
- The safest HTML is HTML that can't get in. Parsing markdown to data and rendering elements gives a renderer that can't inject anything, for less code than a library.

**Tests:** 302 runtime tests and 32 compile-time checks.
