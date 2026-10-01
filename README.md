# Ku Zo Wasa

**Party games for one phone.** Play at **[kuzowasa.com](https://www.kuzowasa.com)**.

An open-source library of **single-device party games**: charades, name ten, trivia, mafia and more. Pass one phone around the room, or let one person host. No accounts, no app install, no setup beyond picking teams.

The library is built to be extended. Developers can add games, designers can add themes, and anyone can add or improve the words, categories and questions the games use.

> **Status: early development.** The game standard is settled; the code is being built now. Expect breaking changes until the first release.

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

## How games work

| Level | What it decides | Example |
|---|---|---|
| **Format** | The outer loop: how turns, rounds and scoring flow | `team-turns`, `host-led` |
| **Game** | What happens inside a turn: what's shown, what players can do, how points are scored | Charades, Name Ten |
| **Variant** | Settings and content only. Same rules. | "Anime Charades with 90-second turns" |

Each game is a small typed state machine (its flow), JSON content packs (its words, categories or questions), and React views built from shared building blocks. The full contract is in the **[Game Standard](docs/game-standard.md)**.

## Contributing

You can add content, add a theme, or add a game. Only adding a game needs code. See **[CONTRIBUTING.md](CONTRIBUTING.md)**.

## Development

Built with Vite, React, TypeScript, Tailwind CSS and Vitest. Uses [pnpm](https://pnpm.io/).

You need [Node.js](https://nodejs.org/) 20.19+ or 22.12+ and pnpm 10.

```bash
pnpm install    # install dependencies
pnpm dev        # start the dev server
pnpm test       # run the tests once (pnpm test:watch re-runs on save)
pnpm typecheck  # check types without building
pnpm lint       # check code style and folder boundaries
pnpm build      # type-check and build to dist/
pnpm preview    # serve the production build locally
```

## License

- **Code:** [MIT](LICENSE)
- **Content packs** (`src/games/*/content/`): [CC BY 4.0](LICENSE-CONTENT.md). Reuse them anywhere, including commercially, with credit.

By contributing, you agree that your contributions are licensed under these terms.

---

Made by Adeiza Gaming & friends.
