# 10 — Name Ten

**Goal of this chapter:** a second game, Name Ten: a team gets a category and a minute to name ten things in it, while a judge from another team ticks them off a board of answers.

**Branch:** `chapter/10-name-ten`

**Where this fits.** Charades built the SDK; Name Ten tests it. It's also a check on CONTRIBUTING: as we go, we note every point where the public docs didn't answer a question a contributor would have, and the chapter ends by writing the step-by-step guide CONTRIBUTING promised.

---

## Step 1: Deciding how Name Ten plays on one phone

**What:** [ADR 0012](../decisions/0012-name-ten.md). No code yet.

**Why:** two questions shape everything else: how answers are counted, and who holds the phone.

### An answer board

Each category comes with ten to twenty answers. A turn deals ten of them (a setting, 10–15) onto a board, and a point is an answer on the board that the team said. A counter (+1 for anything the judge accepts) would be simpler, but every turn would turn into an argument.

### A judge from the next team

The board shows the answers, so nobody on the guessing team can hold the phone. It goes to a judge from the next team in playing order.

### Reused, and new

Review after the turn is Charades' review, reused. New to the SDK: `PromptCard` (the board) and a `lead` line on `Handoff` ("Hand the phone to a judge from").

### How to verify

Read the ADR. Steps 2–7 build it; step 8 writes the docs.

---

## Step 2: Categories and their answers

**What:**

- `src/games/name-ten/schema.ts`: a content item is a category, its answers and tags.
- `src/games/name-ten/content/back-to-school.json`: 38 categories, each tagged school, food, games, home, culture, music, tv or tech.
- `schemas/name-ten.pack.schema.json`, generated.

**Why:** content comes first: it's what the machine deals and the board shows.

### The rules a category must pass

| Field | Rule | Why |
|---|---|---|
| `category` | 1–60 characters | It's read aloud and shown at the top of the board |
| `answers` | 10–20, each 1–50 characters, no repeats (ignoring case and spaces) | A board deals up to 15; a list longer than 20 means people will shout answers that aren't there |
| `tags` | Optional, kebab-case | Filtering, as in Charades |

Repeats use the SDK's `findDuplicates`, the same comparison packs use for repeated items, so "Zero" and " zero " are the same answer.

### What a contributor gets for free

The content check and `pnpm generate-schemas` found the new game folder by themselves: no list to add it to. One answer in the original list was 42 characters; the limit is 50, the same as a Charades card.

### How to verify

- `pnpm test src/games/name-ten`: tests 344–349.
- `pnpm validate-content` lists `src/games/name-ten/content/back-to-school.json (38 items)`.

---

## Step 3: Settings

**What:** `src/games/name-ten/config.ts`: `TeamTurnsConfig` plus `shown`, the answers on the board (10–15, default 10).

**Why:** the board's size is the one setting Name Ten adds. Turn length, rounds, packs and tags come from the format, as they did for Charades.

The minimum of 10 matches the content rule from step 2: every category has at least 10 answers, so a board is never short. The maximum of 15 keeps the board scannable in a minute.

### How to verify

`pnpm test src/games/name-ten`: tests 350–351.

---

## Step 4: The machine

**What:** `src/games/name-ten/machine.ts`: the turn, its review and its scoring, on the team-turns format.

**Why:** the rules from ADR 0012, as a machine the tests can play.

### What the format already does

The handoff, the timer, drawing a category from the pool, the turn summary, banking points and the results all come from `teamTurns`. Name Ten writes only this:

```ts
newTurn: () => ({ board: [], got: [] }),
points: (turn) => turn.got.filter(Boolean).length,
onStart: ['dealBoard'],
phases: {
  turn: { interaction: 'prompt_card', on: { toggle: …, lock_in: { to: 'review' }, time_up: { to: 'review' } } },
  review: { interaction: 'review', on: { toggle: …, done: { to: 'turn_summary' } } },
},
```

`onStart` (from chapter 06) runs `dealBoard` after the format has drawn the category: it's what Charades used to give the first card a mode.

### Dealing a board

`deal` shuffles the answers (Fisher–Yates) using the machine's random numbers, not `Math.random`, then takes the first `shown`. So the same seed always deals the same board, and a resumed game shows the same answers. A category with fewer answers than the setting puts all of them on the board: test 353 found that, because most Back to School categories have 12 answers and a board can be set to 15.

### One event for ticks and corrections

`toggle` ticks an answer during the turn and corrects one in review. It's the same action in both phases; the review screen's Adjust lock (chapter 06) is what makes corrections deliberate.

### How to verify

`pnpm test src/games/name-ten`: tests 352–362.

---

## Step 5: The board, and a judge's handoff

**What:** two SDK changes from ADR 0012:

- `src/sdk/interactions/PromptCard.tsx`: a prompt, a running count ("4 of 10") and a board of answers that tick when tapped.
- `Handoff` gets an optional `lead`: the line above the name, "Pass the phone to" unless told otherwise.

**Why:** the standard planned `PromptCard` for Name Ten (§6). Building it in the SDK rather than inside Name Ten means a later game with a "tick what was said" board gets it for free.

### Built from what's there

- Each answer is a `Button`: `outline` when unticked, `success` with a check mark when ticked, `aria-pressed` for screen readers. Themes style it like every other button (chapter 09).
- The prompt sits on a card marked `data-feature`, so a theme's tape or planet decorates it like the Charades flash card.
- Like every primitive, it knows nothing about machines: it reports a tap's position, and the machine decides what a tick is worth.

### How to verify

`pnpm test src/sdk/interactions`: tests 363–365.

---

## Step 6: The views

**What:** four views in `src/games/name-ten/views/`, and one more SDK change: `Review` gets an optional `noun`.

| View | Phase | Built from |
|---|---|---|
| `HandoffView` | `handoff` (replacing the format's) | `Handoff` with `lead="Hand the phone to a judge from"`, the judge team as the name, and "Lions are up · Round 1 of 3" |
| `TurnView` | `turn` | The team and `Countdown`, `PromptCard` with the board, and an "End turn early" button |
| `ReviewView` | `review` | `Review`, each answer Got it or Missed |
| `SettingsView` | setup | `Section` and `Stepper` for the answers on the board |

**Why:** each phase needs a view (ADR 0005), and a game replaces a format view only when the default can't say what it needs. The format's handoff says "Pass the phone to Lions", which is exactly wrong here.

### Who judges

`judgeOf(teams, current)` is the next team in playing order, and the last team is judged by the first. Each round, every team judges exactly once.

### Review's words

The `Review` primitive said "Tap a card…" and "Cards this turn": Charades' words, written into the SDK. It now takes `noun` (`{ one: 'card', many: 'cards' }` by default), and Name Ten passes answers. This is the kind of thing only a second game finds; it's added to ADR 0012's list of SDK changes.

### How to verify

`pnpm test src/games/name-ten src/sdk/interactions`: tests 366–370, and test 269 now checks Charades still says "cards".

---

## Step 7: The game, registered

**What:**

- `src/games/name-ten/rules.md`.
- `src/games/name-ten/index.ts`: `defineGame` with meta, content, settings and presets (Quick, Classic), rules, the machine and views.
- One line in `src/app/registry/index.ts`.
- The `list-checks` icon in `src/app/library/gameIcon.ts`.

**Why:** a game reaches players through the registry. Setup, saving, resuming, the rules page and the theme all work for it without changes.

### The surprise: a registry of different games

Adding the second game to the registry broke type checking in the app, not in Name Ten. `findGame` now returned "Charades or Name Ten". So when `PlayPage` called `choosePoolItems(game.content.packs, config, game.content.itemKey)`, TypeScript couldn't tell that the packs and the item key came from the *same* game: Charades' packs with Name Ten's key would be wrong. With one game, that question never came up.

TypeScript has no way to say "some types, the same ones throughout" for a list of different games. The fix is to forget each game's types at the registry, the one place games are listed:

```ts
export type AnyGame = Game<any, any, any, any, any, any, any, any>
export const games: readonly AnyGame[] = [charades, nameTen]
```

Nothing is lost where it matters. `defineGame` checks each game fully where it's written, and the app only ever handles a game as a whole: its packs with its key, its machine with its views, its save with its schema. It's the one `any` in the codebase, with a comment saying why.

We first tried a typed wrapper component around `PlayPage`'s game (the way `SetupScreen` is generic). It fixed one page and broke the next: every place that used a game from the registry had the same problem.

### How to verify

- `pnpm test`: tests 371–373.
- On a phone: the library lists Charades and Name Ten. Play a turn of Name Ten: setup, the judge's handoff, the board, End turn early, review, the summary.
