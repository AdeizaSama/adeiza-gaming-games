# The Game Standard

The contract every game, content pack and theme in Ku Zo Wasa follows. If you're adding a game, read all of it. If you're adding content or a theme, read [Content packs](#10-content-packs) or [Themes](#11-themes) and [CONTRIBUTING.md](../CONTRIBUTING.md).

> **Status:** the standard is settled; the code that implements it is being built now. The tooling that enforces it (CI, lint rules, content validation) is part of that work. Where this document and the code disagree, open an issue.

Changes to this standard, the SDK (`src/sdk/`) or the content pack format need a decision record in [`docs/decisions/`](decisions/README.md) (context, decision, consequences). These are the contracts every contributor builds on.

---

## 1. Three levels: Format → Game → Variant

| Level | What it decides | Example | Who makes one |
|---|---|---|---|
| **Format** | The outer loop: how turns, rounds and scoring flow ([§7](#7-formats)) | `team-turns`, `host-led` | Core maintainers, rarely |
| **Game** | What happens inside a turn: interaction, events, scoring rules, content shape | Charades, Name Ten, Trivia Night | Developers |
| **Variant** | Settings + content only. Same rules. | "Anime Charades, 90-second turns" | Anyone, no code |

A format is the outer loop, a game fills in the turn, and a variant fills in the settings and content. Name Ten is not a Charades variant: its turn is different, so it's a separate game in the same format. In code and docs, say **Game** (`defineGame`).

## 2. Anatomy of a game

A game is three separable things:

| Part | What it is | Who edits it | Written in |
|---|---|---|---|
| **Machine** | The game's flow: a declarative phase graph plus typed guards and actions | Developers | TypeScript, no React |
| **Content** | Items the machine consumes (terms, categories, questions, roles) | Anyone | JSON content packs, validated by a zod schema |
| **Views** | How each phase looks, built from shared interaction primitives | Developers and designers | React, themed by tokens |

**Why a hybrid machine.** The phase graph is declarative: phases, the events each accepts, and where they lead. The conditions and effects are **named, typed TypeScript functions** (guards and actions) defined by each game, not JSON condition objects. A JSON condition language can't express real rules (trivia steals, Mafia night resolution, "mafia ≥ town") without turning into an untyped programming language with a central interpreter that every new game has to edit. The result: the flow stays readable at a glance and can be drawn as a diagram, while the logic stays type-checked and lives with its game.

The runner is a small state-machine runner in `src/sdk/machine/`. It uses the same concepts as XState (states, events, transitions, guards, actions) but is not XState.

## 3. Game definition

Every game exports exactly one definition from `src/games/<id>/index.ts`:

```ts
export default defineGame({
  meta: {
    id: "charades",                 // kebab-case, permanent
    name: "Charades",
    tagline: "Act it out. Beat the clock.",
    icon: "drama",                   // icon name from the shared icon set
    format: "team-turns",            // §7
    players: { min: 2, max: 20 },
    complexity: 1,                   // 1–5
    tags: ["party", "acting"],
    contributors: ["AdeizaSama"],    // GitHub handles of the game's creators
  },
  content: {
    itemSchema,                      // zod schema for ONE content item, from ./schema.ts
    itemKey,                         // (item) => item.text, from ./schema.ts: what makes two items the same
    packs: loadPacks(                // checks every pack (§10) and returns them sorted by id
      import.meta.glob("./content/*.json", { eager: true, import: "default" }),
      itemSchema,
      itemKey,
    ),
  },
  config: {
    schema: CharadesConfig,          // zod schema for setup options, defaults included (§7)
    presets: [                       // named variants (optional)
      {
        id: "anime-90",
        name: "Anime Charades, 90-second turns",
        contributors: ["AdeizaSama"],  // GitHub handles of the variant's creators
        config: { seconds: 90 },       // settings that differ from the defaults; never teams
        packs: ["anime"],              // content pack ids
      },
    ],
  },
  machine,                           // ./machine.ts
});
```

`defineGame` is in `src/sdk/game/`. Besides type-checking, it checks what types can't, and throws one error listing every problem: `meta` (kebab-case id, complexity 1–5, `players.max` ≥ `players.min`, at least one contributor), at least one pack, and each preset (unique id, contributors, packs that exist, settings that pass the config schema). A game's tests import it, so a broken game fails CI.

**Defaults live in the config schema** (zod's `.default()`), not in a separate list, so they can't drift apart. A game that wants different defaults from the format's extends its schema.

> **Being built:** two more fields are added as their parts are built, each required from then on: `views` (one per phase, from `./views/`) and `rules` (`./rules.md`, player-facing rules).

**Contributors.** Credit is recorded at both levels, as a list of GitHub handles:

- `meta.contributors`: who created the game (its rules, machine and views).
- `presets[].contributors`: who created that variant.

Both are required and must have at least one handle. Add yourself when you make a substantial change; don't remove anyone. Content packs use the same `contributors` field for the people who wrote them ([§10](#10-content-packs)).

## 4. Machine contract

Vocabulary:

| Term | Meaning | Example |
|---|---|---|
| **Context** | The game's data (serializable JSON) | scores, current team, round, remaining items |
| **Phase** | Which step the game is in; one phase = one view | `handoff`, `turn`, `turn_summary` |
| **Event** | Something that happened, sent by a view | `got`, `skip`, `time_up`, `next` |
| **Transition** | What an event does in a given phase: run actions, maybe move to another phase | `time_up` in `turn` → `turn_summary` |
| **Guard** | A named yes/no question about context, used to pick a transition | `turnsRemaining`, `mafiaOutnumberTown` |
| **Action** | A named function that returns updated context | `markGot`, `advanceTeam` |

Shape (`defineMachine` is in `src/sdk/machine/`; what `input` contains is set by the game's format). A small dice game, played until the score reaches a target:

```ts
export const machine = defineMachine<DiceContext, DiceEvent, { target: number }>()({
  initial: "playing",
  context: ({ input }) => ({ score: 0, target: input.target }),
  phases: {
    playing: {
      interaction: "prompt_card",
      on: {
        roll:  [{ when: "reachedTarget", to: "done" }, { actions: ["rollDie"] }],
        reset: { actions: ["resetScore"] },
      },
    },
    done: { interaction: "leaderboard", final: true },
  },
  guards:  { reachedTarget: ({ context }) => context.score >= context.target },
  actions: {
    rollDie:    ({ context, rng }) => ({ ...context, score: context.score + rng.int(1, 6) }),
    resetScore: ({ context }) => ({ ...context, score: 0 }),
  },
});
```

**Games in a format don't write the whole machine.** A team-turns game passes only its turn to `teamTurns`, which adds the format's phases, guards and actions and returns a machine like this one ([§7](#7-formats)). Everything in this section applies to the result.

You write the context, event and input types. The phase, guard and action names are worked out from the keys of `phases`, `guards` and `actions`, so they're never listed twice. (The two sets of brackets, `defineMachine<…>()({ … })`, are how TypeScript lets you give some types and have it work out the rest.)

Rules:

- **Guards and actions are deterministic.** Given the same context, event, `rng` state and `now`, they always give the same result. No React, DOM, `Math.random`, `Date.now`, `localStorage`, or I/O. Randomness (`rng`) and time (`now`) are passed in by the runner. This makes every game repeatable and testable.
  - **Guards** only read. They never draw from `rng`.
  - **Actions** return a new context and never change the one they're given. Drawing from `rng` is the one allowed side effect: it moves the random sequence forward, and the runner saves where it is.
  - The `Rng` (`src/sdk/rng.ts`) offers `next()` (0 to 1), `int(min, max)` (inclusive) and `shuffle(items)` (returns a shuffled copy); it is seeded, so the same seed always gives the same draws.
- **Context is serializable** (plain JSON). The app saves `{ phase, context, rngState }` so a refresh or accidental back-swipe resumes the game, with the same random draws it would have had.
- **Events are a discriminated union** (`{ type: "got" } | { type: "skip" } | …`). Views send events; they never change context directly.
- **Guarded transitions are checked in order;** the first match wins, and a transition with no `when` is the fallback. A transition's actions run in the order listed, each getting the context the previous one returned.
- **Events a phase doesn't list are ignored.** So is an event whose transitions all have failing guards. The state stays exactly as it was.
- **Guard and action names are type-checked** against the `guards` and `actions` objects. A typo is a compile error, not a runtime surprise.
- **Timers:** an action stores `turnEndsAt` in context; the view shows the countdown and sends `time_up`. The machine decides what that means.
- **Final phases** (`final: true`) end the game; the app reads the result from context. A final phase can't list events (it's a type error), and every event after the game ends is ignored.
- **Running a machine:** `start(machine, { input, seed })` gives the starting state; `send(machine, state, event, { now })` returns the next state without changing the one passed in; `isFinal(machine, state)` says whether the game has ended. All three are in `src/sdk/machine/runner.ts`. In the app, `useGameSession(machine, input)` (`src/sdk/game/`) wraps them for React: it picks a random seed for each new game and passes `Date.now()` with each event, the only place either is read.
- **`validateMachine(machine)`** (`src/sdk/machine/validateMachine.ts`) finds mistakes TypeScript can't, such as a transition placed after the fallback, where it can never run. It returns a list of problems; every game's tests check that the list is empty.
- Each guard and action stays small and does one thing. Complex rules (e.g. Mafia night resolution) are a composition of small named actions, not one big function.

## 5. Phases

A phase is a named step that maps to one view. Shared vocabulary (use these names where they fit, and add game-specific phases when needed):

| Phase | Purpose |
|---|---|
| `setup` | Teams/players, config, pack selection. Provided by the app. |
| `handoff` | "Pass the phone to Team B." A privacy gate between turns. Critical on a single device. |
| `turn` | Active play. |
| `turn_summary` | What happened this turn, with corrections (e.g. undo a mis-tap). |
| `round_summary` | Optional standings between rounds. |
| `results` | Final scores and winner. Play again or back to library. |

## 6. Interaction primitives

Views are composed from shared primitives in `src/sdk/interactions/`. A game may build custom UI only when no primitive fits, and must say why in its pull request.

A primitive takes plain props (text, callbacks) and knows nothing about machines; a view connects it to a game ([ADR 0005](decisions/0005-views.md)). Primitives are built when the first game needs them.

| Primitive | Used for | Status |
|---|---|---|
| `Instruction` | Rules or a step explanation with a continue action | Planned |
| `Handoff` | Pass-the-device screen; hides the previous turn's secret info | Built |
| `FlashCard` | Big term with got/skip (charades) | Built |
| `PromptCard` | Category or prompt with a counter (name ten) | Planned |
| `MultipleChoice` | Question, options, reveal (trivia) | Planned |
| `Countdown` | Shared timer display with warnings; reports when time is up (it reads the clock only to show it) | Built |
| `Summary` | Turn/round recap with editable results | Planned |
| `Leaderboard` | Team/player standings | Planned |
| `SecretReveal` | One-player-at-a-time private reveal (future: Mafia roles) | Planned |
| `Vote` | Pick a player or option (future: Mafia) | Planned |

## 7. Formats

A format is the outer loop shared by several games: setup, turn order, rounds, scoring, ending. A game picks one format and fills in what happens inside a turn. Formats live in `src/sdk/formats/` and provide shared phases, context, guards, actions and views. A game may **add** phases (e.g. Trivia's `steal`) but must not change the format's loop. If it needs to, it belongs in a different format.

| Format | Shape | Games |
|---|---|---|
| `team-turns` | Teams take timed turns over N rounds; each turn uses items from the pool; points per turn | Charades, Name Ten, Trivia Night |
| `host-led` | One device held by a host; secret roles; cyclic phases with eliminations and win conditions | Mafia/Werewolf. Built after the team-turns games. |

**team-turns: what the format provides**

| Area | Provided |
|---|---|
| Setup | `TeamTurnsConfig` (`src/sdk/formats/team-turns/config.ts`): team names (2–10, in playing order), rounds (1–10, default 3), seconds per turn (10–300, default 60), packs, and tags (default: none, which plays every item). Games extend it with their own settings. Shown on one shared setup screen. |
| Phases | `handoff → turn → turn_summary → results`, including the loop and the end. `turn` is the game's. An optional `round_summary` is added when a game needs it. |
| Context | `TeamTurnsContext`: `config` (the settings), `scores`, `current` (whose turn), `round`, `turnEndsAt`, `pool`, `item` (the card on screen), and `turn` (the game's record of the current turn) |
| Item pool | The chosen packs' items, each item once (an item in two packs is kept from the first pack chosen), filtered to the chosen tags if any. Drawn in a shuffled order without repeats. When every item has been drawn, they're shuffled back in and drawing continues, with the item just shown placed last. |
| Guards/actions | `turnsRemaining`; `startTurn` (fresh turn record and timer), `drawItem`, `bankPoints` (adds the turn's points to the team's score), `advanceTeam`. A game's turn may use them, usually `drawItem`. |
| Views | Handoff, editable turn summary, leaderboard, results (being built) |

**team-turns: how a game plugs in** ([ADR 0004](decisions/0004-team-turns-builder.md)). A game passes its turn to `teamTurns` (`src/sdk/formats/team-turns/teamTurns.ts`), which returns the whole machine:

```ts
export const machine = teamTurns<CharadesItem, CharadesTurn, CharadesEvent>()({
  newTurn: () => ({ got: [], skipped: [] }),   // the game's record of one turn, fresh each turn
  points: (turn) => turn.got.length,           // what a turn's record is worth
  phases: {
    turn: {
      interaction: "flash_card",
      on: {
        got:     { actions: ["markGot", "drawItem"] },
        skip:    { actions: ["markSkipped", "drawItem"] },
        time_up: { to: "turn_summary" },
      },
    },
  },
  guards:  {},
  actions: { markGot: …, markSkipped: … },
});
```

- The game lists only its own events; `teamTurns` adds `start`, `time_up` and `next`.
- `phases` must include `turn`, which `handoff` starts. A game may add phases (Trivia's `steal`). Its transitions go only to its own phases or to `turn_summary`; a game phase can't be final.
- The game handles `time_up` in its turn, because what running out of time means depends on the game.
- **Points come from the turn record.** The format adds `points(turn)` to the team's score when players leave `turn_summary`, so a correction on the summary changes the score.
- A phase, guard or action with the same name as one of the format's is a type error.
- The game's items come from `choosePoolItems(packs, config, itemKey)` (`pool.ts`), run once when a game starts; the machine is started with `{ config, items }`, and refuses to start with no items.

**team-turns: what each game fills in**

| | Charades | Name Ten | Trivia Night |
|---|---|---|---|
| Turn interaction | FlashCard | PromptCard + counter | MultipleChoice |
| Items per turn | Many, until time runs out | One category | One question |
| Events | `got`, `skip` | `count_up`, `count_down`, `done` | `answer(option)` |
| Scoring | +1 per got (×2 if acted), optional skip penalty | Points = count reached | +N if correct |
| Extra config | Modes (describe/act/sing), punish skips | Target count (default 10) | Difficulty, steals on/off |
| Extra phases | None | None | `steal` after a wrong answer |

**A proposed game that fits no existing format is deferred**, not shoehorned. Open an issue describing it, and it becomes the evidence for the next format.

## 8. v1 games

These four are the whole v1 scope, built in this order:

| # | Game | Format | Content item | Turn interaction | Notes |
|---|---|---|---|---|---|
| 1 | Charades | team-turns | `{ text, tags[], modes[] }` | FlashCard | Modes: describe / act / sing |
| 2 | Name Ten | team-turns | `{ category, tags[] }` | PromptCard + counter | |
| 3 | Trivia Night | team-turns | `{ question, options[], answer, difficulty }` | MultipleChoice | Steals need a format extension |
| 4 | Mafia | host-led | roles + theme skins | SecretReveal, Vote | Needs the host-led format first |

Out of scope for v1: multiplayer or multi-device play; accounts, backends or any collection of personal data; image or media content.

## 9. Repo layout

```
src/
  app/                 app shell: routing, library page, setup flow, persistence
    registry/          the list of games; the only part of app/ that imports games
  sdk/                 defineGame (game/), machine runner (machine/), Rng, content packs (content/), formats (formats/<format>/)
    interactions/      shared phase primitives (§6)
  ui/                  low-level components (button, dialog, …). Only what's used.
  games/
    <id>/
      index.ts         the single defineGame export
      machine.ts       phase graph + guards + actions
      machine.test.ts  required
      schema.ts        itemSchema + itemKey (§10), config schema; imports zod and sdk/ only
      views/           phase views
      content/*.json   content packs
      rules.md         player-facing rules
      README.md        for contributors: what the game is, content guidelines
  themes/*.json        visual themes (§11)
schemas/               JSON Schemas generated from the zod schemas (§10)
scripts/               validate-content, generate JSON Schemas
docs/decisions/        decision records
.github/               CI, PR template, issue templates, CODEOWNERS
```

**Boundaries** (enforced by `pnpm lint`; anything not listed is an error):

| Folder | May import from |
|---|---|
| `games/<id>/` | its own folder, `sdk/`, `ui/`. A game never imports another game. |
| `games/<id>/schema.ts` | `sdk/` and zod only. Scripts load it on its own, so it never imports the rest of its game or React. |
| `sdk/` | `sdk/`, `ui/`. Never `games/` or `app/`. |
| `ui/` | `ui/` only. |
| `app/` | `app/`, `app/registry/`, `sdk/`, `ui/`. Never a game directly. |
| `app/registry/` | `games/`, `sdk/`. |
| `scripts/` (outside `src/`) | `scripts/`, `sdk/`, and `games/<id>/schema.ts`. Never a game's other files or `app/`. |

Packages from npm (React, zod, …) are allowed everywhere, except React in `schema.ts`.

## 10. Content packs

One file per pack: `src/games/<id>/content/<pack-id>.json`.

```json
{
  "$schema": "../../../../schemas/charades.pack.schema.json",
  "id": "anime",
  "name": "Anime",
  "description": "Characters, places and moves from popular anime.",
  "language": "en",
  "maturity": "everyone",
  "contributors": ["github-handle"],
  "items": [
    { "text": "Goku", "tags": ["character"], "modes": ["describe"] }
  ]
}
```

**Pack fields** are the same for every game; `items` follow the game's `itemSchema`. Decided in [ADR 0003](decisions/0003-content-packs.md).

| Field | Rule |
|---|---|
| `$schema` | Optional. If present, `../../../../schemas/<game>.pack.schema.json`, so editors can help (see below). |
| `id` | kebab-case, and equal to the file name: `anime.json` has `"id": "anime"`. This also keeps ids unique within a game. |
| `name`, `description` | Not blank. Shown to players. |
| `language` | The language players read the pack in, as a code: `en`, `en-NG`, `pt-BR`, `yo`, `zh-Hans`. |
| `maturity` | `everyone`, `teen` or `adult`. The library filters by it. |
| `contributors` | At least one GitHub username, without `@`. |
| `items` | At least one. |

- **Unknown fields are errors**, in packs and (for v1 games) in items, so a misspelled field name is reported instead of ignored. This is about field names only; item text can be in any language or script.
- **Item tags** use the SDK's `Tag` format (kebab-case: `snack`, `tv-show`), the same in every game.

**What each game provides.** A game's `schema.ts` exports `itemSchema` (the zod schema for one item) and `itemKey`, a function from an item to the text that identifies it (`(item) => item.text` for Charades). It imports only zod and `sdk/`, because scripts load it on its own (§9).

**Duplicates.** Two items are the same when their keys match, ignoring case and extra spaces, and treating the two ways of typing an accented letter as one. Accents themselves count: `ọkọ` and `oko` are different items.

- The same item twice **in one pack** is an error.
- The same item **in two packs** is fine. If players pick both, the game uses it once, from the pack listed first.

**Checks.** `checkPack` in `sdk/content/` is the one definition of a valid pack: the schema, then `id` against the file name, then duplicates.

- The app loads a game's packs with `loadPacks`, which uses `checkPack` and throws if any pack has problems.
- `pnpm validate-content` (a required CI check, §12) also checks each file is valid JSON and that its `$schema` path is right, then uses `checkPack`. It lists every problem in plain words with the item it's in, e.g. `items.3 ("Goku"): "text" is missing`.

**JSON Schemas for editors** are **generated** from the zod schemas into `schemas/<game>.pack.schema.json` with `pnpm generate-schemas`, so editors autocomplete, explain fields on hover and underline mistakes while you type, and so a future content editor can render forms from them. They are committed; a test fails if they are out of date. A few rules only run in CI because JSON Schema can't express them: text made only of spaces, `id` matching the file name, and duplicates.

**Policy and licence.**

- Content policy: no private individuals, no hate content. Text only in v1, no images or media.
- Content packs are licensed CC BY 4.0.

**Content editor (planned):** a git-backed editor on top of these same files, so non-coders can review and edit content in a form while every change is still a reviewed pull request. The pack format must keep this possible: flat JSON, one pack per file, schema-described.

## 11. Themes

`src/themes/<id>.json` holds design tokens only (colors for light/dark, fonts, radius, motion). The app maps them to CSS variables; components use variables, never raw colors.

**The tokens** (one default theme, in `src/app/index.css`, until theme files land):

| Token | Used for |
|---|---|
| `background`, `foreground` | The page, and text on it |
| `card`, `card-foreground` | Raised surfaces such as the item card |
| `primary`, `primary-foreground` | The main action on a screen |
| `secondary`, `secondary-foreground` | Other actions |
| `muted`, `muted-foreground` | Quiet backgrounds, secondary text |
| `success`, `warning`, `destructive` (each with `-foreground`) | Got it, time running out, skip or quit |
| `border`, `input`, `ring` | Borders, form fields, the keyboard focus outline |
| `radius` | Corner rounding (`rounded-sm` to `rounded-xl` scale from it) |
| `font-body` | The font |
| `duration` | How long transitions take |

Every color has a light and a dark value; dark mode follows the phone's setting. Tailwind's built-in palette is switched off, so classes like `bg-red-500` produce nothing; a test fails if any file uses one. A theme pull request touches one JSON file plus an optional font import. Game-specific skins (e.g. Mafia's werewolf names) are **content**, not themes.

## 12. Engineering rules

**Checks on every pull request (all required):** typecheck · lint · test · validate-content · build. The pull request template's checklist names the same checks; a pull request that adds or changes a check updates the template too.

- `main` is protected. All changes via pull request. Pull requests are squash-merged by default. A pull request whose commits are each meaningful on their own and follow Conventional Commits (such as a tutorial chapter, one commit per step) is merged with a merge commit instead, which keeps its commits and their IDs and marks where the pull request begins and ends. Rebase merging is not used: it rewrites every commit with a new ID.
- [Conventional Commits](https://www.conventionalcommits.org/) (`feat(charades): …`, `content(charades): …`, `fix(sdk): …`).
- TypeScript `strict`. No `any` without a comment explaining why.
- Every machine has a test that plays a full game from the initial phase to a final phase with a fixed seed, a test that `validateMachine(machine)` returns no problems, and tests for each guard and action.
- A new runtime dependency must be justified in the pull request description. Prefer none.
- Changes to `sdk/` or the content pack format need a decision record in `docs/decisions/`.
- Mobile-first: works one-handed on a 360px-wide phone, tap targets ≥ 44px, respects `prefers-reduced-motion`, readable at arm's length.
- No `TODO` without a linked issue.
- No secrets. The site is fully static and needs no environment variables to build or run. Never commit `.env*` files.

## 13. Definition of Done (per game)

- [ ] Fits an existing format, or is explicitly deferred
- [ ] `defineGame` export with meta, content, config schema (defaults included) and presets, rules, machine, views
- [ ] Guards and actions are deterministic; full-playthrough test, `validateMachine` test, and per-guard and per-action tests
- [ ] At least one content pack passing validation
- [ ] Views use interaction primitives (custom UI justified)
- [ ] Works through setup → turns → results on a phone, including resume after refresh
- [ ] Looks right under every shipped theme, light and dark
- [ ] `README.md` for the game: rules summary, content guidelines, how to add a pack
