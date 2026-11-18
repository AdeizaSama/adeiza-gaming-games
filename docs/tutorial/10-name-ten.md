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

`deal` shuffles the answers with the machine's random numbers (`rng.shuffle`, the same shuffle the format uses for its item pool), not `Math.random`, then takes the first `shown`. So the same seed always deals the same board, and a resumed game shows the same answers. A category with fewer answers than the setting puts all of them on the board: test 353 found that, because most Back to School categories have 12 answers and a board can be set to 15.

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

---

## Step 8: Docs, and what a contributor would have hit

**What:**

- `src/games/name-ten/README.md`: the rules in short, content guidelines and the files.
- CONTRIBUTING §3 gets the step-by-step guide it promised in chapter 00.
- The Game Standard's §7 and §8 tables match both games as built.
- The README lists Name Ten as complete.

**Why:** the point of a second game was to learn whether someone else could add one. The guide is written from what this chapter ran into.

### What a contributor would have run into

We kept a log, through the chapter, of every point where the public docs didn't answer a question:

| Where | What happened | Now |
|---|---|---|
| CONTRIBUTING §3 | Still said step-by-step instructions "will be added once Charades is complete" | An 11-step guide, in the order that works, with Name Ten as the starter folder |
| Tests | No guide for a game's tests; we copied Charades' | Step 5 of the guide: what tests a game needs, and how an action is called |
| Shared screens | `Review` said "cards"; the format's handoff assumed the team playing holds the phone | `Review` takes `noun`; `Handoff` takes `lead` (ADR 0012); the guide says when to change the SDK |
| The registry | Adding a second game broke type checking in the app | `AnyGame` in the registry (step 7); a contributor only adds a line to the list |
| Easy | The content check and schema generator found the game by its folder; `defineGame` listed every problem at once; the setup, save, rules and theme code needed no changes | |

The standard's tables were stale too: Charades' column still described the chapter 04 rules (×2 for acting, "punish skips", no extra phases), and Name Ten's described a counter instead of a board.

### The Definition of Done

| Item | Where it's met |
|---|---|
| Fits an existing format | `team-turns` |
| `defineGame` with meta, content, config and presets, rules, machine, views | `src/games/name-ten/index.ts` |
| Deterministic; full game, `validateMachine`, per-guard and per-action tests | `machine.test.ts` (tests 352–362) |
| A valid content pack | Back to School, 38 categories |
| Views use primitives | `Handoff`, `Countdown`, `PromptCard`, `Review`, `Stepper` |
| Setup → turns → results on a phone, with resume | Screen test 373; by hand on a phone (below) |
| Looks right under every shipped theme | By hand (below) |
| README | `src/games/name-ten/README.md` |

By hand, on a phone (`pnpm dev --host`):

1. Play Name Ten to the results, with the judge passing the phone each turn. Refresh in the middle of a turn and in review.
2. Look at the board in all five themes.

---

## Chapter summary

Name Ten is the second game, and the first test of the SDK by a game it wasn't built for.

| Step | What | Contract |
|---|---|---|
| 1 | ADR 0012: an answer board and a judge | Yes |
| 2 | The item schema and the Back to School pack | Yes: Name Ten's content |
| 3 | Settings: answers on the board | |
| 4 | The machine: dealing, ticking, review, scoring | |
| 5 | `PromptCard`; `Handoff`'s `lead` | Yes: SDK |
| 6 | Views; `Review`'s `noun` | Yes: SDK |
| 7 | The game definition and registry; `AnyGame` | |
| 8 | README, CONTRIBUTING's guide, the standard | |

**What we learned:**

- A second user finds what the first one hid. Charades' words were written into a shared screen, the handoff assumed who holds the phone, and the registry only typed correctly with one game.
- Fix the type problem where it starts. Wrapping one page in a generic component moved the error to the next page; forgetting game types once, at the registry, fixed every page.
- A test for a board's size found a real case: most categories have 12 answers, so a board set to 15 shows all 12.

**Tests:** 373 runtime tests and 32 compile-time checks.

---

## Step 9: A board that fits the screen

**What:** [ADR 0013](../decisions/0013-fit-the-screen-and-standings.md), first half. The play screen is exactly the phone's height; `PromptCard`'s board is two columns of tiles that fill what's left.

**Why:** played on a phone, the board scrolled. Ten full-width rows of at least 44px each, plus the timer, category and End button, is about 760px, and a judge scrolling mid-turn misses answers.

### A known height to fill

`GameScreen` was `min-h-dvh`: at least the screen's height, growing with its content. A view had nothing to fill, only room to grow. It's now `h-dvh`, with the views in a play area (`flex-1 min-h-0 overflow-y-auto`) under the quit bar. A view can now fill exactly the space left, and a taller view (a long review) scrolls inside the area.

`min-h-0` matters at every level: a flex child won't shrink below its content's height without it, so the board would push the page taller instead of fitting.

### Two columns that share the height

```tsx
<ul className="grid min-h-0 flex-1 auto-rows-[minmax(2.75rem,1fr)] grid-cols-2 gap-2 overflow-y-auto">
```

Every row gets an equal share of the height left (`1fr`) but never less than 44px (`2.75rem`), the smallest tap target the standard allows. Ten answers are five rows, fifteen are eight. On a tall phone the tiles grow; on a small one they stay at 44px, and only then does the board scroll. The category card got smaller to leave the board more room.

### How to verify

- `pnpm test`: tests 374–375.
- On a phone: a Name Ten turn shows all ten answers without scrolling.

---

## Step 10: Standings after every turn

**What:** [ADR 0013](../decisions/0013-fit-the-screen-and-standings.md), second half. `Summary` takes `standings`; the format's turn summary passes every team's score so far and the rounds it has played.

**Why:** after review, the summary said "Lions scored 4 points" and nothing about the game. Now it also shows:

```
Lions     13   ● ○ ○
Eagles     0   ○ ○ ○
```

The turn summary is the format's, so Charades gets the same standings.

### Two details

- **This turn counts.** The format adds a turn's points to the team's score when players leave the summary (chapter 03), but showing the old score next to "scored 4 points" would read as a mistake. `standingsOf` adds the turn's points for the team that just played.
- **Rounds played.** Teams play in order, so in round 2 the team that just played, and everyone before it, has played 2 rounds; everyone after has played 1. The dots use the theme's `border-line` for their outline (a fixed `border-2` failed chapter 08's test, which is the test doing its job).

Each row of dots has a screen-reader label, "1 of 3 rounds played"; the team that just played is marked with `aria-current`.

### How to verify

- `pnpm test`: tests 376–377, and test 373 now checks Name Ten's summary shows both teams.
- On a phone: after a turn's review, the summary lists every team with dots for the rounds played.

---

## Step 11: A phase before the turn

**What:** [ADR 0014](../decisions/0014-a-phase-before-the-turn.md). `teamTurns` takes an optional `beforeTurn`, and the format's `startTurn` splits into `resetTurn` and `startTimer`.

**Why:** Name Ten lets a team skip a category before its minute starts. That's a screen between the handoff and the turn, which the format didn't allow: Start went straight into the turn and started the clock in one step.

### What changes

```ts
// The handoff's Start, as the format writes it:
start: beforeTurn
  ? { to: beforeTurn, actions: ['resetTurn', 'drawItem', ...onStart] }
  : { to: 'turn', actions: ['resetTurn', 'startTimer', 'drawItem', ...onStart] },
```

With no `beforeTurn` it's the same as before, so Charades doesn't change. With one, the first item is drawn but the clock doesn't start; the game's phase runs `startTimer` on its way into `turn`.

### A turn that could never end

Forgetting `startTimer` in a pre-turn phase would make a turn with no end: no error, just a game stuck at a party. So `teamTurns` checks the phase when the machine is built, and throws if any transition to `turn` leaves it out (test 380). It's the same idea as `defineGame` refusing a phase without a view: mistakes fail the game's own tests, not players.

### Saves

Only phase names and the context are saved, never action names. Renaming `startTurn` and adding `beforeTurn` changes neither for Charades, so saved games are unaffected and `saveVersion` stays at 2.

### How to verify

`pnpm test src/sdk/formats`: tests 145 and 378–380, and compile-time check C33.
