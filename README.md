# Wasa Games

**Party games for one phone.**

An open-source library of **single-device party games**: charades, name ten, trivia, mafia and more. Pass one phone around the room, or let one person host. No accounts, no app install, no setup beyond picking teams.

The library is built to be extended. Developers can add games, designers can add themes, and anyone can add or improve the words, categories and questions the games use.

> **Status: early development.** The game standard below is settled; the code is being built now. Expect breaking changes until the first release.

---

## Games

| Game | Format | Status |
|---|---|---|
| Charades | team-turns | In progress |
| Name Ten | team-turns | Planned |
| Trivia Night | team-turns | Planned |
| Mafia | host-led | Planned |

## Principles

- **One device.** Every game is playable with a single phone or tablet, passed around or held by a host.
- **No accounts, no tracking.** The library is a static site. It collects no personal data, and game progress is saved only on your device.
- **Content is data.** Words, categories, questions and themes are plain JSON. Contributing them never requires writing code.
- **Games are isolated.** Each game lives in its own folder and only depends on the shared SDK, never on another game.

---

## How games are structured

### Format → Game → Variant

| Level | What it decides | Example |
|---|---|---|
| **Format** | The outer loop: how turns, rounds and scoring flow | `team-turns`, `host-led` |
| **Game** | What happens inside a turn: what's shown, what players can do, how points are scored | Charades, Name Ten |
| **Variant** | Settings and content only. Same rules. | "Anime Charades with 90-second turns" |

A format is the outer loop, a game fills in the turn, and a variant fills in the settings and content.

For example, Charades and Name Ten share the **team-turns** format: teams take timed turns over several rounds, the phone is passed between teams, and scores are tallied at the end. They are different games because their turns are different. In Charades you act out as many terms as you can before time runs out; in Name Ten you name ten things in a category.

### Anatomy of a game

Every game is made of three parts:

| Part | What it is | Written in |
|---|---|---|
| **Machine** | The game's flow: its phases (e.g. `handoff → turn → turn_summary → results`), the events that move between them, and the rules that decide what happens | TypeScript |
| **Content** | The items the game uses (terms, categories, questions, roles), grouped into packs | JSON |
| **Views** | What each phase looks like, built from shared UI building blocks | React |

The machine is a small, typed state machine. Each phase declares which events it accepts and where they lead. Decisions ("are there rounds left?") and effects ("add a point") are named functions defined by the game. A simplified Charades turn:

```ts
turn: {
  interaction: "flash_card",
  on: {
    got:     { actions: ["scorePoint", "drawItem"] },
    skip:    { actions: ["applySkipPenalty", "drawItem"] },
    time_up: { to: "turn_summary" },
  },
},
```

Guards and actions are pure functions. They don't touch the screen, the clock or randomness directly, so every game can be tested by replaying it from start to finish.

---

## Contributing

There are three ways to contribute. Only one of them needs code.

### 1. Add or improve content (no code)

Each game's content lives in `src/games/<game>/content/`, one JSON file per pack:

```json
{
  "id": "anime",
  "name": "Anime",
  "description": "Characters, places and moves from popular anime.",
  "language": "en",
  "maturity": "everyone",
  "authors": ["your-github-handle"],
  "items": [
    { "text": "Goku", "tags": ["character"], "modes": ["describe"] }
  ]
}
```

- Add items to an existing pack, or create a new pack file.
- `maturity` is `everyone`, `teen` or `adult`.
- Every pack is checked automatically against the game's schema. Your editor will autocomplete and flag mistakes as you type.
- Content is text only: no images or media.
- No content about private individuals, and no hateful content.

An editor for reviewing and changing content without touching JSON is planned.

### 2. Add a theme (no code)

Themes are JSON files of design tokens (colors for light and dark mode, fonts, corner radius, motion) in `src/themes/`. *Theme support is planned; the format will be documented here when it lands.*

### 3. Add a game (code)

1. **Check that it fits a format.** If your game fits `team-turns` or `host-led`, you can build it today. If it fits neither, open an issue describing it instead. Games that don't fit an existing format wait for a new format rather than being forced into one.
2. **Open an issue** with the rules, the format it uses, and what a content item looks like.
3. **Create the game folder:**
   ```
   src/games/<game-id>/
     index.ts          the single game definition (defineGame)
     machine.ts        phases, guards and actions
     machine.test.ts   tests (required)
     schema.ts         content item and settings schemas
     views/            one view per phase
     content/*.json    at least one content pack
     rules.md          rules as shown to players
     README.md         rules summary and content guidelines for contributors
   ```
4. **Build on shared pieces.** Use the format's phases and helpers, and the shared UI building blocks (flash card, prompt card, multiple choice, handoff screen, timer, leaderboard…). Custom UI is fine when nothing shared fits; explain why in your pull request.
5. **Test it.** Include a test that plays a full game from start to finish, plus tests for each guard and action.

*The SDK (`defineGame`, the machine runner and the formats) is being built alongside the first game. Step-by-step instructions and a starter game folder will be added here once Charades is complete.*

### Pull requests

Every pull request must pass these checks: type checking, linting, tests, content validation and a production build. Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat(charades): …`, `content(name-ten): …`, `fix(sdk): …`).

Changes to the shared SDK or the content pack format affect every game, so they're recorded as short decision records in `docs/decisions/`.

---

## Project structure

```
src/
  app/          library page, setup flow, routing, save/resume
  sdk/          defineGame, machine runner, formats, shared UI building blocks
  ui/           low-level components
  games/<id>/   one folder per game
  themes/       theme token files
scripts/        content validation and schema generation
docs/decisions/ decision records
```

## Development

Built with Vite, React, TypeScript, Tailwind CSS and Vitest. Uses [pnpm](https://pnpm.io/).

*Setup and run instructions will be added once the project is scaffolded.*

## License

- **Code:** [MIT](https://opensource.org/license/mit)
- **Content packs** (`src/games/*/content/`): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Reuse them anywhere, including commercially, with credit.

By contributing, you agree that your contributions are licensed under these terms.

---

Made by Adeiza Gaming & friends.
