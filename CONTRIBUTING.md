# Contributing to Ku Zo Wasa

There are three ways to contribute. Only one of them needs code.

The rules every game, pack and theme follows are in the [Game Standard](docs/game-standard.md). This file covers how to contribute; the standard covers what a contribution must look like.

> **Status: early development.** Charades is playable, so new Charades packs are welcome now. Game contributions become practical once Charades is complete and the SDK settles; until then, issues and feedback on the standard are the most useful contributions.

---

## 1. Add or improve content (no code)

Each game's content lives in `src/games/<game>/content/`, one JSON file per pack:

```json
{
  "$schema": "../../../../schemas/charades.pack.schema.json",
  "id": "anime",
  "name": "Anime",
  "description": "Characters, places and moves from popular anime.",
  "language": "en",
  "maturity": "everyone",
  "contributors": ["your-github-handle"],
  "items": [
    { "text": "Goku", "tags": ["character"] },
    { "text": "Kamehameha", "tags": ["move"], "modes": ["describe", "act"] }
  ]
}
```

- Add items to an existing pack, or create a new pack file. The easiest way to start a new pack is to copy an existing one in the same folder.
- The file name is the pack's `id`: the pack above is `anime.json`.
- `maturity` is `everyone`, `teen` or `adult`.
- Don't list the same item twice in one pack ("Goku" and "goku " count as the same). The same item in two different packs is fine.
- Keep the `$schema` line, with the game's name in it. With it, editors such as VS Code suggest fields, explain each one when you hover over it, and underline mistakes as you type.
- To try your pack, run `pnpm dev` and open Charades: every pack in the folder is listed on its setup screen.
- Every pack is also checked automatically when you open a pull request. If something's wrong, the "Validate content" check lists each problem with the item it's in, e.g. `items.3 ("Goku"): "text" is missing`. If you have the project set up locally, `pnpm validate-content` runs the same check.
- Text only: no images or media.
- No content about private individuals, and no hateful content.

Full rules: [Game Standard §10](docs/game-standard.md#10-content-packs).

### Fix a game's rules (no code)

Each game's rules are in `src/games/<game>/rules.md`, shown on its How to play screen. Fix a sentence, explain a rule better, or add a tip.

- Use only `#`, `##` and `###` headings, paragraphs, lists starting with `- ` or `1. `, and `**bold**`.
- Anything else (tables, links, images, code, italics, indented lines) fails the checks on your pull request, with the line number and what to do instead.
- If the rules talk about points or settings, they describe the defaults; say so ("Unless you change them…").

## 2. Add a theme (no code)

A theme is one JSON file in `src/themes/`: its colors, fonts, corner rounding, shadows and outlines, and looks picked from a menu (paper cards, a starfield, tape…). Players pick it with the palette button on the home page.

1. **Copy a theme** that's close to your idea (`sunrise.json` or `sticky-notes.json` for light, `sunset.json`, `space-travel.json` or `chalkboard.json` for dark) and rename it. The file name is the theme's `id`: `ocean.json` has `"id": "ocean"`.
2. **Choose `"scheme"`**: `"light"` or `"dark"`. A theme is always one or the other: it doesn't change with the phone's dark mode. For both versions of an idea, make two themes.
3. **Set every color.** Each `-foreground` color is for text on the color it's named after: `primary-foreground` is the label on a `primary` button. Write colors as `"#ff8800"` or `"oklch(0.64 0.19 42)"` (lightness 0–1, chroma 0–0.5, hue 0–360).
4. **Pick the rest** (all optional):
   - `fonts.body` and `fonts.heading`: ids from the font list in `src/sdk/theme/fonts.ts`, such as `nunito` or `caveat`.
   - `radius`: corner rounding in rem, from 0 (square) to 2.
   - `shadow`: `flat`, `soft` or `bold`.
   - `border`: `thin` or `thick`.
   - `gradient`: `{ "from": "background", "to": "muted" }` fades the page between two of your colors.
   - `duration`: animation speed in milliseconds.
5. **Pick parts** (all optional), under `"parts"`. Each is a look someone has already built, so it works on every screen:

   | Part | Options |
   |---|---|
   | `surface`: cards and dialogs | `plain`, `paper`, `sticky-note`, `glass`, `chalkboard` |
   | `button` | `solid`, `chunky`, `sticker`, `glass`, `chalk` |
   | `background`: the page | `flat`, `lined-paper`, `dot-grid`, `chalk-dust`, `starfield` (moves gently; still for players who turn motion off) |
   | `decoration`: on the card being played and on dialogs | `none`, `tape`, `pushpin`, `planets`, `chalk-smudge` |
   | `icons` | `thin`, `regular`, `bold` |

   Parts use your colors: `chalkboard` cards are framed in your `border` color, `planets` are your `primary`. Want a look that isn't on the menu? Open an issue: a new part is a code change.
6. **Credit yourself** in `contributors`, and keep the `$schema` line: with it, your editor suggests fields and explains each one.

**Contrast is checked for you.** When you open a pull request, the "Validate content" check also measures every text color and outline against what it's drawn on (both ends of a gradient, and the page behind `glass` cards) and fails if one is too hard to read, e.g. `primary-foreground on primary (text) has a contrast of 3.52 : 1; it needs at least 4.5 : 1`. Make one of the two colors lighter or darker until it passes. `pnpm validate-content` runs the same check locally.

A font that isn't on the list needs a code change (it has to be open-licensed and bundled): open an issue asking for it.

Full rules: [Game Standard §11](docs/game-standard.md#11-themes).

## 3. Add a game (code)

1. **Check that it fits a format.** If your game fits `team-turns` or `host-led`, it can be built on the shared SDK. If it fits neither, open an issue describing it instead. Games that don't fit an existing format wait for a new format rather than being forced into one. See [Game Standard §7](docs/game-standard.md#7-formats).
2. **Open an issue** with the rules, the format it uses, and what a content item looks like.
3. **Create the game folder** as described in [Game Standard §9](docs/game-standard.md#9-repo-layout), then add the game to the list in `src/app/registry/index.ts`. If its `meta.icon` isn't in `src/app/library/gameIcon.ts` yet, add it there.
4. **Build on shared pieces.** Use the format's phases and helpers, and the shared interaction primitives ([§6](docs/game-standard.md#6-interaction-primitives)). Custom UI is fine when nothing shared fits; explain why in your pull request.
5. **Credit yourself.** Add your GitHub handle to `meta.contributors`, and to `contributors` on any variant (preset) you create. See [Game Standard §3](docs/game-standard.md#3-game-definition).
6. **Test it.** Include a test that plays a full game from start to finish, plus tests for each guard and action.
7. **Check the [Definition of Done](docs/game-standard.md#13-definition-of-done-per-game)** before asking for review.

### Step by step

[Name Ten](src/games/name-ten/) is the smallest complete game with a turn of its own: copy its folder as your starting point, and read [Charades](src/games/charades/) for a game with more settings. For a multiple-choice game, start from [This or That](src/games/this-or-that/) instead: it's the SDK's choice turn with a schema, defaults and content, and steps 4 to 6 below are one line each. The order below is the one that works, because each file builds on the one before:

1. **`schema.ts`: what a content item is.** A zod `itemSchema` and an `itemKey` (what makes two items the same). Import only zod and `src/sdk/`: scripts load this file on its own.
2. **`content/<pack>.json`: at least one pack.** Then run `pnpm generate-schemas` (it finds your game by its folder) and `pnpm validate-content`.
3. **`config.ts`: settings**, if your game has its own. Extend `TeamTurnsConfig`; defaults go in the schema.
4. **`machine.ts`: the turn.** Use `teamTurns()` from `src/sdk/formats/team-turns/`. You write the turn's phases, guards and actions, and `points(turn, config)`; the format runs the handoff, timer, item pool, summary and results. Use the machine's `rng` for anything random (never `Math.random`), so a saved game plays back the same.
5. **`machine.test.ts`.** A full game from the first handoff to the results, `validateMachine`, and one test per guard and per action. Start from Name Ten's tests. An action is called with `{ context, event, rng, now }`.
6. **`views/`: one view per phase of your own,** built from the primitives in `src/sdk/interactions/` ([§6](docs/game-standard.md#6-interaction-primitives)). Replace one of the format's views (handoff, turn summary, results) only when its words are wrong for your game, as Name Ten does for its judge. A settings view goes in `config.view` ([ADR 0008](docs/decisions/0008-settings-and-presets.md)).
7. **`rules.md`,** in the small part of markdown the rules screen shows ([ADR 0009](docs/decisions/0009-rules.md)).
8. **`index.ts`: `defineGame`.** It checks meta, packs, presets, rules and that every phase has a view, and lists every problem at once.
9. **Register it:** add it to the list in `src/app/registry/index.ts`, and its icon to `src/app/library/gameIcon.ts`. The app's setup, save and resume, rules page and themes then work for it with no other changes.
10. **`README.md`:** the rules in short, content guidelines, and what each file is.
11. **Check:** `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm validate-content` and `pnpm build`, then play it on a phone with `pnpm dev --host`, under every theme.

If something your game needs isn't in the SDK (a primitive, or a word in a shared screen that only fits another game), change the SDK and write a short decision record in `docs/decisions/`. Name Ten needed a board primitive and new words on two shared screens ([ADR 0012](docs/decisions/0012-name-ten.md)), and a phase before its turn to choose a category ([ADR 0014](docs/decisions/0014-a-phase-before-the-turn.md)). Trivia Night added a multiple-choice card and the rules for a question's options (`src/sdk/content/choices.ts`), for any multiple-choice game to use ([ADR 0015](docs/decisions/0015-trivia-night.md)); its whole turn then moved into the SDK as the choice turn, so a new multiple-choice game is mostly a schema, defaults and content ([ADR 0017](docs/decisions/0017-a-shared-choice-turn-and-this-or-that.md)). A game can add phases after its turn (a review) and one before it (`beforeTurn`).

---

## Pull requests

- Every pull request must pass: type checking, linting, tests, content validation and a production build.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/): `feat(charades): …`, `content(name-ten): …`, `fix(sdk): …`.
- Pull requests are usually squash-merged into one commit, so your branch commits don't need to be tidy. The PR title becomes the commit message, so make the title follow Conventional Commits.
- Changes to the shared SDK or the content pack format affect every game, so they need a short decision record in `docs/decisions/`.
- A new runtime dependency must be justified in the pull request description.

## License

By contributing, you agree that your code is licensed under [MIT](https://opensource.org/license/mit) and your content packs under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
