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
    itemSchema: CharadesItem,        // zod schema for ONE content item
    packs: loadPacks(import.meta.glob("./content/*.json", { eager: true })),
  },
  config: {
    schema: CharadesConfig,          // zod schema for setup options
    defaults: { rounds: 3, seconds: 60, /* … */ },
    presets: [                       // named variants
      {
        id: "anime-90",
        name: "Anime Charades, 90-second turns",
        contributors: ["AdeizaSama"],  // GitHub handles of the variant's creators
        config: { seconds: 90 },       // overrides on top of defaults
        packs: ["anime"],              // content pack ids
      },
    ],
  },
  rules: rulesMarkdown,              // ./rules.md
  machine,                           // ./machine.ts
  views,                             // ./views/* — one per phase
});
```

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
| **Guard** | A named yes/no question about context, used to pick a transition | `roundsRemaining`, `mafiaOutnumberTown` |
| **Action** | A named function that returns updated context | `scorePoint`, `advanceTeam` |

Shape (`defineMachine` is in `src/sdk/machine/`; what `input` contains is set by the game's format):

```ts
export const machine = defineMachine<CharadesContext, CharadesEvent, CharadesInput>()({
  initial: "handoff",
  context: ({ input, rng }) => ({ /* starting context */ }),
  phases: {
    handoff: {
      interaction: "handoff",
      on: { start: { to: "turn", actions: ["drawItem", "startTimer"] } },
    },
    turn: {
      interaction: "flash_card",
      on: {
        got:     { actions: ["scorePoint", "drawItem"] },
        skip:    { actions: ["applySkipPenalty", "drawItem"] },
        time_up: { to: "turn_summary" },
      },
    },
    turn_summary: {
      interaction: "summary",
      on: {
        next: [
          { when: "roundsRemaining", to: "handoff", actions: ["advanceTeam"] },
          { to: "results" },
        ],
      },
    },
    results: { interaction: "leaderboard", final: true },
  },
  guards:  { roundsRemaining: ({ context }) => context.round < context.config.rounds },
  actions: { scorePoint: ({ context }) => ({ ...context, /* … */ }) },
});
```

You write the context, event and input types. The phase, guard and action names are worked out from the keys of `phases`, `guards` and `actions`, so they're never listed twice. (The two sets of brackets, `defineMachine<…>()({ … })`, are how TypeScript lets you give some types and have it work out the rest.)

Rules:

- **Guards and actions are deterministic.** Given the same context, event, `rng` state and `now`, they always give the same result. No React, DOM, `Math.random`, `Date.now`, `localStorage`, or I/O. Randomness (`rng`) and time (`now`) are passed in by the runner. This makes every game repeatable and testable.
  - **Guards** only read. They never draw from `rng`.
  - **Actions** return a new context and never change the one they're given. Drawing from `rng` is the one allowed side effect: it moves the random sequence forward, and the runner saves where it is.
  - The `Rng` (`src/sdk/rng.ts`) offers `next()` (0 to 1), `int(min, max)` (inclusive) and `shuffle(items)` (returns a shuffled copy); it is seeded, so the same seed always gives the same draws.
- **Context is serializable** (plain JSON). The app saves `{ phase, context, rngState }` so a refresh or accidental back-swipe resumes the game, with the same random draws it would have had.
- **Events are a discriminated union** (`{ type: "got" } | { type: "skip" } | …`). Views send events; they never change context directly.
- **Guarded transitions are checked in order;** the first match wins, and a transition with no `when` is the fallback.
- **Guard and action names are type-checked** against the `guards` and `actions` objects. A typo is a compile error, not a runtime surprise.
- **Timers:** an action stores `turnEndsAt` in context; the view shows the countdown and sends `time_up`. The machine decides what that means.
- **Final phases** (`final: true`) end the game; the app reads the result from context.
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

| Primitive | Used for |
|---|---|
| `Instruction` | Rules or a step explanation with a continue action |
| `Handoff` | Pass-the-device screen; hides the previous turn's secret info |
| `FlashCard` | Big term with got/skip (charades) |
| `PromptCard` | Category or prompt with a counter (name ten) |
| `MultipleChoice` | Question, options, reveal (trivia) |
| `Countdown` | Shared timer display with warnings |
| `Summary` | Turn/round recap with editable results |
| `Leaderboard` | Team/player standings |
| `SecretReveal` | One-player-at-a-time private reveal (future: Mafia roles) |
| `Vote` | Pick a player or option (future: Mafia) |

## 7. Formats

A format is the outer loop shared by several games: setup, turn order, rounds, scoring, ending. A game picks one format and fills in what happens inside a turn. Formats live in `src/sdk/formats/` and provide shared phases, context, guards, actions and views. A game may **add** phases (e.g. Trivia's `steal`) but must not change the format's loop. If it needs to, it belongs in a different format.

| Format | Shape | Games |
|---|---|---|
| `team-turns` | Teams take timed turns over N rounds; each turn uses items from the pool; points per turn | Charades, Name Ten, Trivia Night |
| `host-led` | One device held by a host; secret roles; cyclic phases with eliminations and win conditions | Mafia/Werewolf. Built after the team-turns games. |

**team-turns: what the format provides**

| Area | Provided |
|---|---|
| Setup | Team names (2+), rounds, turn timer, pack/tag selection: one shared setup screen |
| Phases | `handoff → turn → turn_summary → (round_summary) → results`, including the loop and the end |
| Context | teams, scores, current team, round, item pool (drawn without repeats), `turnEndsAt` |
| Guards/actions | `roundsRemaining`, `advanceTeam`, `drawItem`, `startTimer`, `addPoints` |
| Views | Handoff, editable turn summary, leaderboard, results |

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
  sdk/                 defineGame, machine runner (machine/), Rng, formats (formats/)
    interactions/      shared phase primitives (§6)
  ui/                  low-level components (button, dialog, …). Only what's used.
  games/
    <id>/
      index.ts         the single defineGame export
      machine.ts       phase graph + guards + actions
      machine.test.ts  required
      schema.ts        item + config zod schemas
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
| `sdk/` | `sdk/`, `ui/`. Never `games/` or `app/`. |
| `ui/` | `ui/` only. |
| `app/` | `app/`, `app/registry/`, `sdk/`, `ui/`. Never a game directly. |
| `app/registry/` | `games/`, `sdk/`. |

Packages from npm (React, zod, …) are allowed everywhere.

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

- Pack-level fields are shared across games. `items` follow the game's `itemSchema`.
- JSON Schemas are **generated** from the zod schemas (`scripts/`) so editors autocomplete and validate while you type, and so a future content editor can render forms from them.
- CI rejects packs that fail the schema or contain duplicate items.
- `maturity`: `everyone` | `teen` | `adult`. The library filters by it.
- Content policy: no private individuals, no hate content. Text only in v1, no images or media.
- Content packs are licensed CC BY 4.0.

**Content editor (planned):** a git-backed editor on top of these same files, so non-coders can review and edit content in a form while every change is still a reviewed pull request. The pack format must keep this possible: flat JSON, one pack per file, schema-described.

## 11. Themes

`src/themes/<id>.json` holds design tokens only (colors for light/dark, fonts, radius, motion). The app maps them to CSS variables; components use variables, never raw colors. A theme pull request touches one JSON file plus an optional font import. Game-specific skins (e.g. Mafia's werewolf names) are **content**, not themes.

## 12. Engineering rules

**Checks on every pull request (all required):** typecheck · lint · test · validate-content · build.

- `main` is protected. All changes via pull request. Pull requests are squash-merged by default; they are rebase-merged only when every commit is meaningful on its own and follows Conventional Commits.
- [Conventional Commits](https://www.conventionalcommits.org/) (`feat(charades): …`, `content(charades): …`, `fix(sdk): …`).
- TypeScript `strict`. No `any` without a comment explaining why.
- Every machine has a test that plays a full game from the initial phase to a final phase with a seeded `Rng`, plus tests for each guard and action.
- A new runtime dependency must be justified in the pull request description. Prefer none.
- Changes to `sdk/` or the content pack format need a decision record in `docs/decisions/`.
- Mobile-first: works one-handed on a 360px-wide phone, tap targets ≥ 44px, respects `prefers-reduced-motion`, readable at arm's length.
- No `TODO` without a linked issue.
- No secrets. The site is fully static and needs no environment variables to build or run. Never commit `.env*` files.

## 13. Definition of Done (per game)

- [ ] Fits an existing format, or is explicitly deferred
- [ ] `defineGame` export with meta, schemas, defaults, rules, machine, views
- [ ] Guards and actions are pure; full-playthrough test plus per-guard and per-action tests
- [ ] At least one content pack passing validation
- [ ] Views use interaction primitives (custom UI justified)
- [ ] Works through setup → turns → results on a phone, including resume after refresh
- [ ] Looks right under every shipped theme, light and dark
- [ ] `README.md` for the game: rules summary, content guidelines, how to add a pack
