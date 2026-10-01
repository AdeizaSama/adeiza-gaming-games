# Contributing to Ku Zo Wasa

There are three ways to contribute. Only one of them needs code.

The rules every game, pack and theme follows are in the [Game Standard](docs/game-standard.md). This file covers how to contribute; the standard covers what a contribution must look like.

> **Status: early development.** The SDK, CI and content validation are being built now. Content and game contributions become practical once Charades is complete; until then, issues and feedback on the standard are the most useful contributions.

---

## 1. Add or improve content (no code)

Each game's content lives in `src/games/<game>/content/`, one JSON file per pack:

```json
{
  "id": "anime",
  "name": "Anime",
  "description": "Characters, places and moves from popular anime.",
  "language": "en",
  "maturity": "everyone",
  "contributors": ["your-github-handle"],
  "items": [
    { "text": "Goku", "tags": ["character"], "modes": ["describe"] }
  ]
}
```

- Add items to an existing pack, or create a new pack file.
- `maturity` is `everyone`, `teen` or `adult`.
- Every pack is checked against the game's schema. Your editor will autocomplete and flag mistakes as you type.
- Text only: no images or media.
- No content about private individuals, and no hateful content.

Full rules: [Game Standard §10](docs/game-standard.md#10-content-packs).

## 2. Add a theme (no code)

Themes are JSON files of design tokens (colors for light and dark mode, fonts, corner radius, motion) in `src/themes/`. *Theme support is planned; the token format will be documented here when it lands.*

## 3. Add a game (code)

1. **Check that it fits a format.** If your game fits `team-turns` or `host-led`, it can be built on the shared SDK. If it fits neither, open an issue describing it instead. Games that don't fit an existing format wait for a new format rather than being forced into one. See [Game Standard §7](docs/game-standard.md#7-formats).
2. **Open an issue** with the rules, the format it uses, and what a content item looks like.
3. **Create the game folder** as described in [Game Standard §9](docs/game-standard.md#9-repo-layout).
4. **Build on shared pieces.** Use the format's phases and helpers, and the shared interaction primitives ([§6](docs/game-standard.md#6-interaction-primitives)). Custom UI is fine when nothing shared fits; explain why in your pull request.
5. **Credit yourself.** Add your GitHub handle to `meta.contributors`, and to `contributors` on any variant (preset) you create. See [Game Standard §3](docs/game-standard.md#3-game-definition).
6. **Test it.** Include a test that plays a full game from start to finish, plus tests for each guard and action.
7. **Check the [Definition of Done](docs/game-standard.md#13-definition-of-done-per-game)** before asking for review.

*Step-by-step instructions and a starter game folder will be added here once Charades is complete.*

---

## Pull requests

- Every pull request must pass: type checking, linting, tests, content validation and a production build.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/): `feat(charades): …`, `content(name-ten): …`, `fix(sdk): …`.
- Changes to the shared SDK or the content pack format affect every game, so they need a short decision record in `docs/decisions/`.
- A new runtime dependency must be justified in the pull request description.

## License

By contributing, you agree that your code is licensed under [MIT](https://opensource.org/license/mit) and your content packs under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
